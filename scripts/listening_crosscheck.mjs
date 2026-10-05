// A diagnostic for the 4a listening fingerprint, run after its gate was fixed and
// never in place of it. Node 18+, no dependencies.
//
//   node scripts/listening_crosscheck.mjs [--material-only] [--module path/to/audio.mjs]
//
// The fingerprint describes timbre coarsely (a centroid and six bands). This
// describes it finely, with a mel-cepstrum (the mean and spread of coefficients
// 1 to 12 over the audible frames, and the frame-to-frame change), to see what
// the coarse one misses. A mel-cepstrum resolves single pitches at the low end,
// so it hears a palette's intervals as well as its material. --material-only
// gives every hue the same scale, so a palette change is a change of material
// alone. --module measures another revision of the instrument, for example 1.1
// taken from git: git show a244a80:docs/site/audio.mjs > /tmp/audio-1.1.mjs
// (copy renderer.mjs beside it).
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {PRESETS} from '../docs/site/presets.mjs';
import {fingerprint,distanceParts,timbreFeatures,namePalettes} from './audio_fingerprint.mjs';
import {HUES,FORMS,withPrimary} from './listening_gate.mjs';

const args = process.argv.slice(2);
const materialOnly = args.includes('--material-only');
const at = args.indexOf('--module');
const module = at>=0 ? pathToFileURL(resolve(args[at+1])).href : new URL('../docs/site/audio.mjs', import.meta.url).href;
const {renderAudio,VOICES} = await import(module);
if (materialOnly) for (const voice of Object.values(VOICES)) voice.ratios = [1, 9/8, 3/2, 2, 9/4];

const SIZE = 1024, HOP = 441, BANDS = 40, COEFFICIENTS = 12;
const WINDOW = Float64Array.from({length:SIZE},(_,i)=>.5-.5*Math.cos(2*Math.PI*i/(SIZE-1)));
function fft(re, im) {
  const n = re.length;
  for (let i=1,j=0; i<n; i++) {
    let bit = n>>1;
    for (; j&bit; bit>>=1) j ^= bit;
    j ^= bit;
    if (i<j) { [re[i],re[j]] = [re[j],re[i]]; [im[i],im[j]] = [im[j],im[i]]; }
  }
  for (let size=2; size<=n; size<<=1) {
    const angle = -2*Math.PI/size, wr = Math.cos(angle), wi = Math.sin(angle), half = size>>1;
    for (let i=0; i<n; i+=size) {
      let cr = 1, ci = 0;
      for (let j=0; j<half; j++) {
        const a = i+j, b = a+half, vr = re[b]*cr-im[b]*ci, vi = re[b]*ci+im[b]*cr;
        re[b] = re[a]-vr; im[b] = im[a]-vi; re[a] += vr; im[a] += vi;
        const next = cr*wr-ci*wi; ci = cr*wi+ci*wr; cr = next;
      }
    }
  }
}
const mel = f => 2595*Math.log10(1+f/700), hertz = m => 700*(10**(m/2595)-1);
function melBank(sampleRate, low=50, high=10000) {
  const edges = Array.from({length:BANDS+2},(_,i)=>hertz(mel(low)+(mel(high)-mel(low))*i/(BANDS+1)));
  return Array.from({length:BANDS},(_,b)=>Float64Array.from({length:SIZE/2},(_,k)=>{
    const f = k*sampleRate/SIZE;
    if (f<=edges[b] || f>=edges[b+2]) return 0;
    return f<=edges[b+1] ? (f-edges[b])/(edges[b+1]-edges[b]) : (edges[b+2]-f)/(edges[b+2]-edges[b+1]);
  }));
}
/** Mean and spread of coefficients 1-12 over frames within 40 dB of the loudest, and their mean change. */
function melCepstrum(audio) {
  const bank = melBank(audio.sampleRate), re = new Float64Array(SIZE), im = new Float64Array(SIZE);
  const frames = [], energies = [];
  for (let start=0; start+SIZE<=audio.left.length; start+=HOP) {
    let energy = 0;
    for (let i=0; i<SIZE; i++) { const v = audio.left[start+i]+audio.right[start+i]; re[i] = v*WINDOW[i]; im[i] = 0; energy += v*v; }
    fft(re, im);
    const logs = bank.map(weights=>{ let sum = 1e-10; for (let k=0; k<SIZE/2; k++) sum += weights[k]*(re[k]*re[k]+im[k]*im[k]); return Math.log(sum); });
    frames.push(Array.from({length:COEFFICIENTS},(_,c)=>logs.reduce((sum,v,n)=>sum+v*Math.cos(Math.PI*(c+1)*(n+.5)/BANDS),0)));
    energies.push(energy);
  }
  const loudest = Math.max(...energies), kept = frames.filter((_,i)=>energies[i]>loudest*1e-4);
  const mean = Array.from({length:COEFFICIENTS},(_,c)=>kept.reduce((sum,f)=>sum+f[c],0)/kept.length);
  const spread = Array.from({length:COEFFICIENTS},(_,c)=>Math.sqrt(kept.reduce((sum,f)=>sum+(f[c]-mean[c])**2,0)/kept.length));
  let change = 0;
  for (let i=1; i<kept.length; i++) change += kept[i].reduce((sum,v,c)=>sum+Math.abs(v-kept[i-1][c]),0);
  return [...mean, ...spread, change/(kept.length-1)];
}

const mean = values => values.reduce((sum,v)=>sum+v,0)/values.length;
const rows = [];
for (const [study,spec] of Object.entries(PRESETS)) {
  const add = (kind, hue, changed) => { const audio = renderAudio(changed); rows.push({study, kind, hue, print:fingerprint(audio), fine:melCepstrum(audio)}); };
  for (const hue of HUES) add('palette', hue, withPrimary(spec,hue));
  for (const form of FORMS.filter(form=>form!==(spec.form||'envelope'))) add('form', spec.primary, {...spec,form});
}
// The mel-cepstrum distance: root mean square over its dimensions, each standardised over every rendering.
const dims = rows[0].fine.length;
const centre = Array.from({length:dims},(_,d)=>mean(rows.map(r=>r.fine[d])));
const scale = Array.from({length:dims},(_,d)=>Math.sqrt(mean(rows.map(r=>(r.fine[d]-centre[d])**2)))||1);
const fineDistance = (a,b) => Math.sqrt(mean(a.fine.map((v,d)=>((v-b.fine[d])/scale[d])**2)));
const coarseDistance = (a,b) => { const p = distanceParts(a.print,b.print); return p.loudness+p.brightness+p.timbre; };

const report = (label, distance, features) => {
  const palette = [], form = [], pairs = {};
  for (const study of Object.keys(PRESETS)) {
    const own = rows.filter(r=>r.study===study), base = own.find(r=>r.kind==='palette'&&r.hue===PRESETS[study].primary);
    const hues = own.filter(r=>r.kind==='palette');
    palette.push(mean(hues.filter(r=>r!==base).map(r=>distance(base,r))));
    form.push(mean(own.filter(r=>r.kind==='form').map(r=>distance(base,r))));
    for (let i=0; i<hues.length; i++) for (let j=i+1; j<hues.length; j++) (pairs[hues[i].hue+'/'+hues[j].hue] ??= []).push(distance(hues[i],hues[j]));
  }
  const items = rows.filter(r=>r.kind==='palette').map(r=>({study:r.study, hue:r.hue, features:features(r)}));
  const compared = namePalettes(items,{centred:true}), single = namePalettes(items);
  const ranked = Object.entries(pairs).map(([pair,values])=>[pair,mean(values)]).sort((a,b)=>a[1]-b[1]);
  console.log(`${label}: palette ${mean(palette).toFixed(3)}, form ${mean(form).toFixed(3)}, ratio ${(mean(palette)/mean(form)).toFixed(2)}; palette named ${compared.correct}/${compared.total} compared, ${single.correct}/${single.total} from one listen`);
  console.log(`  closest palettes: ${ranked.slice(0,3).map(([pair,v])=>`${pair} ${v.toFixed(2)}`).join(', ')}`);
};
console.log(`${materialOnly ? 'Material only (one scale for every hue)' : 'Palettes as they are'}, ${at>=0 ? args[at+1] : 'this revision'}:`);
report('fingerprint (the 4a measure)', coarseDistance, r=>timbreFeatures(r.print));
report('mel-cepstrum (diagnostic)', fineDistance, r=>r.fine);
