// Perceptibility checks for the visual grammar: every control that carries a
// distinct meaning must actually change what a viewer sees, at the size the
// grammar promises. Node 18+ and a Chrome/Chromium binary; no npm packages.
//
//   CHROME_BIN=/path/to/chromium node scripts/check_expression.mjs
//
// Rendering revision 4.3 passed every structural check while several semantic
// controls drew almost nothing. Structural parity cannot notice that, so the
// floors below are the guard: a channel that stops speaking fails here.
import {execFile} from 'node:child_process';
import {mkdtemp, writeFile, readFile, rm} from 'node:fs/promises';
import {promisify} from 'node:util';
import {inflateSync} from 'node:zlib';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import assert from 'node:assert/strict';
import {render} from '../docs/site/renderer.mjs';

const run = promisify(execFile);
const chrome = process.env.CHROME_BIN || 'chromium';
const WIDTH = 320; // the size the grammar promises the expression survives

/** Minimal PNG reader for Chrome's screenshots: 8-bit truecolour, no interlace. */
function decodePng(buffer) {
  let width = 0, height = 0, channels = 4, offset = 8;
  const parts = [];
  while (offset < buffer.length) {
    const length = buffer.readUInt32BE(offset), type = buffer.toString('ascii', offset+4, offset+8);
    const body = buffer.subarray(offset+8, offset+8+length);
    if (type === 'IHDR') {
      width = body.readUInt32BE(0); height = body.readUInt32BE(4);
      assert.equal(body[8], 8, 'expected 8-bit PNG'); assert.equal(body[12], 0, 'expected no interlacing');
      channels = {0:1, 2:3, 4:2, 6:4}[body[9]];
    } else if (type === 'IDAT') parts.push(body);
    else if (type === 'IEND') break;
    offset += 12 + length;
  }
  const raw = inflateSync(Buffer.concat(parts)), stride = width*channels;
  const out = Buffer.alloc(height*stride);
  for (let y = 0; y < height; y++) {
    const filter = raw[y*(stride+1)], line = raw.subarray(y*(stride+1)+1, (y+1)*(stride+1));
    for (let x = 0; x < stride; x++) {
      const a = x >= channels ? out[y*stride+x-channels] : 0;
      const b = y ? out[(y-1)*stride+x] : 0;
      const c = x >= channels && y ? out[(y-1)*stride+x-channels] : 0;
      let value = line[x];
      if (filter === 1) value += a;
      else if (filter === 2) value += b;
      else if (filter === 3) value += (a+b) >> 1;
      else if (filter === 4) {
        const p = a+b-c, pa = Math.abs(p-a), pb = Math.abs(p-b), pc = Math.abs(p-c);
        value += pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
      }
      out[y*stride+x] = value & 255;
    }
  }
  return {width, height, channels, data: out};
}

/** Share of the frame that changes by more than a just-noticeable amount, and
 *  how far above that threshold it reads. Area alone rewards silhouette moves. */
function perceptibility(first, second) {
  const {data: a, channels} = first, {data: b} = second;
  const pixels = a.length/channels, deltas = [];
  for (let i = 0; i < a.length; i += channels) {
    const delta = (Math.abs(a[i]-b[i]) + Math.abs(a[i+1]-b[i+1]) + Math.abs(a[i+2]-b[i+2]))/3;
    if (delta > 8) deltas.push(delta);
  }
  if (!deltas.length) return 0;
  deltas.sort((x, y) => x-y);
  const p90 = deltas[Math.floor(deltas.length*.9)];
  return +(100*(deltas.length/pixels)*Math.min(1, p90/40)).toFixed(2);
}

const temp = await mkdtemp(join(tmpdir(), 'field-expression-'));
let index = 0;
async function shot(spec) {
  const stem = 'f' + index++, name = join(temp, stem);
  await writeFile(name + '.svg', render(spec));
  // The page references the drawing by relative name so no absolute path leaks.
  await writeFile(name + '.html',
    `<style>html,body{margin:0;background:#000}img{display:block;width:${WIDTH}px}</style><img src="${stem}.svg">`);
  await run(chrome, ['--headless=new', '--disable-gpu', '--no-sandbox', '--hide-scrollbars',
    '--force-device-scale-factor=1', `--window-size=${WIDTH},${WIDTH}`, '--virtual-time-budget=4000',
    '--screenshot=' + name + '.png', name + '.html'], {timeout: 60000});
  return decodePng(await readFile(name + '.png'));
}

// A field wide enough to carry surface detail, so fine structure is not judged
// on a contour too thin to hold it.
const base = {version: 4, primary: 'teal', secondary: 'blue', form: 'envelope',
  openness: .6, breadth: .7, definition: .8, intensity: .8};
// Regression floors, not targets, each with roughly 40% headroom below what
// revision 4.4 measures here. For comparison, revision 4.3 scored 0 for
// complexity, .22 for gesture, 1.29 for counterpoint and 3.4 for history on
// these same pairs, and had no grounding at all.
const channels = [
  ['openness',        {openness: .1},          {openness: 1},          4],
  ['breadth',         {breadth: .1},           {breadth: 1},           4],
  ['folding',         {folding: 0},            {folding: 1},           2],
  ['definition',      {definition: .05},       {definition: 1},        2],
  ['intensity',       {intensity: .1},         {intensity: 1},         2],
  ['history',         {history: 0},            {history: 1},           3.2],
  ['grounding',       {grounding: 1},          {grounding: 0},         4],
  ['tension',         {tension: 0},            {tension: 1},           1.8],
  ['complexity',      {complexity: 0},         {complexity: 1},        .85],
  ['counterpoint',    {counterpoint: 0},       {counterpoint: 1},      1.3],
  ['accent_strength', {accent: 'coral', accent_strength: 0},
                      {accent: 'coral', accent_strength: 1},           1.2],
  ['gesture_strength',{gesture: 'braid', gesture_strength: 0},
                      {gesture: 'braid', gesture_strength: 1},         .5]
];

try {
  const failures = [];
  for (const [name, low, high, floor] of channels) {
    const score = perceptibility(await shot({...base, ...low}), await shot({...base, ...high}));
    const ok = score >= floor;
    console.log(`${name.padEnd(17)} ${String(score).padStart(6)}  floor ${String(floor).padStart(4)}  ${ok ? 'reads' : 'TOO FAINT'}`);
    if (!ok) failures.push(`${name}: ${score} < ${floor}`);
  }
  assert.equal(failures.length, 0, 'Controls that no longer read: ' + failures.join('; '));
  // Epistemic texture must not collapse into low definition: a described form
  // keeps its structure exact, an unresolved one does not.
  const inferred = await shot({...base, grounding: .15});
  const vague = await shot({...base, definition: .08});
  assert(perceptibility(inferred, vague) >= 3,
    'grounding and definition must not look alike');
  console.log('\nPassed: every semantic control reads at ' + WIDTH + 'px, and grounding is distinct from definition.');
} finally {
  await rm(temp, {recursive: true, force: true});
}
