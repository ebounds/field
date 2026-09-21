#!/usr/bin/env python3
"""Render Field grammar v4 from drawing controls. Python standard library only."""
import argparse
import json
import math
import colorsys
from pathlib import Path
from xml.sax.saxutils import escape

PALETTE = {
    "teal": "#42BDB0", "blue": "#648DE5", "violet": "#9B7BE8",
    "amber": "#E8B86A", "coral": "#D97979", "pearl": "#DDE5EA",
}
DEFAULTS = {
    "version": 4, "primary": "teal", "secondary": "blue", "accent": None,
    "openness": 0.5, "tension": 0.15, "definition": 0.65,
    "complexity": 0.35, "intensity": 0.5, "imbalance": 0.0,
    "gesture": "none", "gesture_strength": 0.0,
    "breadth": 0.4, "folding": 0.2, "stretch": 0.0, "flow": 0.0,
    "saturation": 0.85, "ambient": None, "ambient_strength": 0.25,
    "accent_strength": 0.4,
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
                "ambient_strength", "accent_strength"):
        x = p[key]
        low = -1 if key in ("imbalance", "stretch", "flow") else 0
        if type(x) not in (int, float) or not math.isfinite(x) or not low <= x <= 1:
            raise ValueError(f"{key} must be a finite number between {low} and 1")
    if type(p["saturation"]) not in (int, float) or not math.isfinite(p["saturation"]) or not .25 <= p["saturation"] <= 1.35:
        raise ValueError("saturation must be between .25 and 1.35")
    if p["gesture"] not in ("none", "fold", "echo", "braid"):
        raise ValueError("gesture must be none, fold, echo, or braid")
    return p


def points_path(points, close=False):
    return "M" + " L".join(f"{x:.2f},{y:.2f}" for x, y in points) + (" Z" if close else "")


def render(spec):
    p = validate(spec)
    def rgb(h):
        return tuple(int(h[i:i+2], 16) / 255 for i in (1, 3, 5))

    def hexcolor(v):
        return '#' + ''.join(f'{max(0,min(255,round(x*255))):02X}' for x in v)

    def pigment(name):
        h, light, sat = colorsys.rgb_to_hls(*rgb(PALETTE[name]))
        return hexcolor(colorsys.hls_to_rgb(h, light, min(1, sat*p['saturation'])))

    def mix(a, b, amount):
        return hexcolor(tuple(x*(1-amount)+y*amount for x, y in zip(rgb(a), rgb(b))))

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
    a = (218 + 157*o) * (1 + .32*max(0, stretch) - .28*max(0, -stretch))
    b = (153 + 131*o) * (1 + .50*max(0, -stretch) - .25*max(0, stretch))
    gap = math.radians(6 + 112 * o)
    start = -0.42 + gap / 2
    end = 2 * math.pi - 0.42 - gap / 2
    turn = math.radians(-18 + 38*p['flow'])
    strength = 0.26 + 0.65 * power

    def raw_point(u, inset=0, ripple=0):
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
        x, y = raw_point(u, inset, ripple)
        return (500 + fit*x, 500 + fit*y)

    n = 200
    us = [i / n for i in range(n + 1)]

    def thickness(u):
        theta = start + (end - start) * u
        taper = max(0, math.sin(math.pi * u)) ** 0.42
        width = (16 + 91*breadth + 17*power + 15*(1-d))
        width *= taper * (.78 + .22*math.sin(theta+fold))
        return min(width, min(a,b)*.48)

    def ribbon(outside, inside):
        upper = [point(u, thickness(u) * outside) for u in us]
        lower = [point(u, thickness(u) * inside) for u in reversed(us)]
        return points_path(upper + lower, True)

    outline = ribbon(0, 1)
    centre = points_path([point(u, thickness(u) * 0.44) for u in us])
    soft = 1.5 + 18 * (1 - d)
    metadata = escape(json.dumps(p, sort_keys=True, separators=(",", ":")))
    svg = [f'''<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="1000" viewBox="0 0 1000 1000" role="img" aria-label="A central titanium capsule surrounded by a unified expressive field" data-field-version="4">
<metadata id="field-spec">{metadata}</metadata>
<defs>
  <radialGradient id="background"><stop stop-color="{bg_centre}"/><stop offset="1" stop-color="{bg_edge}"/></radialGradient>
  <linearGradient id="field-ink" x1="18%" y1="72%" x2="82%" y2="27%"><stop stop-color="{c1}"/><stop offset=".38" stop-color="{c2}"/><stop offset=".69" stop-color="{mix(c1,ca,p['accent_strength']*.85) if p['accent'] else c1}"/><stop offset="1" stop-color="{c1}"/></linearGradient>
  <radialGradient id="field-atmosphere"><stop stop-color="{c1}" stop-opacity="{.07+.18*breadth:.3f}"/><stop offset=".6" stop-color="{c2}" stop-opacity="{.02+.08*breadth:.3f}"/><stop offset="1" stop-color="{c1}" stop-opacity="0"/></radialGradient>
  <linearGradient id="field-accent-ink"><stop stop-color="{ca}" stop-opacity="0"/><stop offset=".5" stop-color="{ca}" stop-opacity=".72"/><stop offset="1" stop-color="{ca}" stop-opacity="0"/></linearGradient>
  <linearGradient id="drone-metal" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#34414D"/><stop offset=".5" stop-color="#202B35"/><stop offset="1" stop-color="#101922"/></linearGradient>
  <linearGradient id="drone-rim" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#DDE5EA" stop-opacity=".68"/><stop offset=".6" stop-color="#8C9BA9" stop-opacity=".21"/><stop offset="1" stop-color="#DDE5EA" stop-opacity=".30"/></linearGradient>
  <filter id="field-soft" x="-25%" y="-25%" width="150%" height="150%" color-interpolation-filters="sRGB"><feGaussianBlur stdDeviation="{soft:.2f}"/></filter>
</defs>
<rect id="field-background" width="1000" height="1000" fill="url(#background)"/>
<g id="field-envelope">
  <ellipse cx="500" cy="500" rx="{min(435,a*fit+45):.2f}" ry="{min(420,b*fit+65):.2f}" fill="url(#field-atmosphere)" transform="rotate({-18+38*p['flow']:.2f} 500 500)"/>
  <path d="{outline}" fill="url(#field-ink)" opacity="{strength*.44:.3f}" filter="url(#field-soft)"/>
  <path d="{outline}" fill="url(#field-ink)" opacity="{strength*(.22+.56*d):.3f}"/>
  <path d="{ribbon(.25,.68)}" fill="url(#field-ink)" opacity="{strength*.22:.3f}"/>
  <path d="{centre}" fill="none" stroke="url(#field-ink)" stroke-width="1.8" opacity="{.13+.38*d:.3f}"/>
</g>
<g id="field-filaments" fill="none" stroke="url(#field-ink)">''']
    for j in range(2 + round(c * 11)):
        f = (j + 1) / (3 + round(c * 11))
        path = points_path([point(u, thickness(u) * f,
                          (0.025*t+.045*fold) * (f - .5)) for u in us])
        svg.append(f'<path d="{path}" stroke-width="{.55 + .35*d:.2f}" opacity="{.10+.17*d:.3f}"/>')
    svg.append('</g>')
    svg.append('<g id="field-accent" fill="none">')
    if p["accent"]:
        # Accent lives within the same envelope; its location is not a topic axis.
        seg = [point(u, thickness(u) * .57) for u in us if .37 <= u <= .69]
        svg.append(f'<path d="{points_path(seg)}" stroke="url(#field-accent-ink)" stroke-width="{6+25*p["accent_strength"]:.2f}" opacity="{.25+.45*p["accent_strength"]:.2f}" filter="url(#field-soft)"/>')
        svg.append(f'<path d="{points_path(seg)}" stroke="url(#field-accent-ink)" stroke-width="{1+2*p["accent_strength"]:.2f}" opacity=".58"/>')
    # A short pearl glint is only a definition cue, not a truth/confidence score.
    if d > .55:
        glint = [point(u, thickness(u)*.45) for u in us if .17 <= u <= .21]
        svg.append(f'<path d="{points_path(glint)}" stroke="#DDE5EA" stroke-width="1.2" opacity="{(d-.55)*.7:.3f}"/>')
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
