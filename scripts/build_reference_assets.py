#!/usr/bin/env python3
"""Rebuild the portable template and calibration atlas from the shared renderer."""
import argparse
import json
import math
import re
from pathlib import Path
from xml.sax.saxutils import escape

from render_field import render


def main():
    root = Path(__file__).resolve().parents[1]
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output-dir', type=Path, default=root / 'assets')
    args = parser.parse_args()
    specs = json.loads((root / 'references/reference-controls.json').read_text())
    args.output_dir.mkdir(parents=True, exist_ok=True)
    (args.output_dir / 'field-template.svg').write_text(render({}), encoding='utf-8')
    height = 420 * math.ceil(len(specs) / 3)
    atlas = [f'<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="{height}" viewBox="0 0 1200 {height}" data-field-renderer="4.1">',
             f'<rect width="1200" height="{height}" fill="#080D16"/>']
    for i, (name, spec) in enumerate(specs.items()):
        art = render(spec)
        art = re.sub(r'id="([^"]+)"', lambda m: f'id="{name}-{m[1]}"', art)
        art = re.sub(r'url\(#([^)]+)\)', lambda m: f'url(#{name}-{m[1]})', art)
        x, y = (i % 3) * 400, (i // 3) * 420
        art = art.replace('width="1000" height="1000" viewBox=',
                          f'x="{x}" y="{y}" width="400" height="400" viewBox=', 1)
        atlas.extend([art, f'<text x="{x+200}" y="{y+412}" text-anchor="middle" fill="#DDE5EA" font-family="sans-serif" font-size="15">{escape(name)}</text>'])
    atlas.append('</svg>')
    (args.output_dir / 'reference-atlas.svg').write_text('\n'.join(atlas) + '\n', encoding='utf-8')


if __name__ == '__main__':
    main()
