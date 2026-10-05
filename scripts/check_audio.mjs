// PCM integrity and semantic checks for the shared musical instrument. Node 18+.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {compose,renderAudio,encodeWav} from '../docs/site/audio.mjs';
import {PRESETS} from '../docs/site/presets.mjs';
import {DEFAULTS} from '../docs/site/renderer.mjs';
import {fingerprint,listeningDistance,timeCourseDistance} from './audio_fingerprint.mjs';
import {measureGate,reportGate} from './listening_gate.mjs';

const hash=array=>createHash('sha256').update(new Uint8Array(array.buffer)).digest('hex');
function measure(audio) {
  let peak=0,energy=0,dc=0,difference=0,stereo=0;
  for(let i=0;i<audio.left.length;i++) {
    const l=audio.left[i],r=audio.right[i];
    assert(Number.isFinite(l)&&Number.isFinite(r));
    peak=Math.max(peak,Math.abs(l),Math.abs(r));energy+=l*l+r*r;dc+=l+r;
    stereo+=(l-r)**2;
    if(i) difference=Math.max(difference,Math.abs(l-audio.left[i-1]),Math.abs(r-audio.right[i-1]));
  }
  assert(peak<=.721&&peak>.025,`peak ${peak}`);
  assert(Math.abs(dc/(audio.left.length*2))<.001,'DC offset');
  assert.equal(audio.left[0],0);assert.equal(audio.right[0],0);
  assert.equal(Math.abs(audio.left.at(-1)),0);assert.equal(Math.abs(audio.right.at(-1)),0);
  assert.equal(audio.duration,24);assert.equal(audio.left.length,24*audio.sampleRate);
  assert(difference<.2,`discontinuity ${difference}`);
  assert(stereo>0,'stereo information');
  return {peak:+peak.toFixed(3),rms:+Math.sqrt(energy/(audio.left.length*2)).toFixed(4)};
}

/** Rests: stretches between 1 s and 22 s where no voice of the score sounds,
 *  with the quietest 50 ms of each measured against the piece's loud level. */
function restsOf(score,audio) {
  const spans=score.events.map(e=>[e.start,e.start+e.duration]).sort((a,b)=>a[0]-b[0]);
  const rests=[];let reach=0;
  for(const [start,end] of spans) {if(start-reach>=.5&&reach>1&&start<22) rests.push([reach,start]);reach=Math.max(reach,end);}
  const step=Math.round(audio.sampleRate*.05),levels=[];
  for(let i=0;i+step<=audio.left.length;i+=step) {
    let energy=0;for(let j=i;j<i+step;j++) energy+=(audio.left[j]+audio.right[j])**2;
    levels.push(10*Math.log10(energy/step+1e-20));
  }
  const loud=[...levels].sort((a,b)=>a-b)[Math.floor(levels.length*.95)];
  return rests.map(([start,end])=>({start,end,depth:Math.min(...levels.slice(Math.ceil(start/.05),Math.floor(end/.05)))-loud}));
}

const hashes=new Set(),prints=new Map();
for(const [name,spec] of Object.entries(PRESETS)) {
  const audio=renderAudio(spec);
  console.log(name,measure(audio));hashes.add(hash(audio.left));prints.set(name,fingerprint(audio));
  const score=compose(spec),anchor=score.events.find(e=>e.role==='center');
  assert.equal(anchor.pan,0);assert.equal(anchor.frequency,73.41619197935);
  // Real rests (Edgar, 4 October: the centre may fall silent). Nothing sounds
  // between the statement and the answer, or before the return, so the room
  // empties; and the centre comes back for the close: it returns to D.
  const rests=restsOf(score,audio),centres=score.events.filter(e=>e.role==='center');
  assert(rests.length>=2,`${name} should rest twice`);
  for(const rest of rests) assert(rest.depth<=-30,`${name} rest at ${rest.start.toFixed(1)}s is not silent: ${rest.depth.toFixed(1)} dB`);
  assert(centres.some(e=>e.start>=rests.at(-1).end),`${name}: the centre should return after the last rest`);
  assert(!centres.some(e=>e.start<rests[0].end&&e.start+e.duration>rests[0].start),`${name}: the centre should fall silent in the first rest`);
  for(const event of score.events) {
    assert(event.start>=0&&event.duration>0&&event.start+event.duration<=24);
    assert(event.frequency>50&&event.frequency<2000);
  }
  const wav=Buffer.from(encodeWav(audio));
  assert.equal(wav.toString('ascii',0,4),'RIFF');
  assert.equal(wav.readUInt32LE(4),wav.length-8);
  assert.equal(wav.readUInt16LE(22),2);assert.equal(wav.readUInt32LE(24),44100);
  assert.equal(wav.readUInt16LE(34),16);assert.equal(wav.readUInt32LE(40),24*44100*4);
  const info=44+24*44100*4;
  assert.equal(wav.toString('ascii',info,info+4),'LIST');
  const metadata=JSON.parse(wav.toString('utf8',info+20,info+20+wav.readUInt32LE(info+16)-1));
  assert.deepEqual(metadata.spec,audio.spec);
  assert.deepEqual(Object.keys(metadata),['fieldAudio','spec']);
}
assert.equal(hashes.size,Object.keys(PRESETS).length,'studies should render distinct samples');
// Distinct samples are not yet distinct music. Every pair of studies must also
// differ audibly, and the closest pair is reported so the margin stays visible.
{
  const names=[...prints.keys()];let closest=Infinity,pair='',course=0;
  for(let i=0;i<names.length;i++) for(let j=i+1;j<names.length;j++) {
    const distance=listeningDistance(prints.get(names[i]),prints.get(names[j]));
    if(distance<closest) {closest=distance;pair=names[i]+'/'+names[j];
      course=timeCourseDistance(prints.get(names[i]),prints.get(names[j]));}
  }
  console.log('closest pair',pair,closest,'(time course alone',course+')');
  assert(closest>=.20,`studies ${pair} are too alike to hear apart: ${closest}`);
}
// Epistemic texture must be audible: an inferred reading keeps a voice's
// outline and loses its body, so it cannot render the same as a grounded one.
{
  const spec={primary:'violet',secondary:'teal',breadth:.6,definition:.7};
  const distance=listeningDistance(fingerprint(renderAudio({...spec,grounding:1})),
    fingerprint(renderAudio({...spec,grounding:.15})));
  console.log('grounding distance',distance);
  assert(distance>=.25,`grounding is inaudible: ${distance}`);
}
assert.equal(hash(renderAudio(PRESETS.exploring).left),hash(renderAudio(PRESETS.exploring).left),'deterministic');
assert.deepEqual(compose({primary:'amber',history:.2}),compose({history:.2,primary:'amber'}),'property order');
assert.equal(compose({history:0,counterpoint:0}).events.some(e=>['trace','counterpoint'].includes(e.role)),false);
assert(compose({history:1,counterpoint:1}).events.some(e=>e.role==='trace'));
assert(compose({history:1,counterpoint:1}).events.some(e=>e.role==='counterpoint'));
const allHigh=Object.fromEntries(Object.entries(DEFAULTS).map(([k,v])=>[k,typeof v==='number'&&k!=='version'?1:v]));
measure(renderAudio({...allHigh,primary:'coral',secondary:'coral',accent:'coral',gesture:'braid',saturation:1.35}));
measure(renderAudio({intensity:0,complexity:0,definition:0,breadth:0,openness:0}));
for(const invalid of [{tension:NaN},{history:2},{version:3},{primary:'red'},{secret:'no'}]) assert.throws(()=>renderAudio(invalid));
for(const sampleRate of [0,NaN,1e9,44100.5]) assert.throws(()=>renderAudio({}, {sampleRate}));
// Palette carried as far as form? First the measure must hear palette at all:
// heard in all six palettes, a study's palette has to be named from timbre well
// above chance. Then palette's separation is set against form's and the margin
// reported. See docs/field-4.7-listening.md for the measure and its thresholds.
{
  const gate=await measureGate(PRESETS);
  reportGate(gate);
  const {compared,timeCourseCompared}=gate.naming;
  assert(compared.accuracy>=.5,`the timbre term cannot name palettes: ${compared.correct}/${compared.total}`);
  assert(compared.correct>timeCourseCompared.correct,'the timbre term should hear palette better than the time course');
  // Palette must not win by being louder.
  const spread=Math.max(...gate.levels.map(l=>l.spread));
  assert(spread<=1.5,`a palette change moves the level by ${spread.toFixed(2)} dB`);
  // The 4a gate is palette at least as far as form (margin 1). Listening 1.2
  // reaches 0.71 with the mantle an octave up, as in 1.1; whether the mantle
  // should arch instead is Edgar's decision (the note, section 4). Until then,
  // hold the ground gained: 1.1 measured 0.28.
  console.log(gate.margin>=1?'4a gate met.':`4a gate not met: margin ${gate.margin.toFixed(2)} of 1.00 (see docs/field-4.7-listening.md).`);
  assert(gate.margin>=.6,`palette has fallen back toward 1.1's margin: ${gate.margin.toFixed(2)}`);
}
console.log('Passed: distinct studies, real rests and the centre\'s return, palette heard in timbre, deterministic audio, center, optional voices, extremes, fades, headroom, stereo WAV/metadata, and invalid input.');
