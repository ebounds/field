#!/usr/bin/env python3
"""Check the browser renderer against Python. Requires Python 3 and Node.js."""
import json
import math
import random
import re
import subprocess
import xml.etree.ElementTree as ET
from pathlib import Path

from render_field import render

ROOT = Path(__file__).resolve().parents[1]
NUMBER = re.compile(r"-?\d+(?:\.\d+)?(?:e[+-]?\d+)?", re.I)


def equivalent(first, second):
    if first == second:
        return True
    if NUMBER.sub('#', first) != NUMBER.sub('#', second):
        # SVG permits leading zeroes and different decimal precision.
        try:
            return math.isclose(float(first), float(second), abs_tol=.00001)
        except ValueError:
            return False
    a, b = NUMBER.findall(first), NUMBER.findall(second)
    return len(a) == len(b) and all(abs(float(x)-float(y)) <= .011 for x, y in zip(a, b))


def main():
    cases = list(json.loads((ROOT/'references/reference-controls.json').read_text()).values())
    cases += [{}, {'form': 'sweep', 'gesture': 'fold', 'gesture_strength': 1},
              {'form': 'mantle', 'history': 1, 'counterpoint': 1, 'complexity': .45}]
    rng = random.Random(43)
    for form in ('envelope', 'sweep', 'mantle'):
        for _ in range(4):
            cases.append(dict(form=form, history=rng.random(), counterpoint=rng.random(),
                              openness=rng.random(), folding=rng.random(), breadth=rng.random(),
                              stretch=rng.uniform(-1, 1), flow=rng.uniform(-1, 1),
                              tension=rng.random(), intensity=rng.random(), definition=rng.random()))
    module = (ROOT/'docs/site/renderer.mjs').as_uri()
    program = "import {render} from " + json.dumps(module) + "; let input=''; for await (const c of process.stdin) input+=c; console.log(JSON.stringify(JSON.parse(input).map(render)));"
    result = subprocess.run(['node', '--input-type=module', '-e', program],
                            input=json.dumps(cases), text=True, capture_output=True, check=True)
    for index, (spec, browser_svg) in enumerate(zip(cases, json.loads(result.stdout))):
        python_nodes = list(ET.fromstring(render(spec)).iter())
        browser_nodes = list(ET.fromstring(browser_svg).iter())
        assert len(python_nodes) == len(browser_nodes), (index, 'element count')
        for a, b in zip(python_nodes, browser_nodes):
            assert a.tag == b.tag and a.attrib.keys() == b.attrib.keys(), (index, a.tag, a.attrib, b.attrib)
            for key, value in a.attrib.items():
                assert equivalent(value, b.attrib[key]), (index, a.attrib.get('id', a.tag), key, value[:150], b.attrib[key][:150])
            if a.tag.endswith('metadata'):
                assert json.loads(a.text) == json.loads(b.text), (index, 'metadata')
    print(f'{len(cases)} browser renders match Python geometry, material, metadata, and fixed capsule.')


if __name__ == '__main__':
    main()
