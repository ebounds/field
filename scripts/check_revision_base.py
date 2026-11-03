#!/usr/bin/env python3
"""Check that revision 4.6, with every treatment set back, draws revision 4.5 byte for byte.

Revision 4.6 changes how several quiet meanings are drawn, one switch each
(TREATMENTS in render_field.py). With all of them at "4.5" nothing else may
differ, so each change of 4.6 can be seen and measured on its own. Revision 4.5
is read from its pinned commit, as scripts/xagent/items.py pins it.
Requires Python 3 and git.
"""
import importlib.util
import json
import random
import subprocess
import tempfile
from pathlib import Path

from render_field import REVISION_4_5, TREATMENTS, render

ROOT = Path(__file__).resolve().parents[1]
BASELINE = 'bf6b84d'   # rendering revision 4.5, as frozen for Stage 3


def baseline():
    source = subprocess.run(['git', '-C', str(ROOT), 'show', f'{BASELINE}:scripts/render_field.py'],
                            capture_output=True, text=True, check=True).stdout
    path = Path(tempfile.mkdtemp(prefix='field-4.5-')) / 'render_field_4_5.py'
    path.write_text(source)
    spec = importlib.util.spec_from_file_location('render_field_4_5', path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module.render


def cases():
    found = list(json.loads((ROOT/'references/reference-controls.json').read_text()).values())
    found += [{}, {'grounding': 0}, {'tension': 1}, {'history': 1, 'flow': 1}, {'counterpoint': 1, 'accent': 'coral'}]
    rng = random.Random(46)
    palette = ['teal', 'blue', 'violet', 'amber', 'coral', 'pearl']
    for _ in range(400):
        found.append(dict(form=rng.choice(['envelope', 'sweep', 'mantle']),
                          primary=rng.choice(palette), secondary=rng.choice(palette + [None]),
                          accent=rng.choice(palette + [None, None]), accent_strength=rng.random(),
                          gesture=rng.choice(['none', 'fold', 'echo', 'braid']), gesture_strength=rng.random(),
                          history=rng.choice([0, rng.random()]), counterpoint=rng.choice([0, rng.random()]),
                          openness=rng.random(), folding=rng.random(), breadth=rng.random(),
                          stretch=rng.uniform(-1, 1), flow=rng.uniform(-1, 1), imbalance=rng.uniform(-1, 1),
                          tension=rng.random(), intensity=rng.random(), definition=rng.random(),
                          grounding=rng.choice([1, rng.random()]), complexity=rng.random()))
    return found


def main():
    old = baseline()
    found = cases()
    for index, spec in enumerate(found):
        assert render(spec, REVISION_4_5) == old(spec), (index, spec)
    print(f'{len(found)} fields: with all {len(TREATMENTS)} treatments set back, revision 4.6 draws revision 4.5 ({BASELINE}) byte for byte.')


if __name__ == '__main__':
    main()
