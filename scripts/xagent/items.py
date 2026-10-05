#!/usr/bin/env python3
"""Build the test images for the cross-agent runs.

Each item is a field rendered from known controls under one renderer revision,
with its metadata stripped, rasterised by headless Chrome and saved under a
random file name. Python 3 standard library and a Chrome/Chromium binary only.

    CHROME_BIN=/path/to/chromium python3 scripts/xagent/items.py

Images and the manifest go to .xagent/ (ignored by git). They are a pure
function of the controls and the pinned commits, so they are rebuilt, not kept.
"""
import json
import os
import re
import secrets
import struct
import subprocess
import sys
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
WORK = ROOT / '.xagent'
ITEMS = WORK / 'items'
MANIFEST = ITEMS / 'manifest.json'

# Renderer revision -> (package it shipped in, commit it is read from).
# Pinned to commits, so a later change in the working tree can't move a baseline.
# 'WORKTREE' reads the files as they are now (for the revision being built).
REVISIONS = {
    '4.3': ('4.5.1', '005dbae'),
    '4.4': ('4.6.0', 'a244a80'),
}
SIZES = (160, 320, 1000)
SHARED = ('gathered', 'exploring', 'strained', 'tentative', 'integrated', 'playful')
WORDS = SHARED + ('described',)
E3_DIR = Path(os.environ.get('XAGENT_E3_DIR', Path.home() / 'claude/for-edgar/field-e3'))

# Controlled probes for the taught task: one channel moved at a time.
PROBE_BASES = {
    'a': {'primary': 'teal', 'secondary': 'blue', 'form': 'envelope',
          'openness': .6, 'breadth': .7, 'definition': .8, 'intensity': .8},
    'b': {'primary': 'amber', 'secondary': 'violet', 'form': 'sweep',
          'openness': .8, 'breadth': .6, 'definition': .7, 'intensity': .7, 'flow': .3},
    'c': {'primary': 'blue', 'secondary': 'violet', 'form': 'mantle',
          'openness': .5, 'breadth': .75, 'definition': .75, 'intensity': .7, 'stretch': .3},
}
PROBE_MOVES = {
    'plain': {},
    'counterpoint': {'counterpoint': .8},
    'history': {'history': .7},
    'grounding': {'grounding': .3},
}


def chrome():
    return os.environ.get('CHROME_BIN', 'chromium')


def show(commit, path):
    if commit == 'WORKTREE':
        return (ROOT / path).read_bytes()
    return subprocess.check_output(['git', '-C', str(ROOT), 'show', f'{commit}:{path}'])


def renderer(rev):
    """The renderer script of a revision, extracted once."""
    target = WORK / 'renderers' / rev / 'render_field.py'
    if not target.exists() or REVISIONS[rev][1] == 'WORKTREE':
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_bytes(show(REVISIONS[rev][1], 'scripts/render_field.py'))
    return target


def supports_grounding(rev):
    return b'"grounding"' in renderer(rev).read_bytes()


def strip(svg):
    """Remove everything that states the answer in words."""
    svg = re.sub(r'<metadata\b[^>]*>.*?</metadata>', '', svg, flags=re.S)
    svg = re.sub(r'<title>.*?</title>|<desc>.*?</desc>', '', svg, flags=re.S)
    return re.sub(r'\s(?:aria-label|data-field-[a-z]+)="[^"]*"', '', svg)


def render(rev, spec, out):
    spec = dict(spec)
    if not supports_grounding(rev):
        spec.pop('grounding', None)
    spec_file = out.with_suffix('.json')
    spec_file.write_text(json.dumps(spec))
    raw = out.with_suffix('.raw.svg')
    subprocess.run([sys.executable, str(renderer(rev)), '--spec', str(spec_file), '--output', str(raw)],
                   check=True, capture_output=True)
    out.write_text(strip(raw.read_text()))
    raw.unlink()
    spec_file.unlink()


def png_size(path):
    data = path.read_bytes()
    return struct.unpack('>II', data[16:24])


def shoot(html, png, width, height):
    subprocess.run([chrome(), '--headless=new', '--disable-gpu', '--no-sandbox', '--hide-scrollbars',
                    '--force-device-scale-factor=1', f'--window-size={width},{height}',
                    '--virtual-time-budget=4000', f'--screenshot={png}', str(html)],
                   check=True, capture_output=True, timeout=120)
    assert png_size(png) == (width, height), (png, png_size(png))


def rasterise(svgs, png, size, gap=24):
    """One SVG, or two side by side, at `size` px each."""
    names = ''.join(f'<img src="{s.name}">' for s in svgs)
    html = png.with_suffix('.html')
    html.write_text('<style>html,body{margin:0;background:#000}div{display:flex;gap:%dpx}'
                    'img{display:block;width:%dpx;height:%dpx}</style><div>%s</div>' % (gap, size, size, names))
    shoot(html, png, size*len(svgs) + gap*(len(svgs) - 1), size)
    html.unlink()


def specs():
    """(kind, name, revision) -> controls, with the truth each task scores against."""
    studies = json.loads(show(REVISIONS['4.4'][1], 'references/reference-controls.json'))
    out = {}
    for rev in REVISIONS:
        for name, spec in studies.items():
            if 'grounding' in spec and not supports_grounding(rev):
                continue
            out[('study', name, rev)] = spec
        for base, controls in PROBE_BASES.items():
            for move, change in PROBE_MOVES.items():
                if 'grounding' in change and not supports_grounding(rev):
                    continue
                out[('probe', f'{base}-{move}', rev)] = {**controls, **change}
        for file in ('readers.json', 'readers-run2.json'):
            path = E3_DIR / file
            if not path.exists():
                continue
            run = 'r1' if file == 'readers.json' else 'r2'
            for reader, record in json.loads(path.read_text()).items():
                out[('e3', f'{run}-{reader}', rev)] = record['spec']
    return out


def truth(kind, name, spec):
    if kind == 'study':
        return {'word': name}
    if kind == 'probe':
        move = name.split('-')[1]
        return {'second': move == 'counterpoint', 'held': move == 'history',
                'reconstructed': move == 'grounding'}
    return {k: spec.get(k) for k in ('counterpoint', 'history', 'grounding', 'form', 'primary')}


def build():
    ITEMS.mkdir(parents=True, exist_ok=True)
    manifest = json.loads(MANIFEST.read_text()) if MANIFEST.exists() else {}
    svg_dir = WORK / 'svg'
    svg_dir.mkdir(exist_ok=True)
    jobs = []

    def item(item_id, record, svgs, size):
        known = manifest.get(item_id)
        file = known['file'] if known else secrets.token_hex(4) + '.png'
        manifest[item_id] = {**record, 'file': file}
        if not (ITEMS / file).exists():
            jobs.append((svgs, ITEMS / file, size))

    sources = {}
    for (kind, name, rev), spec in specs().items():
        svg = svg_dir / f'{kind}-{name}-{rev}.svg'
        if not svg.exists():
            render(rev, spec, svg)
        sources[(kind, name, rev)] = svg
        sizes = SIZES if kind == 'study' else (320, 1000) if kind == 'probe' else (320,)
        for size in sizes:
            item(f'{kind}:{name}|{rev}|{size}',
                 {'kind': kind, 'name': name, 'rev': rev, 'size': size, 'truth': truth(kind, name, spec)},
                 [svg], size)
    revs = list(REVISIONS)
    for name in SHARED:
        for size in (160, 320):
            for left, right in ((revs[0], revs[1]), (revs[1], revs[0])):
                item(f'pair:{name}|{left}>{right}|{size}',
                     {'kind': 'pair', 'name': name, 'left': left, 'right': right, 'size': size,
                      'truth': {'left': left, 'right': right}},
                     [sources[('study', name, left)], sources[('study', name, right)]], size)
    # The atlas a taught decoder is shown, per revision.
    for rev, (_, commit) in REVISIONS.items():
        atlas_svg = svg_dir / f'atlas-{rev}.svg'
        if not atlas_svg.exists():
            atlas_svg.write_bytes(show(commit, 'assets/reference-atlas.svg'))
        atlas = ITEMS / f'atlas-{rev}.png'
        if not atlas.exists():
            html = atlas.with_suffix('.html')
            html.write_text('<style>html,body{margin:0;background:#000}img{display:block;width:1000px}</style>'
                            f'<img src="../svg/{atlas_svg.name}">')
            width, height = (int(v) for v in re.search(
                r'viewBox="0 0 (\d+) (\d+)"', atlas_svg.read_text()[:600]).groups())
            shoot(html, atlas, 1000, round(1000*height/width))
            html.unlink()
        grammar = ITEMS / f'grammar-{rev}.md'
        grammar.write_bytes(show(commit, 'references/visual-grammar.md'))

    def run(job):
        svgs, png, size = job
        # Chrome resolves the images relative to the page, so link them beside it.
        links = []
        for s in svgs:
            link = png.parent / (png.stem + '-' + secrets.token_hex(2) + '.svg')
            link.symlink_to(s)
            links.append(link)
        try:
            rasterise(links, png, size)
        finally:
            for link in links:
                link.unlink()

    with ThreadPoolExecutor(4) as pool:
        list(pool.map(run, jobs))
    MANIFEST.write_text(json.dumps(manifest, indent=1, sort_keys=True))
    return manifest, len(jobs)


def load():
    if not MANIFEST.exists():
        sys.exit('No items yet: run scripts/xagent/items.py first')
    return json.loads(MANIFEST.read_text())


if __name__ == '__main__':
    manifest, made = build()
    kinds = {}
    for record in manifest.values():
        kinds[record['kind']] = kinds.get(record['kind'], 0) + 1
    print(f'{len(manifest)} items ({made} rasterised now):',
          ', '.join(f'{n} {k}' for k, n in sorted(kinds.items())))
