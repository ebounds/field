#!/usr/bin/env python3
"""Rebuild the portable template and calibration atlas from the shared renderer."""
import argparse
import json
import math
import re
from pathlib import Path
from xml.sax.saxutils import escape

from render_field import RENDERER_REVISION, render


def main():
    root = Path(__file__).resolve().parents[1]
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output-dir', type=Path, default=root / 'assets')
    args = parser.parse_args()
    specs = json.loads((root / 'references/reference-controls.json').read_text())
    args.output_dir.mkdir(parents=True, exist_ok=True)
    (args.output_dir / 'field-template.svg').write_text(render({}), encoding='utf-8')
    height = 420 * math.ceil(len(specs) / 3)
    atlas = [f'<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="{height}" viewBox="0 0 1200 {height}" data-field-renderer="{RENDERER_REVISION}">',
             f'<rect width="1200" height="{height}" fill="#080D16"/>']
    for i, (name, spec) in enumerate(specs.items()):
        art = render(spec)
        art = re.sub(r'id="([^"]+)"', lambda m: f'id="{name}-{m[1]}"', art)
        art = re.sub(r'url\(#([^)]+)\)', lambda m: f'url(#{name}-{m[1]})', art)
        x, y = (i % 3) * 400, (i // 3) * 420
        art = art.split('>\n', 1)[1].rsplit('</svg>', 1)[0]
        atlas.extend([f'<g transform="translate({x} {y}) scale(0.4)">', art, '</g>',
                      f'<text x="{x+200}" y="{y+412}" text-anchor="middle" fill="#DDE5EA" font-family="sans-serif" font-size="15">{escape(name)}</text>'])
    atlas.append('</svg>')
    (args.output_dir / 'reference-atlas.svg').write_text('\n'.join(atlas) + '\n', encoding='utf-8')


if __name__ == '__main__':
    main()
