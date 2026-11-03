#!/usr/bin/env python3
"""Render Field grammar v4, rendering revision 4.6. Python standard library only."""
import argparse
import json
import math
from pathlib import Path
from xml.sax.saxutils import escape

PALETTE = {
    "teal": "#42BDB0", "blue": "#648DE5", "violet": "#9B7BE8",
    "amber": "#E8B86A", "coral": "#D97979", "pearl": "#DDE5EA",
}
RENDERER_REVISION = "4.6"
# Revision 4.6 gives each quiet meaning a material phenomenon of its own within
# the one form (the axes study's Inlay, 25 October 2026), drawn under 4.5's
# rules. Each treatment can be set back to 4.5's drawing; with every entry at
# "4.5" the output is revision 4.5's, byte for byte (scripts/check_revision_base.py).
TREATMENTS = {
    "intensity": "emission",   # salience is emitted light; matter keeps its density
    "counterpoint": "core",    # a current inside the material, the fibres parting round it
    "history": "sheet",        # an earlier sheet standing just behind the present surface
    "tension": "fringes",      # stress fringes at a seat that flattens only slightly
    "complexity": "fibres",    # the band resolves into strands
    "accent": "vein",          # a winding inclusion of the accent's colour
    "gesture": "structural",   # fold and braid change the structure; the echo stays inside the band
    "hue": "surface",          # each hue family has a surface of its own
    "turn": "history",         # the field turns from rest only as far as history allows
}
REVISION_4_5 = dict.fromkeys(TREATMENTS, "4.5")


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
    "grounding": 1.0,
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
                "ambient_strength", "accent_strength", "history", "counterpoint",
                "grounding"):
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


def points_path(points, close=False, digits=2):
    """Interpolate a sampled contour without visible polygon corners."""
    q = f".{digits}f"
    result = [f"M{points[0][0]:{q}},{points[0][1]:{q}}"]
    for i in range(len(points) - 1):
        before, here = points[max(0, i - 1)], points[i]
        after, beyond = points[i + 1], points[min(len(points) - 1, i + 2)]
        c1 = tuple(here[k] + (after[k] - before[k]) / 6 for k in (0, 1))
        c2 = tuple(after[k] - (beyond[k] - here[k]) / 6 for k in (0, 1))
        result.append(f"C{c1[0]:{q}},{c1[1]:{q}} {c2[0]:{q}},{c2[1]:{q}} {after[0]:{q}},{after[1]:{q}}")
    return " ".join(result) + (" Z" if close else "")


def render(spec, treatments=None):
    p = validate(spec)
    A = TREATMENTS if treatments is None else treatments
    revision = "4.5" if A == REVISION_4_5 else RENDERER_REVISION
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

    def pale(color, amount, chroma):
        # Lit but withdrawn material, for surfaces that are remembered or inferred.
        lightness, a, b = to_oklab(color)
        return oklab_hex((min(.91, lightness * amount), a * chroma, b * chroma))

    def tint(color, amount, rich=1):
        # Light that carries colour. A hue can only be lightened so far before sRGB
        # has no room left for its chroma, and past that point it turns to white.
        # So a mark is lit only as far as its hue can hold; pearl, which has almost
        # no chroma to lose, is the one colour that still reaches near-white.
        lightness, a, b = to_oklab(color)
        a, b = a*rich, b*rich

        def holds(level):
            channels = from_oklab((level, a*.85, b*.85))
            return min(channels) >= 0 and max(channels) <= 1
        low, high = lightness, min(.91, lightness*amount)
        if high > low and not holds(high):
            for _ in range(12):
                middle = (low + high) / 2
                if holds(middle):
                    low = middle
                else:
                    high = middle
            high = low
        return oklab_hex((high, a, b))

    def shade(color, amount, chroma=1):
        # The same material in shadow: deeper, and no greyer.
        lightness, a, b = to_oklab(color)
        return oklab_hex((lightness * amount, a * chroma, b * chroma))

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
    # Epistemic texture: how much of this reading rests on material actually
    # present. What is not grounded is described rather than filled.
    weave = 1 - p['grounding']
    a = (218 + 157*o) * (1 + .32*max(0, stretch) - .28*max(0, -stretch))
    b = (153 + 131*o) * (1 + .50*max(0, -stretch) - .25*max(0, stretch))
    gap = math.radians(6 + 112 * o)
    start = -0.42 + gap / 2
    end = 2 * math.pi - 0.42 - gap / 2
    # The field turns away from its resting angle only as far as an earlier
    # change still holds it, so the turn itself says what is retained.
    turning = p['history'] if A['turn'] == 'history' else 1
    turn = math.radians(-18 + 38*p['flow']*turning)
    if A['intensity'] == 'emission':
        # Salience is emitted light. Matter keeps its density whatever the
        # intensity, so a quiet field is dim but present, never thinned. A loud
        # field gives its light off, as its bloom, its shoulder of light and the
        # room around it, in its own colour; its skin is not lightened, which
        # would only bleach the hue.
        strength, glow, halo = .26 + .65*.55, .5 + power, .75 + .5*power
        lit = tint
    else:
        strength, glow, halo = 0.26 + 0.65 * power, 1, 1
        lit = light

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
            if A['tension'] == 'fringes':
                # Pressure flattens the seat a little; it never dents it.
                press = 18*t*math.exp(-((u-.48)/.28)**2)
            else:
                press = 30*t*math.exp(-((u-.48)/.13)**2)
            y = y*b/215 + press + 22*fold*math.sin(3*math.pi*u+.25)*envelope
            return (x*math.cos(turn)-y*math.sin(turn), x*math.sin(turn)+y*math.cos(turn))
        theta = start + (end - start) * u
        phase = math.atan2(math.sin(theta - 2.65), math.cos(theta - 2.65))
        if A['tension'] == 'fringes':
            r = 1 - .18 * t * math.exp(-(phase / .75) ** 2) + 0.065 * skew * math.cos(theta)
        else:
            strain = math.exp(-(phase / 0.38) ** 2)
            r = 1 - 0.36 * t * strain + 0.065 * skew * math.cos(theta)
        r += fold*(.18*math.sin(3*theta+.5) + .07*math.cos(5*theta-.7))
        r += ripple * math.sin(theta * (5 + 3*c) + 0.7)
        x = (a - inset) * math.cos(theta) * r
        y = (b - inset * 0.68) * math.sin(theta) * r
        x += 52 * skew * math.sin(theta) ** 2
        return (x * math.cos(turn) - y * math.sin(turn),
                x * math.sin(turn) + y * math.cos(turn))

    def offset_raw(u, inset=0, ripple=0):
        # A point moved `inset` into the material from the outer edge, before
        # fitting; a negative inset lies beyond the outer edge.
        if form == 'envelope':
            return raw_point(u, inset, ripple)
        x, y = raw_point(u)
        before = raw_point(max(0,u-.001))
        after = raw_point(min(1,u+.001))
        dx, dy = after[0]-before[0], after[1]-before[1]
        length = max(1e-6, math.hypot(dx, dy))
        nx, ny = ((dy/length, -dx/length) if form == 'sweep'
                  else (-dy/length, dx/length))
        x += inset*nx
        y += inset*ny
        return (x, y)

    def thickness(u):
        theta = start + (end - start) * u
        taper = max(0, math.sin(math.pi * u)) ** 0.42
        width = (16 + 91*breadth + 17*(.5 if A['intensity'] == 'emission' else power) + 15*(1-d))
        width *= taper * (.78 + .22*math.sin(theta+fold))
        pinch_phase = math.atan2(math.sin(theta-2.65), math.cos(theta-2.65))
        pinch = math.exp(-(pinch_phase/.45)**2)
        width *= (1-(.05 if A['tension'] == 'fringes' else .18)*t*pinch) * (1+.17*fold*math.sin(3*theta+.8))
        return min(width, min(a,b)*.48)

    sheet = A['history'] == 'sheet' and p['history']

    def sheet_lift(u):
        # How far the earlier sheet stands beyond the present outer edge: always
        # well under the band's own width, so the two overlap and never fork
        # open, and nothing at either tip, where they rejoin.
        return p['history']*.62*thickness(u)*math.sin(math.pi*u)**.7*(.62+.38*u)*(.9+.1*math.cos(3*math.pi*u+.4))

    # Keep every expressive posture in the same frame with substantial margins,
    # counting an earlier sheet that stands beyond the outer edge.
    if sheet:
        extent = max(abs(v) for i in range(201) for v in offset_raw(i/200, -sheet_lift(i/200)))
    else:
        extent = max(abs(v) for i in range(201) for v in raw_point(i/200))
    fit = min(1, 395/max(1, extent))

    def point(u, inset=0, ripple=0):
        x, y = offset_raw(u, inset, ripple)
        return (500 + fit*x, 500 + fit*y)

    n = 96
    us = [i / n for i in range(n + 1)]

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
            return p['history']*(30+34*breadth)*math.sin(math.pi*u)**1.6*(.84+.16*math.cos(3*math.pi*u))
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
            return .52*p['counterpoint']*math.sin(math.pi*v)**1.4
        def across(k):
            return [surface_point(u, .40+k*parting(u)) for u in section]
        def closed(first, second):
            return points_path(first) + ' ' + points_path(second[::-1]).replace('M', 'L', 1) + ' Z'
        near, far = across(0), across(1)
        return closed(near, far), closed(across(.45), far), closed(near, across(.3)), points_path(far)

    # Revision 4.6's marks are properties of the same surface, drawn through
    # surface fractions, so the outline stays one continuous curve.
    def bump(u, u0, u1, power=1.0):
        return math.sin(math.pi*(u-u0)/(u1-u0))**power if u0 < u < u1 else 0.0

    def band(fa, fb, u0=0., u1=1., steps=64, at=None):
        # A region of the surface between two fractions that may vary along it.
        at = at or surface_point
        section = [u0 + (u1-u0)*i/steps for i in range(steps+1)]
        outside = [at(u, fa(u)) for u in section]
        inside = [at(u, fb(u)) for u in reversed(section)]
        return points_path(outside, digits=1) + " " + points_path(inside, digits=1).replace("M", "L", 1) + " Z"

    def lens_along(course, u0, u1, half, steps=72, at=None):
        # A thread of material that thickens and thins along a course.
        return band(lambda u: course(u) - half(u), lambda u: course(u) + half(u), u0, u1, steps, at)

    def loop_path(points):
        # A closed curve with no seam: the interpolation wraps around.
        k = len(points)
        result = [f"M{points[0][0]:.2f},{points[0][1]:.2f}"]
        for i in range(k):
            before, here = points[(i-1) % k], points[i]
            after, beyond = points[(i+1) % k], points[(i+2) % k]
            c1 = tuple(here[q] + (after[q] - before[q]) / 6 for q in (0, 1))
            c2 = tuple(after[q] - (beyond[q] - here[q]) / 6 for q in (0, 1))
            result.append(f"C{c1[0]:.2f},{c1[1]:.2f} {c2[0]:.2f},{c2[1]:.2f} {after[0]:.2f},{after[1]:.2f}")
        return " ".join(result) + " Z"

    def sheet_point(u, fraction):
        # The earlier sheet: the same surface, lifted beyond the present one.
        return point(u, thickness(u)*fraction - sheet_lift(u))

    core = A['counterpoint'] == 'core' and p['counterpoint']

    def core_half(u):
        # Nothing at either tip, so the fibres part around the core and rejoin.
        return .2*p['counterpoint']**.8*bump(u, .08, .92, 1.15) if core else 0.0

    def core_centre(u):
        return .5 + .05*math.sin(2*math.pi*(.7*u + .2))

    def thread_course(fi, u):
        # Where a strand at fraction fi runs once it has parted round the core.
        centre, half = core_centre(u), core_half(u)
        if not half:
            return fi
        if fi < centre:
            return fi*(centre - half)/centre
        return 1 - (1 - fi)*(1 - centre - half)/(1 - centre)

    def fibre_edges():
        # Strand boundaries across the band, at uneven, grown intervals.
        count = 1 + round(17*c)
        widths = [1 + .45*math.sin(2.4*i+1.1) + .25*math.sin(5.3*i+.3) for i in range(count)]
        total = sum(widths)
        edges = [0.0]
        for w in widths:
            edges.append(edges[-1] + w/total)
        return edges

    def vein_course(u):
        # A meandering course at an uneven rhythm. Beside a core it keeps to
        # the outer slope, so the two never share a place.
        if core:
            return (.24 + .06*math.sin(2*math.pi*(1.08*u+.12)) + .03*math.sin(2*math.pi*(2.9*u+.4))
                    + .015*math.sin(2*math.pi*(6.3*u+.2)))
        return (.52 + .17*math.sin(2*math.pi*(1.08*u+.12)) + .07*math.sin(2*math.pi*(2.9*u+.4))
                + .03*math.sin(2*math.pi*(6.3*u+.2)))

    def turn_hue(color, degrees, chroma=1):
        # The same lightness at a neighbouring hue: the play of colour in a pearlescent surface.
        lightness, a_, b_ = to_oklab(color)
        q = math.radians(degrees)
        return oklab_hex((lightness, (a_*math.cos(q) - b_*math.sin(q))*chroma, (a_*math.sin(q) + b_*math.cos(q))*chroma))

    outline = ribbon(0, 1)
    # The visible seat of compression, following the geometry that tension bends.
    strain_u = min(.86, max(.14, (2.65-start)/(end-start))) if form == 'envelope' else .48
    counter_hue = ca if p['accent'] else c2
    # Reading order. Hue, light, posture and softness are read first. The marks
    # that are read second (relief, ridge, second current, seat of strain,
    # reticulation, gesture) are drawn in the field's own hues, and one blur,
    # set by definition, decides how sharply any of them is articulated.
    fine = .3 + 9*(1-d)**2
    articulate = max(0, min(1, (d-.4)/.45))
    articulate = articulate*articulate*(3-2*articulate)
    body_colors = [c1, c2, mix(c1, ca, p['accent_strength']*.85) if p['accent'] else c1, c1]

    def page_ink(name, colors):
        return (f'<linearGradient id="{name}" gradientUnits="userSpaceOnUse" x1="180" y1="720" x2="820" y2="270">'
                f'<stop stop-color="{colors[0]}"/><stop offset=".38" stop-color="{colors[1]}"/>'
                f'<stop offset=".69" stop-color="{colors[2]}"/><stop offset="1" stop-color="{colors[3]}"/></linearGradient>')
    soft = 1.5 + 18 * (1 - d)
    # Revision 4.5's inks for the marks that 4.6 draws another way.
    accent_ink = ('' if A['accent'] == 'vein' else
                  f'\n  <linearGradient id="field-accent-ink"><stop stop-color="{ca}" stop-opacity="0"/><stop offset=".5" stop-color="{ca}" stop-opacity=".72"/><stop offset="1" stop-color="{ca}" stop-opacity="0"/></linearGradient>')
    history_ink = ('' if A['history'] == 'sheet' else
                   f'  <linearGradient id="field-history-ink" gradientUnits="userSpaceOnUse" x1="190" y1="730" x2="810" y2="270"><stop stop-color="{pale(c2,.66,.92)}" stop-opacity=".6"/><stop offset=".47" stop-color="{pale(c1,.88,.92)}" stop-opacity=".9"/><stop offset="1" stop-color="{pale(c2,.64,.92)}" stop-opacity=".55"/></linearGradient>\n')
    metadata = escape(json.dumps(p, sort_keys=True, separators=(",", ":")))
    svg = [f'''<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="1000" viewBox="0 0 1000 1000" role="img" aria-label="A central titanium capsule with a unified abstract field" data-field-version="4" data-field-renderer="{revision}">
<metadata id="field-spec">{metadata}</metadata>
<defs>
  <radialGradient id="background" gradientUnits="userSpaceOnUse" cx="500" cy="500" r="500"><stop stop-color="{bg_centre}"/><stop offset="1" stop-color="{bg_edge}"/></radialGradient>
  <linearGradient id="field-ink" x1="18%" y1="72%" x2="82%" y2="27%"><stop stop-color="{c1}"/><stop offset=".38" stop-color="{c2}"/><stop offset=".69" stop-color="{mix(c1,ca,p['accent_strength']*.85) if p['accent'] else c1}"/><stop offset="1" stop-color="{c1}"/></linearGradient>
  <radialGradient id="field-atmosphere"><stop stop-color="{c1}" stop-opacity="{(.07+.18*breadth)*halo:.3f}"/><stop offset=".6" stop-color="{c2}" stop-opacity="{(.02+.08*breadth)*halo:.3f}"/><stop offset="1" stop-color="{c1}" stop-opacity="0"/></radialGradient>{accent_ink}
  <linearGradient id="field-edge-ink" gradientUnits="userSpaceOnUse" x1="180" y1="720" x2="820" y2="270"><stop stop-color="{c1}" stop-opacity=".1"/><stop offset=".32" stop-color="{c2}" stop-opacity=".75"/><stop offset=".58" stop-color="{c1}" stop-opacity=".15"/><stop offset="1" stop-color="{c1}" stop-opacity=".6"/></linearGradient>
  <linearGradient id="field-crest" gradientUnits="userSpaceOnUse" x1="170" y1="690" x2="790" y2="280"><stop stop-color="{lit(c1,1.28*glow)}" stop-opacity=".25"/><stop offset=".36" stop-color="{lit(c2,1.45*glow)}" stop-opacity=".9"/><stop offset=".68" stop-color="{lit(c1,1.3*glow)}" stop-opacity=".35"/><stop offset="1" stop-color="{lit(c1,1.4*glow)}" stop-opacity=".65"/></linearGradient>
  <linearGradient id="field-depth" gradientUnits="userSpaceOnUse" x1="230" y1="730" x2="760" y2="300"><stop stop-color="#0B1520" stop-opacity="0"/><stop offset=".35" stop-color="#0B1520" stop-opacity=".48"/><stop offset=".7" stop-color="#0B1520" stop-opacity=".1"/><stop offset="1" stop-color="#0B1520" stop-opacity=".3"/></linearGradient>
  {page_ink('field-tint', [tint(color, 1.08*glow, 1.5) for color in body_colors])}
  {page_ink('field-shade', [shade(color, .68, 1.15) for color in body_colors])}
  {page_ink('field-rib', [tint(color, 1.3, 1.15) for color in body_colors])}
{history_ink}  <linearGradient id="field-counter-ink" gradientUnits="userSpaceOnUse" x1="180" y1="720" x2="820" y2="270"><stop stop-color="{shade(counter_hue,.6,1.2)}"/><stop offset=".42" stop-color="{shade(counter_hue,.8,1.2)}"/><stop offset="1" stop-color="{shade(counter_hue,.64,1.2)}"/></linearGradient>
  <linearGradient id="drone-metal" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#34414D"/><stop offset=".5" stop-color="#202B35"/><stop offset="1" stop-color="#101922"/></linearGradient>
  <linearGradient id="drone-rim" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#DDE5EA" stop-opacity=".68"/><stop offset=".6" stop-color="#8C9BA9" stop-opacity=".21"/><stop offset="1" stop-color="#DDE5EA" stop-opacity=".30"/></linearGradient>
  <filter id="field-soft" x="-25%" y="-25%" width="150%" height="150%" color-interpolation-filters="sRGB"><feGaussianBlur stdDeviation="{soft:.2f}"/></filter>
  <filter id="field-diffuse" x="-25%" y="-25%" width="150%" height="150%" color-interpolation-filters="sRGB"><feGaussianBlur stdDeviation="{1.2+5*(1-d)**2:.2f}"/></filter>
  <filter id="field-fine" filterUnits="userSpaceOnUse" x="0" y="0" width="1000" height="1000" color-interpolation-filters="sRGB"><feGaussianBlur stdDeviation="{fine:.2f}"/></filter>
  <filter id="field-recede" x="-25%" y="-25%" width="150%" height="150%" color-interpolation-filters="sRGB"><feGaussianBlur stdDeviation="{1.2+5*(1-d)**2+(.3+18*(1-d)-5*(1-d)**2)*(1-articulate):.2f}"/></filter>''']
    # field-fine: marks are thin, so their blur is measured against the page, not
    # their own bounds. field-recede: what is retained keeps its shape only as far
    # as the field is articulated; otherwise it is an afterglow.
    # Continuous translucent surface, with light gathered into a broad shoulder
    # and released toward the inner edge. Complexity never controls brightness.
    lanes = 28
    for j in range(lanes):
        f = (j + .5) / lanes
        illumination = .46 + .66 * math.exp(-((f - .27) / .3) ** 2)
        illumination += .16 * math.exp(-((f - .91) / .13) ** 2)
        shades = [lit(color, illumination*min(1, glow)) for color in body_colors]
        svg.append(f'<linearGradient id="field-skin-{j}" gradientUnits="userSpaceOnUse" x1="180" y1="720" x2="820" y2="270"><stop stop-color="{shades[0]}"/><stop offset=".38" stop-color="{shades[1]}"/><stop offset=".69" stop-color="{shades[2]}"/><stop offset="1" stop-color="{shades[3]}"/></linearGradient>')
    sheet_lanes = 9
    if sheet:
        # The earlier sheet is the same material, older: deeper than the present
        # skin and nearly as coloured. Drawn paler, it read as grounding's
        # withdrawn matter instead of as history (axes study, words-only pairs).
        for j in range(sheet_lanes):
            f = (j + .5) / sheet_lanes
            illumination = .52 + .58 * math.exp(-((f - .27) / .3) ** 2)
            svg.append(page_ink(f'field-sheet-{j}', [tint(color, illumination*.8*glow, .92) for color in (c1, c2, c1, c1)]))
    # Each hue family's surface is a texture of the body's own colours, so a
    # surface never lays one hue over another: over its neighbour that would grey.
    weights = {}
    if A['hue'] == 'surface':
        for name, w in ((p['primary'], .62), (p['secondary'] or p['primary'], .38)):
            weights[name] = weights.get(name, 0) + w
    if 'blue' in weights:
        svg.append(page_ink('field-crisp', [tint(color, 1.8*glow) for color in body_colors]))
    if 'violet' in weights:
        for name, degrees, chroma, amount in (('field-pearl-a', 14, 1, 1.32), ('field-pearl-b', -16, 1.15, 1.08), ('field-pearl-c', 30, .9, 1.4)):
            svg.append(page_ink(name, [tint(turn_hue(color, degrees, chroma), amount*glow) for color in body_colors]))
    svg.append(f'''</defs>
<rect id="field-background" width="1000" height="1000" fill="url(#background)"/>
<g id="field-envelope">
  <ellipse cx="500" cy="500" rx="{min(435,a*fit+45):.2f}" ry="{min(420,b*fit+65):.2f}" fill="url(#field-atmosphere)" transform="rotate({-18+38*p['flow']*turning:.2f} 500 500)"/>''')
    if sheet:
        # Behind the present surface and sharing its tips: the field as it was
        # held before a change that still matters. It overlaps the present sheet
        # throughout, so no gap opens between them, and like any retained mark it
        # keeps its shape only as far as the field is articulated.
        svg.append(f'<g id="field-history" opacity="{strength*(.55+.4*p["history"]**.6)*(.86+.14*d):.3f}"><g filter="url(#field-recede)">')
        for j in range(sheet_lanes):
            region = band(lambda u, j=j: j/sheet_lanes, lambda u, j=j: min(1, (j+1.6)/sheet_lanes), steps=56, at=sheet_point)
            svg.append(f'<path d="{region}" fill="url(#field-sheet-{j})" opacity=".62"/>')
        svg.append('</g>')
        # Its lit outer edge thins into both tips, where the two sheets meet.
        edge = band(lambda u: 0., lambda u: .03*math.sin(math.pi*u)**.6, .02, .98, 72, at=sheet_point)
        lift = band(lambda u: .2, lambda u: .2 + .07*math.sin(math.pi*u)**.5, .06, .94, 72, at=sheet_point)
        svg.append(f'<path d="{edge}" fill="{tint(pale(c2,.9,.92),1.3*glow)}" opacity="{.9*articulate:.3f}" filter="url(#field-fine)"/>'
                   f'<path d="{lift}" fill="{tint(pale(c1,.95,.92),1.2*glow)}" opacity=".45" filter="url(#field-diffuse)"/></g>')
    elif p['history'] and A['history'] != 'sheet':
        ridge, edge = history_ridge()
        # Older material in the same hues, dimmer and duller. Its lit edge is an
        # articulated edge like any other, so it is there only when definition is.
        svg.append(f'<g id="field-history" opacity="{strength*p["history"]*(.86+.14*d):.3f}">'
                   f'<path d="{ridge}" fill="url(#field-history-ink)" filter="url(#field-recede)"/>'
                   f'<path d="{edge}" fill="none" stroke="{tint(pale(c2,.9,.92),1.3)}" stroke-width="{.9+1.4*p["history"]:.2f}" opacity="{.9*articulate:.3f}" filter="url(#field-fine)"/></g>')
    svg.append(f'''
  <path d="{outline}" fill="url(#field-ink)" opacity="{strength*.28*(1-.4*weave)*glow:.3f}" filter="url(#field-soft)"/>
  <path d="{outline}" fill="url(#field-ink)" opacity="{strength*(.18+.23*d)*(1-.78*weave):.3f}" filter="url(#field-diffuse)"/>
  <path d="{tapered_strip(.11,.9,.79,.15)}" fill="url(#field-depth)" opacity="{strength*(.08+.16*d):.3f}" filter="url(#field-diffuse)"/>
  <g id="field-surface" opacity="{strength*(.35+.1*d):.3f}" filter="url(#field-diffuse)">''')
    for j in range(lanes):
        f = (j + .5) / lanes
        # Where the reading is inferred, the skin thins; the ribs below carry it.
        presence = 1 if f >= weave else .08 + .92*(f/max(1e-6, weave))**.7
        svg.append(f'<path d="{ribbon(j/lanes, min(1,(j+1.65)/lanes))}" fill="url(#field-skin-{j})" opacity="{presence:.3f}"/>')
    svg.append('  </g>')
    # Threads are the grain of the material. Light, the second current and strain lie over them.
    svg.append(f'<g id="field-filaments" fill="none" stroke-linecap="round" opacity="{strength*(.42+.58*d):.3f}" filter="url(#field-fine)">')
    if A['complexity'] == 'fibres':
        # The band resolves into strands, each catching its own light, like a
        # silk cable: one smooth sheet when simple, a bundle when rich. Widths
        # and emphasis vary, every strand tapers into the tips, and a strand
        # thins with the material where the reading was not met.
        def met(f):
            return 1 if f >= weave else .3 + .7*(f/max(1e-6, weave))**.7
        edges, relief = fibre_edges(), .72 + 1.15*breadth
        svg.append('<g id="field-fibre-grooves">')
        for i in range(1, len(edges) - 1):
            lo, hi = .02 + .05*((i*7) % 5)/5, .98 - .05*((i*3) % 4)/4
            groove = lens_along(lambda u, e=edges[i]: thread_course(e, u), lo, hi,
                                lambda u, lo=lo, hi=hi: .017*relief*bump(u, lo, hi, 1.4), 44)
            svg.append(f'<path d="{groove}" fill="url(#field-shade)" opacity="{(.5+.3*d)*met(edges[i]):.3f}"/>')
        svg.append('</g><g id="field-fibre-crests">')
        for i in range(len(edges) - 1 if len(edges) > 2 else 0):
            lo, hi = .03 + .05*((i*5) % 4)/4, .97 - .05*((i*7) % 5)/5
            width = edges[i+1] - edges[i]
            emphasis = .5 + .5*math.sin(1.7*i + .4)**2
            crest = lens_along(lambda u, x=edges[i] + .38*width: thread_course(x, u), lo, hi,
                               lambda u, w=width, lo=lo, hi=hi: .26*w*bump(u, lo, hi, 1.4), 44)
            svg.append(f'<path d="{crest}" fill="url(#field-tint)" opacity="{(.4+.5*emphasis)*(.6+.4*d)*met(edges[i] + .38*width):.3f}"/>')
        svg.append('</g>')
    count = 0 if A['complexity'] == 'fibres' else 1 + round(c * 10)
    for j in range(count):
        # Uneven intervals and lost edges give a few lines compositional weight.
        f = .12 + .79 * ((j + 1) / (count + 1)) ** 1.45
        lo = .015 + .045 * (j % 3)
        hi = .985 - .04 * ((j + 1) % 4)
        samples = [u for u in us if lo <= u <= hi]
        pts, trough = [], []
        for u in samples:
            crossing = (.012*t + .045*fold) * math.sin(5*math.pi*u + j*.9)
            shift = crossing * math.sin(math.pi*u)
            pts.append(surface_point(u, f + shift))
            trough.append(surface_point(u, f + shift + .028*math.sin(math.pi*u)))
        # A thread is detail of the material, so where the material is not met it thins with it.
        weight = (1 if j % 3 == 0 else .55) * (1 if f >= weave else .3 + .7*(f/max(1e-6, weave))**.7)
        # Each thread is the surface's own colour, more saturated and a little lit,
        # with a soft shade beside it: a change of surface direction, not a drawn line.
        relief = .72 + 1.15*breadth
        svg.append(f'<path d="{points_path(trough)}" stroke="url(#field-shade)" stroke-width="{(1+1.05*d)*relief*weight:.2f}" opacity="{(.16+.18*d)*weight:.3f}"/>')
        svg.append(f'<path d="{points_path(pts)}" stroke="url(#field-tint)" stroke-width="{(.95+1.05*d)*relief*weight:.2f}" opacity="{(.36+.44*d)*weight:.3f}"/>')
    svg.append('</g>')
    if weave:
        # Inference is drawn, not filled: the section ribs that define the form
        # stay visible where its material does not. They soften with definition
        # like every mark, and are drawn broader as they do, so that an unresolved
        # form which was also not met still shows that it is described.
        ribs = 6 + round(11*weave)
        svg.append(f'<g id="field-reticulation" fill="none" stroke-linecap="round" opacity="{strength*(.62+.38*d):.3f}" filter="url(#field-fine)">')
        for j in range(ribs):
            u = .06 + .88*(j+.5)/ribs
            span = weave*(.52+.48*math.sin(math.pi*u))
            rib = [surface_point(u, span*k/12) for k in range(13)]
            svg.append(f'<path d="{points_path(rib)}" stroke="url(#field-rib)" stroke-width="{.9+1.3*weave+.55*fine:.2f}" opacity="{.4+.5*math.sin(math.pi*u):.3f}"/>')
        # A held outer edge keeps the described form exact where it is not filled.
        svg.append(f'<path d="{points_path([surface_point(u, .02) for u in us])}" stroke="url(#field-rib)" stroke-width="{.7+1.1*weave+.4*fine:.2f}" opacity="{.3+.4*weave:.3f}"/>')
        svg.append('</g>')
    svg.append(f'<path id="field-shoulder-light" d="{tapered_strip(.07,.94,.31+.5*weave,(.13+.035*breadth)*(1-.45*weave),.12)}" fill="url(#field-crest)" opacity="{strength*(.45+.4*d)*(.6+.4*glow):.3f}" filter="url(#field-diffuse)"/>')
    if A['hue'] == 'surface':
        # Each hue family has a surface of its own as well as its colour, as
        # Listening gives each a timbre: blue crisp and clear, violet
        # pearlescent, amber soft, coral satin, pearl luminous, teal plain.
        svg.append('<g id="field-hue-surface" filter="url(#field-fine)">')
        w = weights.get('blue', 0)
        if w:
            crisp = [surface_point(u, .2) for u in us if .09 <= u <= .88]
            rim = [surface_point(u, .9) for u in us if .3 <= u <= .8]
            svg.append(f'<path d="{points_path(crisp)}" fill="none" stroke="url(#field-crisp)" stroke-width="{.9+.7*d:.2f}" opacity="{.75*w*(.5+.5*d):.3f}"/>'
                       f'<path d="{points_path(rim)}" fill="none" stroke="url(#field-crisp)" stroke-width=".8" opacity="{.4*w*(.5+.5*d):.3f}"/>')
        w = weights.get('violet', 0)
        if w:
            svg.append(f'<path d="{tapered_strip(.06,.92,.15,.12,.1)}" fill="url(#field-pearl-a)" opacity="{.62*w:.3f}" filter="url(#field-soft)"/>'
                       f'<path d="{tapered_strip(.14,.86,.78,.11,.1)}" fill="url(#field-pearl-b)" opacity="{.5*w:.3f}" filter="url(#field-soft)"/>'
                       f'<path d="{tapered_strip(.2,.8,.46,.05,.12)}" fill="url(#field-pearl-c)" opacity="{.35*w:.3f}" filter="url(#field-diffuse)"/>')
        w = weights.get('amber', 0)
        if w:
            svg.append(f'<path d="{tapered_strip(.05,.95,.5,.42)}" fill="url(#field-tint)" opacity="{.32*w:.3f}" filter="url(#field-soft)"/>')
        w = weights.get('coral', 0)
        if w:
            svg.append(f'<path d="{tapered_strip(.1,.9,.32,.1,.1)}" fill="url(#field-tint)" opacity="{.4*w:.3f}" filter="url(#field-diffuse)"/>')
        w = weights.get('pearl', 0)
        if w:
            svg.append(f'<path d="{tapered_strip(.08,.92,.42,.26)}" fill="#EEF3F6" opacity="{.22*w:.3f}" filter="url(#field-soft)"/>')
        svg.append('</g>')
    if core:
        # A second current inside the material, in its own hue. The fibres part
        # around it and rejoin at both tips, and a fine shade along each side
        # keeps it a current within the material rather than a band of palette.
        def across(k):
            return lambda u: core_centre(u) + k*core_half(u)
        body = band(across(-.8), across(.8), .08, .92, 90)
        sides = band(across(-1), across(-.8), .08, .92, 90) + ' ' + band(across(.8), across(1), .08, .92, 90)
        glint = band(across(-.55), across(-.3), .08, .92, 90)
        svg.append(f'<g id="field-countercurrent" opacity="{strength*(.8+.2*d):.3f}">'
                   f'<path d="{body}" fill="{tint(counter_hue,1.08*glow,1.2)}" opacity=".88" filter="url(#field-diffuse)"/>'
                   f'<g filter="url(#field-fine)"><path d="{sides}" fill="url(#field-counter-ink)" opacity=".7"/>'
                   f'<path d="{glint}" fill="{tint(counter_hue,1.5*glow,.9)}" opacity=".6"/></g></g>')
    elif p['counterpoint'] and A['counterpoint'] != 'core':
        # A second current lives in the same material. It parts from the surface
        # along one edge, leaving an opening the ground shows through, and returns
        # along the other. Across its width it is its own colour, deep beside the
        # opening and lit toward the seam where it rejoins. The colour says what it
        # is; the parting says that it is a current, not a palette.
        lens, lip, opening, seam = countercurrent()
        svg.append(f'<g id="field-countercurrent" opacity="{strength*p["counterpoint"]*(.74+.26*d):.3f}">'
                   f'<path d="{lens}" fill="url(#field-counter-ink)" filter="url(#field-diffuse)"/>'
                   f'<path d="{lip}" fill="{tint(counter_hue,1.4,1.2)}" opacity=".9" filter="url(#field-diffuse)"/>'
                   f'<g fill="none" filter="url(#field-fine)">'
                   f'<path d="{opening}" fill="url(#background)" opacity=".85"/>'
                   f'<path d="{seam}" stroke="{tint(counter_hue,1.6,.7)}" stroke-width="{1+3*p["counterpoint"]:.2f}" opacity=".92"/></g></g>')
    svg.append(f'<path id="field-grazing-light" d="{tapered_strip(.21,.75,.2+.58*weave,.045+.03*breadth,.08)}" fill="url(#field-crest)" opacity="{strength*(.35+.35*d):.3f}"/>')
    if t and A['tension'] == 'fringes':
        # Stress made visible as photoelastic fringes: nested contours of the
        # field's own colour that crowd toward the seat of pressure. The outline
        # only flattens a little there; it is never dented or cut.
        seat_f = .45
        reach = min(.24, strain_u - .03, .97 - strain_u)
        rings = 2 + round(4*t)
        def ring(k, grow):
            s_ = ((k + 1) / rings) ** 1.55
            du, df, centre = reach*(.16 + .84*s_), min(.42, .045 + .37*s_), seat_f - .05*s_
            return loop_path([surface_point(strain_u + du*grow*math.cos(q)*(1-.1*math.sin(q)),
                                            centre + df*grow*math.sin(q)*(1+.16*math.cos(q)))
                              for q in (2*math.pi*i/84 for i in range(84))])
        svg.append(f'<g id="field-strain" fill="none" opacity="{strength*(.72+.28*d):.3f}">'
                   f'<path d="{tapered_strip(max(.02,strain_u-.17),min(.98,strain_u+.17),.46,.05+.1*t,.1)}" fill="url(#field-depth)" opacity="{.55*t:.3f}" filter="url(#field-diffuse)"/>'
                   f'<path d="{tapered_strip(max(.02,strain_u-.07),min(.98,strain_u+.07),seat_f-.02,.025+.045*t)}" fill="{tint(c1, 1.9*glow)}" opacity="{.85*t**1.1:.3f}" filter="url(#field-diffuse)"/>'
                   f'<g id="field-strain-shade" filter="url(#field-diffuse)">')
        for k in range(rings):
            s_ = ((k + 1) / rings) ** 1.55
            svg.append(f'<path d="{ring(k, 1.09)}" stroke="url(#field-shade)" stroke-width="{(2.6+2.6*(1-s_))*(.6+.4*t):.2f}" opacity="{.3*t**1.1:.3f}"/>')
        svg.append(f'</g><g id="field-strain-fringes" filter="url(#field-fine)">'
                   f'<path d="{tapered_strip(max(.02,strain_u-.035),min(.98,strain_u+.035),seat_f-.02,.012+.02*t)}" fill="{tint(c1, 2.1*glow)}" opacity="{.8*t**1.2:.3f}"/>')
        for k in range(rings):
            s_ = ((k + 1) / rings) ** 1.55
            svg.append(f'<path d="{ring(k, 1)}" stroke="{tint(c1, (1.62-.2*s_)*glow, 1.1)}" stroke-width="{(1.4+2.6*(1-s_))*(.6+.4*t):.2f}" opacity="{(.45+.5*(1-s_))*t**1.1:.3f}"/>')
        svg.append('</g></g>')
    elif t:
        # Compression gathers shadow behind the strained contour and concentrates
        # light along it. Unresolved pressure, not alarm.
        lo, hi = max(.02, strain_u-.18), min(.98, strain_u+.18)
        svg.append(f'<path id="field-strain" d="{tapered_strip(lo,hi,.46,.07+.17*t,.1)}" fill="url(#field-shade)" opacity="{strength*t*(.5+.3*d):.3f}" filter="url(#field-diffuse)"/>')
        svg.append(f'<path id="field-strain-light" d="{tapered_strip(max(.02,strain_u-.13),min(.98,strain_u+.13),.2,.028+.05*t)}" fill="url(#field-tint)" opacity="{strength*t*(.55+.3*d):.3f}" filter="url(#field-fine)"/>')
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
    svg.append(f'''  <path d="{points_path([surface_point(u, .06) for u in us])}" fill="none" stroke="url(#field-edge-ink)" stroke-width="{.65+.75*d+.9*weave:.2f}" opacity="{strength*(d*.68+.3*weave):.3f}"/>
  <path d="{points_path([surface_point(u, .9) for u in us if .47 <= u <= .84])}" fill="none" stroke="url(#field-edge-ink)" stroke-width="{1+.8*d:.2f}" opacity="{strength*d*.6:.3f}"/>
</g>''')
    svg.append('<g id="field-accent" fill="none">')
    if p["accent"] and A['accent'] == 'vein':
        # A vein: the accent's quality running through the material like a
        # mineral inclusion, with a little of its colour diffused round it. Its
        # line is denser than the material round it, so it stays its own colour
        # where it crosses another, and only as sharp as the field is articulated.
        s_ = p['accent_strength']
        span = .13 + .3*s_
        lo, hi = max(.05, .5 - span), min(.95, .5 + span)
        spread = lens_along(vein_course, lo, hi, lambda u: (.035 + .1*s_)*bump(u, lo, hi, .8), 80)
        line = lens_along(vein_course, lo, hi, lambda u: (.008 + .032*s_)*bump(u, lo, hi, .7), 80)
        svg.append(f'<path d="{spread}" fill="{ca}" opacity="{.14+.36*s_:.3f}" filter="url(#field-soft)"/>'
                   f'<path d="{line}" fill="{shade(ca, .9, 1.2)}" opacity="{.7+.3*s_:.3f}" filter="url(#field-fine)"/>')
    elif p["accent"]:
        # Accent lives within the same envelope; its location is not a topic axis.
        seg = [surface_point(u, .57) for u in us if .37 <= u <= .69]
        svg.append(f'<path d="{points_path(seg)}" stroke="url(#field-accent-ink)" stroke-width="{6+25*p["accent_strength"]:.2f}" opacity="{.25+.45*p["accent_strength"]:.2f}" filter="url(#field-soft)"/>')
        svg.append(f'<path d="{points_path(seg)}" stroke="url(#field-accent-ink)" stroke-width="{1.6+4*p["accent_strength"]:.2f}" opacity=".76" filter="url(#field-fine)"/>')
    # A short highlight articulates definition within the selected hue family.
    if d > .55:
        glint = [point(u, thickness(u)*.45) for u in us if .17 <= u <= .21]
        svg.append(f'<path d="{points_path(glint)}" stroke="{light(c1,1.18)}" stroke-width="1.2" opacity="{strength*(d-.55)*.7:.3f}"/>')
    svg.append('</g><g id="field-gesture" fill="none" stroke-linecap="round" filter="url(#field-fine)">')
    g, gs = p["gesture"], p["gesture_strength"]
    if gs and g == 'braid' and A['gesture'] == 'structural':
        # Two strands of the band wind round each other for a short run, each
        # lit along its length, passing over and under in turn.
        ua, ub = .1, .44
        def course(u, j):
            v = (u - ua)/(ub - ua)
            phase = math.pi*(2.6*v + .35*math.sin(math.pi*v)) + j*math.pi
            return .5 + .3*math.sin(phase)*math.sin(math.pi*v)**.5
        def half(u):
            return (.085 + .045*gs)*bump(u, ua, ub, .35)
        # Each strand is one of the field's two hues; a blend of the two would grey.
        strand = [c1, c2]
        for j in (0, 1):
            svg.append(f'<path d="{lens_along(lambda u, j=j: course(u, j), ua, ub, half, 90)}" fill="{tint(strand[j], .92*glow, 1.1)}" stroke="none" opacity="{.14+.22*gs:.3f}" filter="url(#field-diffuse)"/>')
        crossings = [ua] + [ua + (ub - ua)*x for x in (.2, .4, .6, .8)] + [ub]
        for i in range(len(crossings) - 1):
            j = i % 2
            a0, a1 = max(ua, crossings[i] - .035), min(ub, crossings[i+1] + .035)
            def over(u, j=j):
                return course(u, j)
            def passing(u, a0=a0, a1=a1):
                return half(u)*bump(u, a0, a1, .85)
            svg.append(f'<path d="{lens_along(over, a0, a1, lambda u: 1.4*passing(u), 48)}" fill="url(#field-shade)" stroke="none" opacity="{.22+.26*gs:.3f}" filter="url(#field-diffuse)"/>'
                       f'<path d="{lens_along(over, a0, a1, passing, 48)}" fill="{tint(strand[j], 1.08*glow, 1.1)}" stroke="none" opacity="{.22+.26*gs:.3f}" filter="url(#field-diffuse)"/>'
                       f'<path d="{lens_along(lambda u: over(u) - .3*half(u), a0, a1, lambda u: .3*passing(u), 48)}" fill="{tint(strand[j], 1.45*glow, 1.1)}" stroke="none" opacity="{.32+.38*gs:.3f}"/>')
    elif gs and g == 'fold' and A['gesture'] == 'structural':
        # A bend that tucks the outer lip over: the underside shows, deeper,
        # with a shade beneath the tuck and light along its rolled edge.
        lo, hi = .12, .4
        def depth(u):
            return (.2 + .3*gs)*bump(u, lo, hi, 1.1)
        svg.append(f'<path d="{band(lambda u: 0., depth, lo, hi, 60)}" fill="{shade(c1, .58)}" stroke="none" opacity="{.35+.4*gs:.3f}" filter="url(#field-diffuse)"/>'
                   f'<path d="{band(depth, lambda u: 1.2*depth(u), lo, hi, 60)}" fill="url(#field-shade)" stroke="none" opacity="{.3+.3*gs:.3f}" filter="url(#field-diffuse)"/>'
                   f'<path d="{band(lambda u: .86*depth(u), depth, lo, hi, 60)}" fill="{tint(c2, 1.5*glow, 1.2)}" stroke="none" opacity="{.45+.4*gs:.3f}"/>')
    elif g != "none" and gs:
        seg_us = [u for u in us if .28 <= u <= .64]
        for j in range(2 if g == "braid" else 1):
            pts = []
            for u in seg_us:
                v = (u-.28)/.36
                bow = math.sin(math.pi*v)
                wave = math.sin(v*math.pi*3+j*math.pi) if g == "braid" else bow
                inset = thickness(u)*.5 + (42 if g == "echo" else -38)*gs*wave*bow
                pts.append(point(u, inset))
            # A glow of the strand's colour, a soft shade under it, and the thread itself.
            svg.append(f'<path d="{points_path(pts)}" stroke="{tint(c2,1.2,1.3)}" stroke-width="{6+15*gs:.2f}" opacity="{.07+.14*gs:.3f}" filter="url(#field-diffuse)"/>')
            svg.append(f'<path d="{points_path(pts)}" stroke="url(#field-shade)" stroke-width="{2.4+4.4*gs:.2f}" opacity="{.14+.2*gs:.3f}"/>')
            svg.append(f'<path d="{points_path(pts)}" stroke="{tint(c2,1.12,1.4)}" stroke-width="{1.2+2.4*gs:.2f}" opacity="{.3+.42*gs:.3f}"/>')
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
