#!/usr/bin/env python3
"""Build public studies and the portable skill ZIP. Python standard library only."""
import hashlib
import json
import shutil
import zipfile
from pathlib import Path

from render_field import render

ROOT = Path(__file__).resolve().parents[1]
SITE = ROOT/'docs/site'
PACKAGE_VERSION = '4.4'


def main():
    studies = SITE/'studies'
    studies.mkdir(parents=True, exist_ok=True)
    presets = json.loads((ROOT/'references/reference-controls.json').read_text())
    for name, spec in presets.items():
        (studies/(name+'.svg')).write_text(render(spec), encoding='utf-8')
    (SITE/'presets.mjs').write_text('export const PRESETS = '+json.dumps(presets, indent=2)+';\n', encoding='utf-8')
    shutil.copyfile(ROOT/'assets/icon.svg', SITE/'icon.svg')
    hero = render(dict(form='mantle', primary='violet', secondary='teal', accent='amber',
                       accent_strength=.22, ambient='blue', ambient_strength=.5,
                       openness=.77, breadth=.8, folding=.22, intensity=.76,
                       definition=.72, stretch=.15, flow=.35, history=.55,
                       counterpoint=.42, complexity=.4))
    (SITE/'hero.svg').write_text(hero, encoding='utf-8')
    inner = hero.split('>\n', 1)[1].rsplit('</svg>', 1)[0]
    card = f'''<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
<rect width="1200" height="630" fill="#0b111b"/>
<svg x="520" y="-65" width="760" height="760" viewBox="0 0 1000 1000">{inner}</svg>
<defs><linearGradient id="card-fade" gradientUnits="userSpaceOnUse" x1="520" x2="720"><stop stop-color="#0b111b"/><stop offset="1" stop-color="#0b111b" stop-opacity="0"/></linearGradient></defs>
<rect x="520" width="200" height="630" fill="url(#card-fade)"/>
<text x="66" y="95" fill="#e6e5df" font-family="Georgia,serif" font-size="33">Field</text>
<text x="66" y="202" fill="#b5a68f" font-family="Arial,sans-serif" font-size="12" letter-spacing="2">A VISUAL LANGUAGE FOR AI CONVERSATIONS</text>
<text x="63" y="289" fill="#e6e5df" font-family="Georgia,serif" font-size="59">The shape of</text>
<text x="63" y="360" fill="#b7caca" font-family="Georgia,serif" font-style="italic" font-size="59">thinking together.</text>
<text x="66" y="446" fill="#a9b7c5" font-family="Arial,sans-serif" font-size="18">Explore the instrument. Make something.</text>
<text x="66" y="563" fill="#b5a68f" font-family="Arial,sans-serif" font-size="14">ebounds.github.io/field</text>
</svg>'''
    (SITE/'social-card.svg').write_text(card+'\n', encoding='utf-8')
    downloads = ROOT/'docs/downloads'
    downloads.mkdir(exist_ok=True)
    archive = downloads/f'field-{PACKAGE_VERSION}.zip'
    files = [ROOT/'SKILL.md', ROOT/'LICENSE', ROOT/'scripts/render_field.py',
             ROOT/'scripts/build_reference_assets.py', ROOT/'docs/field-guide.pdf',
             ROOT/'docs/field-4.3-design.md', ROOT/'docs/field-4.4-design.md',
             ROOT/'scripts/render_audio.mjs', SITE/'audio.mjs', SITE/'renderer.mjs']
    for folder in ('references','assets','agents'):
        files += sorted((ROOT/folder).glob('*'))
    with zipfile.ZipFile(archive, 'w', compression=zipfile.ZIP_DEFLATED, compresslevel=9) as package:
        for source in files:
            if not source.is_file():
                continue
            entry = zipfile.ZipInfo('field/'+str(source.relative_to(ROOT)))
            entry.compress_type = zipfile.ZIP_DEFLATED
            entry.external_attr = 0o644 << 16
            package.writestr(entry, source.read_bytes())
        entry = zipfile.ZipInfo('field/README.md')
        entry.compress_type = zipfile.ZIP_DEFLATED
        entry.external_attr = 0o644 << 16
        package.writestr(entry, (ROOT/'docs/quickstart.md').read_bytes())
    checksums = [f'{hashlib.sha256(item.read_bytes()).hexdigest()}  {item.name}\n'
                 for item in sorted(downloads.glob('field-*.zip'))]
    (downloads/'SHA256SUMS').write_text(''.join(checksums), encoding='utf-8')
    print(f'Built {len(presets)} studies, hero, social SVG, and {archive.name} ({archive.stat().st_size:,} bytes).')


if __name__ == '__main__':
    main()
