// Reading-order checks for the visual grammar: hue, light, posture and softness
// are read first, and the marks that are read second (relief, ridge, second
// current, seat of strain, reticulation, gesture) must not take that first look
// from them. Node 18+, git, and a Chrome/Chromium binary; no npm packages.
//
//   CHROME_BIN=/path/to/chromium node scripts/check_reading_order.mjs [commit]
//
// check_expression.mjs asks whether each control still speaks. This asks the
// opposite question: whether the fine marks have started to speak over the
// field. Rendering revision 4.4 passed the first and failed this one: it drew
// its marks as near-white line work, crisp at any definition. Give a commit to
// check that revision's renderer instead of the working tree; a244a80 (4.6.0,
// revision 4.4) fails here, which is what the check is for.
//
// The comparison is with revision 4.3 (release 4.5.1), the last one whose first
// look was not in question. It is rendered here, in the same browser, from its
// pinned commit, so differences between browsers cancel.
import {execFile} from 'node:child_process';
import {mkdtemp, writeFile, readFile, rm} from 'node:fs/promises';
import {promisify} from 'node:util';
import {inflateSync} from 'node:zlib';
import {tmpdir} from 'node:os';
import {dirname, join} from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';
import assert from 'node:assert/strict';

const run = promisify(execFile);
const chrome = process.env.CHROME_BIN || 'chromium';
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const WIDTH = 320;            // the size the grammar promises the expression survives
const BASELINE = '005dbae';   // release 4.5.1, rendering revision 4.3 (as in scripts/xagent/items.py)
const temp = await mkdtemp(join(tmpdir(), 'field-reading-'));

async function rendererAt(commit) {
  const file = join(temp, `renderer-${commit}.mjs`);
  let source;
  try {
    ({stdout: source} = await run('git', ['-C', root, 'show', `${commit}:docs/site/renderer.mjs`], {maxBuffer: 1 << 24}));
  } catch {
    throw new Error(`This check reads the renderer of ${commit} from git. Run it in a clone that has that commit.`);
  }
  await writeFile(file, source);
  return import(pathToFileURL(file).href);
}

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

let batch = 0;
/** Draw every field in one browser launch; returns the red, green and blue planes of each. */
async function shots(svgs) {
  const stem = 'b' + batch++, columns = Math.min(8, svgs.length), rows = Math.ceil(svgs.length/columns);
  await Promise.all(svgs.map((svg, i) => writeFile(join(temp, `${stem}-${i}.svg`), svg)));
  // The page references the drawings by relative name so no absolute path leaks.
  await writeFile(join(temp, stem + '.html'),
    `<style>html,body{margin:0;background:#000}div{display:grid;grid-template-columns:repeat(${columns},${WIDTH}px)}img{display:block;width:${WIDTH}px;height:${WIDTH}px}</style><div>`
    + svgs.map((_, i) => `<img src="${stem}-${i}.svg">`).join('') + '</div>');
  await run(chrome, ['--headless=new', '--disable-gpu', '--no-sandbox', '--hide-scrollbars',
    '--force-device-scale-factor=1', `--window-size=${columns*WIDTH},${rows*WIDTH}`, '--virtual-time-budget=6000',
    '--screenshot=' + join(temp, stem + '.png'), join(temp, stem + '.html')], {timeout: 180000});
  const page = decodePng(await readFile(join(temp, stem + '.png')));
  assert.equal(page.width, columns*WIDTH, 'the browser did not draw the whole sheet');
  return svgs.map((_, i) => {
    const planes = [0, 1, 2].map(() => new Float32Array(WIDTH*WIDTH));
    const left = (i % columns)*WIDTH, top = Math.floor(i/columns)*WIDTH;
    for (let y = 0; y < WIDTH; y++) for (let x = 0; x < WIDTH; x++) {
      const at = ((top+y)*page.width + left+x)*page.channels;
      for (let k = 0; k < 3; k++) planes[k][y*WIDTH+x] = page.data[at+k];
    }
    return planes;
  });
}

function blur(plane, sigma) {   // separable Gaussian, edges held
  const radius = Math.ceil(sigma*3), kernel = [];
  let sum = 0;
  for (let i = -radius; i <= radius; i++) sum += kernel[i+radius] = Math.exp(-(i*i)/(2*sigma*sigma));
  const clamp = v => Math.min(WIDTH-1, Math.max(0, v));
  const pass = (source, step) => {
    const out = new Float32Array(source.length);
    for (let y = 0; y < WIDTH; y++) for (let x = 0; x < WIDTH; x++) {
      let value = 0;
      for (let i = -radius; i <= radius; i++) value += kernel[i+radius]*source[step ? clamp(y+i)*WIDTH+x : y*WIDTH+clamp(x+i)];
      out[y*WIDTH+x] = value/sum;
    }
    return out;
  };
  return pass(pass(plane, 0), 1);
}
const luma = ([r, g, b]) => r.map((v, i) => (v*299 + g[i]*587 + b[i]*114)/1000);
function cielab(r, g, b) {
  const linear = v => (v /= 255) > .04045 ? ((v+.055)/1.055)**2.4 : v/12.92;
  const f = t => t > .008856 ? Math.cbrt(t) : 7.787*t + 16/116;
  [r, g, b] = [linear(r), linear(g), linear(b)];
  const x = f((.4124*r + .3576*g + .1805*b)/.95047), y = f(.2126*r + .7152*g + .0722*b), z = f((.0193*r + .1192*g + .9505*b)/1.08883);
  return [116*y-16, 500*(x-y), 200*(y-z)];
}

/** Fine detail: the share of the frame, in percent, whose brightness differs
 *  from its own two-pixel blur by more than a just-noticeable amount. Line work
 *  and hard edges score; colour, glow and soft form do not. */
function fineDetail(planes) {
  const light = luma(planes), soft = blur(light, 2);
  return 100*light.reduce((n, v, i) => n + (Math.abs(v-soft[i]) > 6), 0)/light.length;
}
/** Field chroma: the mean CIELAB chroma of whatever stands out from its
 *  surroundings (more than ΔE 6 from a heavy blur of the picture). */
function fieldChroma(planes) {
  const far = planes.map(plane => blur(plane, WIDTH*.08));
  let n = 0, total = 0;
  for (let i = 0; i < planes[0].length; i++) {
    const here = cielab(planes[0][i], planes[1][i], planes[2][i]), around = cielab(far[0][i], far[1][i], far[2][i]);
    if (Math.hypot(here[0]-around[0], here[1]-around[1], here[2]-around[2]) > 6) { n++; total += Math.hypot(here[1], here[2]); }
  }
  return total/Math.max(1, n);
}
/** Crests: thin structures brighter than their surroundings. Their mean chroma,
 *  and the share of the frame, in percent, taken by crests that are nearly white. */
function crests(planes) {
  const light = luma(planes), soft = blur(light, 2);
  let n = 0, pale = 0, total = 0;
  for (let i = 0; i < light.length; i++) if (light[i]-soft[i] > 8) {
    const [, a, b] = cielab(planes[0][i], planes[1][i], planes[2][i]), chroma = Math.hypot(a, b);
    n++; total += chroma; pale += chroma < 16;
  }
  return {chroma: total/Math.max(1, n), pale: 100*pale/light.length};
}

const failures = [];
let clause = '';
const heading = text => { clause = text; console.log('\n' + text); };
const line = (label, value, limit, ok, relation) => {
  console.log(`  ${label.padEnd(32)} ${value.toFixed(2).padStart(7)}  ${relation} ${limit.toFixed(2).padStart(7)}  ${ok ? 'holds' : 'FAILS'}`);
  if (!ok) failures.push(`${clause.split(':')[0]} (${label}: ${value.toFixed(2)}, must be ${relation} ${limit.toFixed(2)})`);
};

try {
  const commit = process.argv[2];
  const candidate = commit ? await rendererAt(commit) : await import('../docs/site/renderer.mjs');
  const before = await rendererAt(BASELINE);
  const studies = JSON.parse(await readFile(join(root, 'references/reference-controls.json'), 'utf8'));
  // The baseline has no grounding, so it can only be compared on fields that are fully met.
  const shared = Object.keys(studies).filter(name => studies[name].grounding === undefined);
  const hasPearl = name => ['primary', 'secondary', 'accent'].some(key => studies[name][key] === 'pearl');
  const grounded = Object.hasOwn(candidate.DEFAULTS, 'grounding');
  console.log(`Rendering revision ${candidate.REVISION}${commit ? ' at ' + commit : ''}, against revision ${before.REVISION}, at ${WIDTH}px.`);

  // A field that carries every second-look mark, so each has the chance to be too loud.
  const marked = {version: 4, primary: 'teal', secondary: 'blue', accent: 'coral', form: 'envelope',
    openness: .6, breadth: .7, intensity: .8, complexity: .6, history: .6, counterpoint: .6,
    gesture: 'braid', gesture_strength: .6};
  const steps = [.05, .2, .4, .6, .8, 1];
  const sweep = (await shots(steps.map(definition => candidate.render({...marked, definition})))).map(fineDetail);
  const sweepBefore = (await shots(steps.map(definition => before.render({...marked, definition})))).map(fineDetail);
  heading('Fine detail follows definition: % of the frame, on a field carrying every mark');
  steps.forEach((definition, i) => {
    if (i) line(`definition ${steps[i-1]} to ${definition}`, sweep[i], sweep[i-1], sweep[i] >= sweep[i-1]-.05, '≥');
  });
  line('from least to most defined', sweep.at(-1)-sweep[0], 1, sweep.at(-1)-sweep[0] >= 1, '≥');
  heading('A diffuse field stays diffuse: no more fine detail than revision ' + before.REVISION);
  steps.forEach((definition, i) => { if (definition <= .2) line(`every mark, definition ${definition}`, sweep[i], sweepBefore[i], sweep[i] <= sweepBefore[i], '≤'); });

  const drawn = await shots(shared.map(name => candidate.render(studies[name])));
  const drawnBefore = await shots(shared.map(name => before.render(studies[name])));
  const fine = Object.fromEntries(shared.map((name, i) => [name, fineDetail(drawn[i])]));
  const at = shared.indexOf('tentative');
  line('tentative', fine.tentative, fineDetail(drawnBefore[at]), fine.tentative <= fineDetail(drawnBefore[at]), '≤');
  line('tentative against gathered', fine.tentative, fine.gathered, fine.tentative <= fine.gathered, '≤');

  heading('The field keeps its colour: chroma at least that of revision ' + before.REVISION + ', within 2 %');
  shared.forEach((name, i) => {
    const now = fieldChroma(drawn[i]), then = fieldChroma(drawnBefore[i]);
    line(name, now, .98*then, now >= .98*then, '≥');
  });
  if (grounded) {
    // One-sided: what must not happen is the hue draining out of a described field.
    heading('The hue survives being described: chroma at grounding .3 no more than 5 % under grounding 1');
    const names = Object.keys(studies);
    const pairs = await shots(names.flatMap(name => [1, .3].map(grounding => candidate.render({...studies[name], grounding}))));
    names.forEach((name, i) => {
      const met = fieldChroma(pairs[2*i]), described = fieldChroma(pairs[2*i+1]);
      line(name, described, .95*met, described >= .95*met, '≥');
    });
  }
  heading('Light carries colour: near-white crests take no more of the frame (%) than in revision ' + before.REVISION);
  shared.forEach((name, i) => {
    const now = crests(drawn[i]), then = crests(drawnBefore[i]);
    // Pearl is the one colour that means near-white, so a palette that names it may use it.
    if (hasPearl(name)) console.log(`  ${name.padEnd(32)} ${now.pale.toFixed(2).padStart(7)}  (${then.pale.toFixed(2)} before)  pearl is in its palette`);
    else line(name, now.pale, then.pale, now.pale <= then.pale, '≤');
  });
  heading('What is lit is coloured: mean chroma of crests at least that of revision ' + before.REVISION + ', within 2 %');
  shared.forEach((name, i) => {
    const now = crests(drawn[i]).chroma, then = crests(drawnBefore[i]).chroma;
    line(name, now, .98*then, now >= .98*then, '≥');
  });
  assert.equal(failures.length, 0, 'The second look is speaking over the first: ' + failures.join('; '));
  console.log('\nPassed: fine detail follows definition, a diffuse field stays diffuse, and the marks keep to the field\'s own colour.');
} finally {
  await rm(temp, {recursive: true, force: true});
}
