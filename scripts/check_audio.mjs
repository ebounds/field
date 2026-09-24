// PCM integrity and semantic checks for the shared musical instrument. Node 18+.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {compose,renderAudio,encodeWav} from '../docs/site/audio.mjs';
import {PRESETS} from '../docs/site/presets.mjs';
import {DEFAULTS} from '../docs/site/renderer.mjs';

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

const hashes=new Set();
for(const [name,spec] of Object.entries(PRESETS)) {
  const audio=renderAudio(spec);
  console.log(name,measure(audio));hashes.add(hash(audio.left));
  const score=compose(spec),anchor=score.events.find(e=>e.role==='center');
  assert.equal(anchor.pan,0);assert.equal(anchor.frequency,73.41619197935);
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
assert.equal(hashes.size,6,'studies should sound different');
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
console.log('Passed: six distinct studies, deterministic audio, center, optional voices, extremes, fades, headroom, stereo WAV/metadata, and invalid input.');
