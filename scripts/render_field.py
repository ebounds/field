#!/usr/bin/env python3
"""Render Field grammar v4, rendering revision 4.3. Python standard library only."""
import argparse
import json
import math
from pathlib import Path
from xml.sax.saxutils import escape

PALETTE = {
    "teal": "#42BDB0", "blue": "#648DE5", "violet": "#9B7BE8",
    "amber": "#E8B86A", "coral": "#D97979", "pearl": "#DDE5EA",
}
RENDERER_REVISION = "4.3"


def srgb_to_linear(v):
    return v / 12.92 if v <= .04045 else ((v + .055) / 1.055) ** 2.4


def linear_to_srgb(v):
    return 12.92 * v if v <= .0031308 else 1.055 * v ** (1 / 2.4) - .055


def to_oklab(color):
    channels = [srgb_to_linear(int(color[i:i + 2], 16) / 255) for i in (1, 3, 5)]
    r, g, b = channels
    l = (.4122214708*r + .5363325363*g + .0514459929*b) ** (1/3)
    m = (.2119034982*r + .6806995451*g + .1073969566*b) ** (1/3)
    s = (.0883024619*r + .2817188376*g + .6299787005*b) ** (1/3)
    return (.2104542553*l + .7936177850*m - .0040720468*s,
            1.9779984951*l - 2.4285922050*m + .4505937099*s,
            .0259040371*l + .7827717662*m - .8086757660*s)


def from_oklab(lab):
    lightness, a, b = lab
    l = (lightness + .3963377774*a + .2158037573*b) ** 3
    m = (lightness - .1055613458*a - .0638541728*b) ** 3
    s = (lightness - .0894841775*a - 1.2914855480*b) ** 3
    channels = (4.0767416621*l - 3.3077115913*m + .2309699292*s,
                -1.2684380046*l + 2.6097574011*m - .3413193965*s,
                -.0041960863*l - .7034186147*m + 1.7076147010*s)
    return tuple(linear_to_srgb(v) for v in channels)


def oklab_hex(lab):
    # Reduce chroma only when a requested color falls outside portable sRGB.
    lightness, a, b = lab
    channels = from_oklab(lab)
    if min(channels) < 0 or max(channels) > 1:
        low, high = 0., 1.
        for _ in range(14):
            middle = (low + high) / 2
            trial = from_oklab((lightness, a*middle, b*middle))
            if min(trial) >= 0 and max(trial) <= 1:
                low = middle
            else:
                high = middle
        channels = from_oklab((lightness, a*low, b*low))
    return '#' + ''.join(f'{round(max(0,min(1,x))*255):02X}' for x in channels)
DEFAULTS = {
    "version": 4, "primary": "teal", "secondary": "blue", "accent": None,
    "openness": 0.5, "tension": 0.15, "definition": 0.65,
    "complexity": 0.35, "intensity": 0.5, "imbalance": 0.0,
    "gesture": "none", "gesture_strength": 0.0,
    "breadth": 0.4, "folding": 0.2, "stretch": 0.0, "flow": 0.0,
    "saturation": 0.85, "ambient": None, "ambient_strength": 0.25,
    "accent_strength": 0.4,
    "form": "envelope", "history": 0.0, "counterpoint": 0.0,
}


def validate(spec):
    if not isinstance(spec, dict):
        raise ValueError("The drawing specification must be a JSON object")
    unknown = set(spec) - set(DEFAULTS)
    if unknown:
        raise ValueError("Unknown controls: " + ", ".join(sorted(unknown)))
    p = dict(DEFAULTS, **spec)
    if type(p["version"]) is not int or p["version"] != 4:
        raise ValueError("Use Field drawing specification version 4")
    if not isinstance(p["primary"], str) or p["primary"] not in PALETTE:
        raise ValueError("primary must be a palette name")
    for key in ("secondary", "accent", "ambient"):
        if p[key] is not None and (not isinstance(p[key], str) or p[key] not in PALETTE):
            raise ValueError(key + " must be a palette name or null")
    for key in ("openness", "tension", "definition", "complexity", "intensity",
                "imbalance", "gesture_strength", "breadth", "folding", "stretch", "flow",
                "ambient_strength", "accent_strength", "history", "counterpoint"):
        x = p[key]
        low = -1 if key in ("imbalance", "stretch", "flow") else 0
        if type(x) not in (int, float) or not math.isfinite(x) or not low <= x <= 1:
            raise ValueError(f"{key} must be a finite number between {low} and 1")
    if type(p["saturation"]) not in (int, float) or not math.isfinite(p["saturation"]) or not .25 <= p["saturation"] <= 1.35:
        raise ValueError("saturation must be between .25 and 1.35")
    if p["gesture"] not in ("none", "fold", "echo", "braid"):
        raise ValueError("gesture must be none, fold, echo, or braid")
    if p["form"] not in ("envelope", "sweep", "mantle"):
        raise ValueError("form must be envelope, sweep, or mantle")
    return p


def points_path(points, close=False):
    """Interpolate a sampled contour without visible polygon corners."""
    result = [f"M{points[0][0]:.2f},{points[0][1]:.2f}"]
    for i in range(len(points) - 1):
        before, here = points[max(0, i - 1)], points[i]
        after, beyond = points[i + 1], points[min(len(points) - 1, i + 2)]
        c1 = tuple(here[k] + (after[k] - before[k]) / 6 for k in (0, 1))
        c2 = tuple(after[k] - (beyond[k] - here[k]) / 6 for k in (0, 1))
        result.append(f"C{c1[0]:.2f},{c1[1]:.2f} {c2[0]:.2f},{c2[1]:.2f} {after[0]:.2f},{after[1]:.2f}")
    return " ".join(result) + (" Z" if close else "")


def render(spec):
    p = validate(spec)
    def pigment(name):
        lightness, a, b = to_oklab(PALETTE[name])
        return oklab_hex((lightness, a*p['saturation'], b*p['saturation']))

    def mix(a, b, amount):
        first, second = to_oklab(a), to_oklab(b)
        return oklab_hex(tuple(x*(1-amount)+y*amount for x,y in zip(first,second)))

    def light(color, amount):
        # More or less illumination in the chosen material, retaining its hue.
        lightness, a, b = to_oklab(color)
        return oklab_hex((min(.91, lightness * amount), a, b))

    c1 = pigment(p["primary"])
    c2 = pigment(p["secondary"] or p["primary"])
    ca = pigment(p["accent"] or p["primary"])
    ambient = pigment(p['ambient'] or p['primary'])
    climate = p['ambient_strength']
    bg_centre = mix('#101A25', ambient, .03 + .38*climate)
    bg_edge = mix('#080D16', ambient, .02 + .12*climate)
    o, t, d, c, power, skew = (p[k] for k in
        ("openness", "tension", "definition", "complexity", "intensity", "imbalance"))
    breadth, fold, stretch = p['breadth'], p['folding'], p['stretch']
    form = p['form']
    a = (218 + 157*o) * (1 + .32*max(0, stretch) - .28*max(0, -stretch))
    b = (153 + 131*o) * (1 + .50*max(0, -stretch) - .25*max(0, stretch))
    gap = math.radians(6 + 112 * o)
    start = -0.42 + gap / 2
    end = 2 * math.pi - 0.42 - gap / 2
    turn = math.radians(-18 + 38*p['flow'])
    strength = 0.26 + 0.65 * power

    def bezier(u, p0, p1, p2, p3):
        v = 1-u
        return tuple(v**3*p0[k] + 3*v*v*u*p1[k] + 3*v*u*u*p2[k] + u**3*p3[k] for k in (0, 1))

    def raw_point(u, inset=0, ripple=0):
        if form != 'envelope':
            if form == 'sweep':
                if u <= .5:
                    x, y = bezier(2*u, (-340,170), (-250,250), (-130,90), (-20,110))
                else:
                    x, y = bezier(2*u-1, (-20,110), (110,125), (190,-150), (345,-175))
            else:
                if u <= .5:
                    x, y = bezier(2*u, (-285,180), (-360,-40), (-180,-270), (0,-250))
                else:
                    x, y = bezier(2*u-1, (0,-250), (180,-255), (360,-50), (285,180))
            envelope = math.sin(math.pi*u)
            x = x*a/295 + 34*skew*envelope + 15*fold*math.sin(5*math.pi*u-.7)*envelope
            y = y*b/215 + 30*t*math.exp(-((u-.48)/.13)**2) + 22*fold*math.sin(3*math.pi*u+.25)*envelope
            return (x*math.cos(turn)-y*math.sin(turn), x*math.sin(turn)+y*math.cos(turn))
        theta = start + (end - start) * u
        phase = math.atan2(math.sin(theta - 2.65), math.cos(theta - 2.65))
        strain = math.exp(-(phase / 0.38) ** 2)
        r = 1 - 0.36 * t * strain + 0.065 * skew * math.cos(theta)
        r += fold*(.18*math.sin(3*theta+.5) + .07*math.cos(5*theta-.7))
        r += ripple * math.sin(theta * (5 + 3*c) + 0.7)
        x = (a - inset) * math.cos(theta) * r
        y = (b - inset * 0.68) * math.sin(theta) * r
        x += 52 * skew * math.sin(theta) ** 2
        return (x * math.cos(turn) - y * math.sin(turn),
                x * math.sin(turn) + y * math.cos(turn))

    # Keep every expressive posture in the same frame with substantial margins.
    extent = max(abs(v) for i in range(201) for v in raw_point(i/200))
    fit = min(1, 395/max(1, extent))

    def point(u, inset=0, ripple=0):
        if form == 'envelope':
            x, y = raw_point(u, inset, ripple)
        else:
            x, y = raw_point(u)
            before = raw_point(max(0,u-.001))
            after = raw_point(min(1,u+.001))
            dx, dy = after[0]-before[0], after[1]-before[1]
            length = max(1e-6, math.hypot(dx, dy))
            nx, ny = ((dy/length, -dx/length) if form == 'sweep'
                      else (-dy/length, dx/length))
            x += inset*nx
            y += inset*ny
        return (500 + fit*x, 500 + fit*y)

    n = 96
    us = [i / n for i in range(n + 1)]

    def thickness(u):
        theta = start + (end - start) * u
        taper = max(0, math.sin(math.pi * u)) ** 0.42
        width = (16 + 91*breadth + 17*power + 15*(1-d))
        width *= taper * (.78 + .22*math.sin(theta+fold))
        pinch_phase = math.atan2(math.sin(theta-2.65), math.cos(theta-2.65))
        pinch = math.exp(-(pinch_phase/.45)**2)
        width *= (1-.18*t*pinch) * (1+.17*fold*math.sin(3*theta+.8))
        return min(width, min(a,b)*.48)

    def surface_point(u, fraction):
        # Small changes of surface direction reveal the existing folds. The two
        # boundaries, aperture, scale and negative space are unchanged.
        drift = .075 * fold * math.sin(3 * math.pi * u + fraction * 2)
        drift *= math.sin(math.pi * fraction)
        return point(u, thickness(u) * (fraction + drift))

    def ribbon(outside, inside):
        upper = [surface_point(u, outside) for u in us]
        lower = [surface_point(u, inside) for u in reversed(us)]
        # Separate contours preserve the deliberate cusp at each tapered end.
        return points_path(upper) + " " + points_path(lower).replace("M", "L", 1) + " Z"

    def tapered_strip(u0, u1, centre, spread, bend=0):
        """A lens of light or shade attached to the same curved surface."""
        section = [u0 + (u1-u0)*i/64 for i in range(65)]
        def margins(u):
            v = (u-u0)/(u1-u0)
            taper = max(0, math.sin(math.pi*v)) ** 1.4
            middle = centre + bend*fold*math.sin(4*math.pi*u+.4)
            half = spread*taper*(.86+.14*math.cos(6*math.pi*u))
            return middle-half, middle+half
        outside = [surface_point(u, margins(u)[0]) for u in section]
        inside = [surface_point(u, margins(u)[1]) for u in reversed(section)]
        return points_path(outside) + " " + points_path(inside).replace("M", "L", 1) + " Z"

    def history_ridge():
        # A displaced reflection of the present surface, reunited at both tips.
        # It is a retained influence, not a band for an earlier episode.
        def location(u, fraction, displacement):
            x, y = surface_point(u, fraction)
            outer = point(u, 0)
            inner = point(u, 1)
            dx, dy = inner[0]-outer[0], inner[1]-outer[1]
            length = max(1e-6, math.hypot(dx, dy))
            return (x-displacement*dx/length, y-displacement*dy/length)
        def offset(u):
            return p['history']*(22+26*breadth)*math.sin(math.pi*u)**1.6*(.84+.16*math.cos(3*math.pi*u))
        outer = [location(u, .07, offset(u)) for u in us]
        inner = [location(u, .34, offset(u)*.17) for u in reversed(us)]
        shape = points_path(outer) + ' ' + points_path(inner).replace('M', 'L', 1) + ' Z'
        edge = points_path([location(u, .07, offset(u)) for u in us if .16 <= u <= .84])
        return shape, edge

    def countercurrent():
        # Two surfaces part and join within the same continuous material.
        section = [.14] + [u for u in us if .14 < u < .86] + [.86]
        def parting(u):
            v = (u-.14)/.72
            return .37*p['counterpoint']*math.sin(math.pi*v)**1.4
        near = [surface_point(u, .40) for u in section]
        far = [surface_point(u, .40+parting(u)) for u in reversed(section)]
        lens = points_path(near) + ' ' + points_path(far).replace('M', 'L', 1) + ' Z'
        seam = points_path([surface_point(u, .40+parting(u)) for u in section])
        return lens, seam

    outline = ribbon(0, 1)
    soft = 1.5 + 18 * (1 - d)
    metadata = escape(json.dumps(p, sort_keys=True, separators=(",", ":")))
    svg = [f'''<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="1000" viewBox="0 0 1000 1000" role="img" aria-label="A central titanium capsule with a unified abstract field" data-field-version="4" data-field-renderer="{RENDERER_REVISION}">
<metadata id="field-spec">{metadata}</metadata>
<defs>
  <radialGradient id="background"><stop stop-color="{bg_centre}"/><stop offset="1" stop-color="{bg_edge}"/></radialGradient>
  <linearGradient id="field-ink" x1="18%" y1="72%" x2="82%" y2="27%"><stop stop-color="{c1}"/><stop offset=".38" stop-color="{c2}"/><stop offset=".69" stop-color="{mix(c1,ca,p['accent_strength']*.85) if p['accent'] else c1}"/><stop offset="1" stop-color="{c1}"/></linearGradient>
  <radialGradient id="field-atmosphere"><stop stop-color="{c1}" stop-opacity="{.07+.18*breadth:.3f}"/><stop offset=".6" stop-color="{c2}" stop-opacity="{.02+.08*breadth:.3f}"/><stop offset="1" stop-color="{c1}" stop-opacity="0"/></radialGradient>
  <linearGradient id="field-accent-ink"><stop stop-color="{ca}" stop-opacity="0"/><stop offset=".5" stop-color="{ca}" stop-opacity=".72"/><stop offset="1" stop-color="{ca}" stop-opacity="0"/></linearGradient>
  <linearGradient id="field-edge-ink" gradientUnits="userSpaceOnUse" x1="180" y1="720" x2="820" y2="270"><stop stop-color="{c1}" stop-opacity=".1"/><stop offset=".32" stop-color="{c2}" stop-opacity=".75"/><stop offset=".58" stop-color="{c1}" stop-opacity=".15"/><stop offset="1" stop-color="{c1}" stop-opacity=".6"/></linearGradient>
  <linearGradient id="field-crest" gradientUnits="userSpaceOnUse" x1="170" y1="690" x2="790" y2="280"><stop stop-color="{light(c1,1.28)}" stop-opacity=".25"/><stop offset=".36" stop-color="{light(c2,1.45)}" stop-opacity=".9"/><stop offset=".68" stop-color="{light(c1,1.3)}" stop-opacity=".35"/><stop offset="1" stop-color="{light(c1,1.4)}" stop-opacity=".65"/></linearGradient>
  <linearGradient id="field-depth" gradientUnits="userSpaceOnUse" x1="230" y1="730" x2="760" y2="300"><stop stop-color="#0B1520" stop-opacity="0"/><stop offset=".35" stop-color="#0B1520" stop-opacity=".48"/><stop offset=".7" stop-color="#0B1520" stop-opacity=".1"/><stop offset="1" stop-color="#0B1520" stop-opacity=".3"/></linearGradient>
  <linearGradient id="field-history-ink" gradientUnits="userSpaceOnUse" x1="190" y1="730" x2="810" y2="270"><stop stop-color="{c2}" stop-opacity=".22"/><stop offset=".47" stop-color="{light(c1,1.12)}" stop-opacity=".65"/><stop offset="1" stop-color="{c2}" stop-opacity=".2"/></linearGradient>
  <linearGradient id="drone-metal" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#34414D"/><stop offset=".5" stop-color="#202B35"/><stop offset="1" stop-color="#101922"/></linearGradient>
  <linearGradient id="drone-rim" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#DDE5EA" stop-opacity=".68"/><stop offset=".6" stop-color="#8C9BA9" stop-opacity=".21"/><stop offset="1" stop-color="#DDE5EA" stop-opacity=".30"/></linearGradient>
  <filter id="field-soft" x="-25%" y="-25%" width="150%" height="150%" color-interpolation-filters="sRGB"><feGaussianBlur stdDeviation="{soft:.2f}"/></filter>
  <filter id="field-diffuse" x="-25%" y="-25%" width="150%" height="150%" color-interpolation-filters="sRGB"><feGaussianBlur stdDeviation="{1.2+5*(1-d)**2:.2f}"/></filter>''']
    # Continuous translucent surface, with light gathered into a broad shoulder
    # and released toward the inner edge. Complexity never controls brightness.
    lanes = 28
    for j in range(lanes):
        f = (j + .5) / lanes
        illumination = .46 + .66 * math.exp(-((f - .27) / .3) ** 2)
        illumination += .16 * math.exp(-((f - .91) / .13) ** 2)
        shades = [light(color, illumination) for color in
                  (c1, c2, mix(c1, ca, p['accent_strength']*.85) if p['accent'] else c1, c1)]
        svg.append(f'<linearGradient id="field-skin-{j}" gradientUnits="userSpaceOnUse" x1="180" y1="720" x2="820" y2="270"><stop stop-color="{shades[0]}"/><stop offset=".38" stop-color="{shades[1]}"/><stop offset=".69" stop-color="{shades[2]}"/><stop offset="1" stop-color="{shades[3]}"/></linearGradient>')
    svg.append(f'''</defs>
<rect id="field-background" width="1000" height="1000" fill="url(#background)"/>
<g id="field-envelope">
  <ellipse cx="500" cy="500" rx="{min(435,a*fit+45):.2f}" ry="{min(420,b*fit+65):.2f}" fill="url(#field-atmosphere)" transform="rotate({-18+38*p['flow']:.2f} 500 500)"/>''')
    if p['history']:
        ridge, edge = history_ridge()
        svg.append(f'<g id="field-history" opacity="{strength*p["history"]*(.54+.18*d):.3f}"><path d="{ridge}" fill="url(#field-history-ink)" filter="url(#field-diffuse)"/><path d="{edge}" fill="none" stroke="{light(c2,1.16)}" stroke-width="{.7+1.1*p["history"]:.2f}" opacity=".42"/></g>')
    svg.append(f'''
  <path d="{outline}" fill="url(#field-ink)" opacity="{strength*.28:.3f}" filter="url(#field-soft)"/>
  <path d="{outline}" fill="url(#field-ink)" opacity="{strength*(.18+.23*d):.3f}" filter="url(#field-diffuse)"/>
  <path d="{tapered_strip(.11,.9,.79,.15)}" fill="url(#field-depth)" opacity="{strength*(.08+.16*d):.3f}" filter="url(#field-diffuse)"/>
  <g id="field-surface" opacity="{strength*(.35+.1*d):.3f}" filter="url(#field-diffuse)">''')
    for j in range(lanes):
        svg.append(f'<path d="{ribbon(j/lanes, min(1,(j+1.65)/lanes))}" fill="url(#field-skin-{j})"/>')
    svg.append('  </g>')
    if p['counterpoint']:
        lens, seam = countercurrent()
        ink = ca if p['accent'] else c2
        svg.append(f'<g id="field-countercurrent" opacity="{strength*p["counterpoint"]*(.47+.23*d):.3f}"><path d="{lens}" fill="{ink}" filter="url(#field-diffuse)"/><path d="{seam}" fill="none" stroke="{light(ink,1.3)}" stroke-width="{.8+2.2*p["counterpoint"]:.2f}" opacity=".65"/></g>')
    svg.append(f'<path id="field-shoulder-light" d="{tapered_strip(.07,.94,.31,.13+.035*breadth,.12)}" fill="url(#field-crest)" opacity="{strength*(.45+.4*d):.3f}" filter="url(#field-diffuse)"/>')
    svg.append(f'<path id="field-grazing-light" d="{tapered_strip(.21,.75,.2,.045+.03*breadth,.08)}" fill="url(#field-crest)" opacity="{strength*(.35+.35*d):.3f}"/>')
    # A folded sheet catches light along changing curves inside its envelope.
    # The presence of this relief follows folding, never a separate art setting.
    if fold:
        svg.append(f'<g id="field-fold-light" fill="url(#field-edge-ink)" opacity="{strength*fold*(.1+.3*d):.3f}" filter="url(#field-diffuse)">')
        for phase in (0, math.pi):
            def seam(u):
                return .48 + .22*math.sin(2*math.pi*u+phase)*math.sin(math.pi*u)
            front = [surface_point(u, seam(u)) for u in us]
            back = [surface_point(u, seam(u)+.12*math.sin(math.pi*u)) for u in reversed(us)]
            svg.append(f'<path d="{points_path(front)} {points_path(back).replace("M", "L", 1)} Z"/>')
        svg.append('</g>')
        svg.append(f'<path id="field-fold-shadow" d="{tapered_strip(.28,.79,.53,.045+.08*fold,.14)}" fill="url(#field-depth)" opacity="{strength*fold*(.24+.24*d):.3f}" filter="url(#field-diffuse)"/>')
    svg.append(f'''  <path d="{points_path([surface_point(u, .06) for u in us])}" fill="none" stroke="url(#field-edge-ink)" stroke-width="{.65+.75*d:.2f}" opacity="{strength*d*.68:.3f}"/>
  <path d="{points_path([surface_point(u, .9) for u in us if .47 <= u <= .84])}" fill="none" stroke="url(#field-edge-ink)" stroke-width="{1+.8*d:.2f}" opacity="{strength*d*.6:.3f}"/>
</g>
<g id="field-filaments" fill="none" stroke="url(#field-edge-ink)" stroke-linecap="round" opacity="{strength*(.12+.88*d):.3f}">''')
    count = 1 + round(c * 10)
    for j in range(count):
        # Uneven intervals and lost edges give a few lines compositional weight.
        f = .12 + .79 * ((j + 1) / (count + 1)) ** 1.45
        lo = .015 + .045 * (j % 3)
        hi = .985 - .04 * ((j + 1) % 4)
        samples = [u for u in us if lo <= u <= hi]
        pts = []
        for u in samples:
            crossing = (.012*t + .045*fold) * math.sin(5*math.pi*u + j*.9)
            pts.append(surface_point(u, f + crossing * math.sin(math.pi*u)))
        weight = 1 if j % 3 == 0 else .55
        svg.append(f'<path d="{points_path(pts)}" stroke-width="{(.6+.65*d)*weight:.2f}" opacity="{(.22+.23*d)*weight:.3f}"/>')
    svg.append('</g>')
    svg.append('<g id="field-accent" fill="none">')
    if p["accent"]:
        # Accent lives within the same envelope; its location is not a topic axis.
        seg = [surface_point(u, .57) for u in us if .37 <= u <= .69]
        svg.append(f'<path d="{points_path(seg)}" stroke="url(#field-accent-ink)" stroke-width="{6+25*p["accent_strength"]:.2f}" opacity="{.25+.45*p["accent_strength"]:.2f}" filter="url(#field-soft)"/>')
        svg.append(f'<path d="{points_path(seg)}" stroke="url(#field-accent-ink)" stroke-width="{1+2*p["accent_strength"]:.2f}" opacity=".58"/>')
    # A short highlight articulates definition within the selected hue family.
    if d > .55:
        glint = [point(u, thickness(u)*.45) for u in us if .17 <= u <= .21]
        svg.append(f'<path d="{points_path(glint)}" stroke="{light(c1,1.18)}" stroke-width="1.2" opacity="{strength*(d-.55)*.7:.3f}"/>')
    svg.append('</g><g id="field-gesture" fill="none" stroke-linecap="round">')
    g, gs = p["gesture"], p["gesture_strength"]
    if g != "none" and gs:
        seg_us = [u for u in us if .28 <= u <= .64]
        for j in range(2 if g == "braid" else 1):
            pts = []
            for u in seg_us:
                v = (u-.28)/.36
                bow = math.sin(math.pi*v)
                wave = math.sin(v*math.pi*3+j*math.pi) if g == "braid" else bow
                inset = thickness(u)*.5 + (42 if g == "echo" else -38)*gs*wave*bow
                pts.append(point(u, inset))
            svg.append(f'<path d="{points_path(pts)}" stroke="{c2}" stroke-width="{1.2+1.3*gs:.2f}" opacity="{.20+.40*gs:.3f}"/>')
    svg.append('''</g>
<g id="drone-body">
  <rect x="436" y="468" width="128" height="64" rx="32" fill="url(#drone-metal)" stroke="url(#drone-rim)" stroke-width="1.5"/>
</g>
</svg>''')
    return "\n".join(svg) + "\n"


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument('--spec', type=Path, help='JSON drawing controls; defaults if omitted')
    ap.add_argument('--output', type=Path, required=True, help='Standalone SVG output')
    args = ap.parse_args()
    try:
        spec = json.loads(args.spec.read_text()) if args.spec else {}
        svg = render(spec)
    except (ValueError, OSError) as exc:
        ap.error(str(exc))
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(svg, encoding='utf-8')
    print(args.output)


if __name__ == '__main__':
    main()
