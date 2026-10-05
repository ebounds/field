// Does palette carry as far in the music as form does? Node 18+, no dependencies.
// The measure and its thresholds are fixed in docs/field-4.7-listening.md.
//
// For each reference study, change its palette (the primary hue, to each of the
// five others; a secondary, accent or ambient that shared the primary's hue
// follows it) and change its form (to each of the two others), then measure how
// far each change moves the listening fingerprint. Renders run in parallel workers.
import {Worker, isMainThread, parentPort, workerData} from 'node:worker_threads';
import os from 'node:os';
import {fingerprint, distanceParts, timbreFeatures, timeCourseFeatures, namePalettes} from './audio_fingerprint.mjs';

export const HUES = ['teal','blue','violet','amber','coral','pearl'];
export const FORMS = ['envelope','sweep','mantle'];

export function withPrimary(spec, hue) {
  const changed = {...spec, primary:hue};
  for (const key of ['secondary','accent','ambient'])
    if (spec[key] && spec[key]===spec.primary) changed[key] = hue;
  return changed;
}

if (!isMainThread && workerData?.listeningGate) {
  const {renderAudio} = await import('../docs/site/audio.mjs');
  parentPort.on('message', ({id, spec}) => {
    try { parentPort.postMessage({id, print:fingerprint(renderAudio(spec))}); }
    catch (error) { parentPort.postMessage({id, error:error.message}); }
  });
}

async function printAll(specs, concurrency) {
  const jobs = specs.map((spec,id)=>({id,spec})), prints = new Array(specs.length);
  const count = Math.max(1, Math.min(concurrency, jobs.length));
  const workers = Array.from({length:count}, ()=>new Worker(new URL(import.meta.url), {workerData:{listeningGate:true}}));
  try {
    await Promise.all(workers.map(worker=>new Promise((resolve,reject)=>{
      const next = () => {
        const job = jobs.shift();
        if (!job) { resolve(); return; }
        worker.once('message', ({id,print,error}) => {
          if (error) { reject(new Error(error)); return; }
          prints[id] = print; next();
        });
        worker.postMessage(job);
      };
      worker.once('error', reject);
      next();
    })));
  } finally { await Promise.all(workers.map(worker=>worker.terminate())); }
  return prints;
}

/** Palette and form separation over the studies, plus palette naming. */
export async function measureGate(studies, {concurrency=(os.availableParallelism?.()??os.cpus().length)}={}) {
  const specs = [], index = new Map();
  const want = spec => { const key = JSON.stringify(spec); if (!index.has(key)) { index.set(key,specs.length); specs.push(spec); } return index.get(key); };
  const plan = Object.entries(studies).map(([name,spec])=>({name, spec,
    base:want(spec),
    palettes:HUES.map(hue=>({hue, id:want(withPrimary(spec,hue))})),
    forms:FORMS.filter(form=>form!==(spec.form||'envelope')).map(form=>({form, id:want({...spec,form})}))}));
  const prints = await printAll(specs, concurrency);
  const total = parts => parts.loudness+parts.brightness+parts.timbre;
  const mean = values => values.reduce((sum,value)=>sum+value,0)/values.length;
  const perStudy = plan.map(({name,spec,base,palettes,forms})=>{
    const palette = palettes.filter(p=>p.hue!==spec.primary).map(p=>distanceParts(prints[base],prints[p.id]));
    const form = forms.map(f=>distanceParts(prints[base],prints[f.id]));
    const summary = changes => ({total:mean(changes.map(total)),
      loudness:mean(changes.map(c=>c.loudness)), brightness:mean(changes.map(c=>c.brightness)), timbre:mean(changes.map(c=>c.timbre))});
    return {name, palette:summary(palette), form:summary(form)};
  });
  const overall = key => mean(perStudy.map(study=>study[key].total));
  const items = plan.flatMap(({name,palettes})=>palettes.map(({hue,id})=>({study:name, hue, print:prints[id]})));
  const naming = (features, centred) => namePalettes(items.map(item=>({study:item.study, hue:item.hue, features:features(item.print)})), {centred});
  return {
    renders:specs.length, perStudy,
    palette:overall('palette'), form:overall('form'),
    margin:overall('palette')/overall('form'),
    timbreMargin:mean(perStudy.map(s=>s.palette.timbre))/mean(perStudy.map(s=>s.form.timbre)),
    naming:{
      compared:naming(timbreFeatures,true), oneListen:naming(timbreFeatures,false),
      timeCourseCompared:naming(timeCourseFeatures,true)
    },
    levels:plan.map(({name,palettes})=>{
      const level = id => 10*Math.log10(mean(prints[id].frames.map(([rms])=>rms*rms)));
      const values = palettes.map(p=>level(p.id));
      return {name, spread:Math.max(...values)-Math.min(...values)};
    })
  };
}

export function reportGate(result, log=console.log) {
  const f = value => value.toFixed(3);
  for (const s of result.perStudy) log(`  ${s.name.padEnd(11)} palette ${f(s.palette.total)} (timbre ${f(s.palette.timbre)})  form ${f(s.form.total)} (timbre ${f(s.form.timbre)})  ratio ${(s.palette.total/s.form.total).toFixed(2)}`);
  const n = result.naming, out = r => `${r.correct}/${r.total} (chance ${Math.round(r.chance*r.total)})`;
  log(`palette named from timbre, one study in all six palettes: ${out(n.compared)}; from the time course alone: ${out(n.timeCourseCompared)}`);
  log(`palette named from timbre, one listen, no comparison: ${out(n.oneListen)}`);
  log(`palette separation ${f(result.palette)}, form ${f(result.form)}: margin ${result.margin.toFixed(2)} (timbre alone ${result.timbreMargin.toFixed(2)})`);
  log(`level spread across the six palettes of a study: at most ${Math.max(...result.levels.map(l=>l.spread)).toFixed(2)} dB`);
}
