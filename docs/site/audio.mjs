// Field Listening 1.0. One deterministic instrument for the browser and Node.
// No samples, network, transcript, or model inference. Input is the Field v4 spec.
import {validate} from './renderer.mjs';

export const AUDIO_REVISION = '1.0';
export const DURATION = 24;
export const SAMPLE_RATE = 44100;
const TAU = 2 * Math.PI;
const ROOT = 146.8323839587; // D3: the same center in every composition.
const clamp = (x, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, x));
const ease = x => { x = clamp(x); return x*x*(3-2*x); };

// These are authored conventions, not universal emotional meanings of intervals.
// Ratios share a tonal center, allowing colors to coexist without key changes.
export const VOICES = {
  teal:   {ratios:[1, 9/8, 3/2, 2, 9/4], partials:[1,.16,.22,.04,.035], glass:.02, name:'breathing wood'},
  blue:   {ratios:[1, 4/3, 3/2, 2, 8/3], partials:[1,.055,.025,.01], glass:0, name:'clear, spare tones'},
  violet: {ratios:[1, 9/8, 6/5, 3/2, 9/4], partials:[1,.11,.075,.025], glass:.20, name:'suspended glass'},
  amber:  {ratios:[1, 5/4, 3/2, 5/3, 2], partials:[1,.32,.12,.06,.025], glass:.01, name:'soft felt and wood'},
  coral:  {ratios:[1, 16/15, 4/3, 3/2, 8/5], partials:[1,.24,.18,.075,.055], glass:.05, name:'bowed, close intervals'},
  pearl:  {ratios:[1, 5/4, 3/2, 2, 3], partials:[1,.09,.035,.012], glass:.08, name:'open harmonic light'}
};

/** A musical form, not a chronology or reconstruction of a conversation. */
export function compose(spec = {}) {
  const p = validate(spec), events = [];
  const main = VOICES[p.primary];
  const air = .22 + p.openness*.68;
  const add = (start, duration, ratio, color, level, pan, role, extra = {}) => {
    events.push({start, duration:Math.min(duration, 21.8-start), frequency:ROOT*ratio,
      color, level, pan:clamp(pan + p.imbalance*.16,-.85,.85), role, ...extra});
  };

  // The capsule's audible counterpart stays centered and independent of palette.
  add(.12,21.6,.5,'pearl',.095,0,'center',{anchor:true,pan:0});
  if(p.ambient_strength>0) add(1.4,20.4,.75,p.ambient||p.primary,
    .022*p.ambient_strength,0,'atmosphere',{soft:true});
  const order = p.form === 'sweep' ? [0,1,2,3,4,2,1] :
    p.form === 'mantle' ? [3,2,4,1,3,2,0] : [0,2,1,3,2,1,0];
  const onsets = p.form === 'sweep' ? [1.1,3.5,6.2,8.7,12,15.5,18.5] :
    p.form === 'mantle' ? [.9,3.9,7.1,9.6,12.8,16.1,18.4] : [.8,3.2,6.1,9,12,15.3,18.2];
  for (let i=0; i<order.length; i++) {
    const arc = Math.sin(i/6*Math.PI);
    const pan = p.form === 'sweep' ? (i/6*2-1)*air : Math.sin(i*2.4)*air*.65;
    const register = p.form === 'mantle' ? 2 : (i===4 && p.openness>.7 ? 2 : 1);
    const duration = (p.form === 'mantle' ? 6.8 : 5.0) + 2.1*p.breadth;
    const onset = onsets[i] + Math.sin(i*1.9)*p.folding*.5;
    add(onset,duration,main.ratios[order[i]]*register,p.primary,
      .115*(.82+.18*arc),pan,'voice',{articulation:p.definition});

    // Breadth is weight and voicing, rather than an increase in master volume.
    if (i%2===0 && p.breadth>.15) add(onset+.45,duration+1,
      main.ratios[order[i]]*.5,p.primary,.043*p.breadth,-pan*.55,'body');

    // A remembered contour grows from an existing voice; never a separate timeline.
    if (p.history>0 && i<5) add(onset+2.1,4.5+p.history*2,
      main.ratios[order[i]],p.primary,.049*p.history,-pan*.8,'trace',{soft:true});
  }

  // A second color lives in the same room, sharing the root and phrase boundaries.
  if (p.secondary) {
    const secondary = VOICES[p.secondary];
    for (let i=0; i<4; i++) add(2.6+i*4.6,6.3,
      secondary.ratios[[2,1,3,0][i]],p.secondary,.042,
      Math.cos(i*2.2)*air*.55,'companion',{soft:true});
  }
  if (p.counterpoint>0) {
    const color = p.secondary || p.accent || p.primary;
    const ratios = VOICES[color].ratios;
    for (let i=0; i<4; i++) add(5.1+i*3.7,4.2,
      ratios[[1,3,2,0][i]]*(i===1?2:1),color,.062*p.counterpoint,
      (i%2===0?-.7:.7)*air,'counterpoint',{articulation:p.definition});
  }
  // Folding and complexity make a sparse filigree; there is no mechanical beat.
  const detail = Math.round(p.complexity*6);
  for (let i=0; i<detail; i++) add(4.4+i*2.6+Math.sin(i*2)*p.folding*.65,2.7,
    main.ratios[[2,4,1,3,2,0][i]]*2,p.primary,.027,
    Math.sin(i*2.1)*air,'filament',{articulation:1});
  if (p.accent && p.accent_strength>0) {
    for (let i=0; i<2; i++) add(7.6+i*7.1,4.8,
      VOICES[p.accent].ratios[i===0?2:1]*2,p.accent,.048*p.accent_strength,
      (i===0?-.45:.45)*air,'accent',{articulation:.85});
  }
  if (p.gesture!=='none' && p.gesture_strength>0) {
    const sequence = p.gesture==='fold' ? [3,1,2] : p.gesture==='braid' ? [1,3,2] : [2,2,2];
    sequence.forEach((index,i)=>add(10.5+i*(p.gesture==='echo'?1.6:1.1),3.3,
      main.ratios[index]*(p.gesture==='braid'&&i===1?2:1),p.primary,
      .034*p.gesture_strength*(p.gesture==='echo'?1-i*.23:1),
      Math.sin(i*2+1)*air,'gesture',{articulation:.8}));
  }
  // A quiet open fifth lets the phrase settle without forcing a major/minor ending.
  add(18.9,2.9,1,p.primary,.063,0,'return',{soft:true});
  add(19.3,2.5,1.5,p.primary,.027,air*.3,'return',{soft:true});
  return {revision:AUDIO_REVISION,duration:DURATION,spec:p,events};
}

function synthVoice(left, right, sampleRate, event, p) {
  const voice = VOICES[event.color];
  const first = Math.floor(event.start*sampleRate);
  const length = Math.min(Math.floor(event.duration*sampleRate),left.length-first);
  const definition = event.articulation ?? p.definition;
  const attack = event.anchor ? 2.5 : event.soft ? 1.8 : .10+1.65*(1-definition);
  const release = event.anchor ? 3.6 : Math.min(event.duration*.48,1.1+1.1*p.breadth);
  const brightness = (.65+.35*p.saturation)*(1-p.stretch*.15)*(event.soft?.65:1);
  const frequency = event.frequency;
  const travel = event.anchor?0:p.flow*.2;
  const beating = event.anchor?0:p.tension*(event.role==='counterpoint'?1.9:.75);
  const partials = event.anchor ? [1,.12,.025] : voice.partials;
  const presence = .82+.78*p.intensity;
  let noiseState=(Math.round(frequency*1000)+Math.round(event.start*10000))|0,breath=0;
  for (let j=0; j<length; j++) {
    const t = j/sampleRate;
    const envelope = ease(t/attack)*ease((event.duration-t)/release);
    const decay = event.anchor?1:(.48+.52*Math.exp(-t/(2.1+3.5*p.breadth)));
    // Slow phase drift is shallow enough to retain a stable musical pitch.
    const drift = event.anchor?0:.12*Math.sin(TAU*.21*t+event.start);
    const phase = TAU*frequency*t + drift;
    let value = 0;
    for (let k=0;k<partials.length;k++) {
      if (frequency*(k+1)>sampleRate*.43) break;
      value += partials[k]*(k===0?1:brightness)*Math.sin(phase*(k+1)) *
        (k===0?1:Math.exp(-t*k*(.045+.025*definition)));
    }
    if (!event.anchor) {
      // A muted non-harmonic rim, like a fingertip around glass.
      value += voice.glass*brightness*Math.exp(-t*.75)*Math.sin(phase*2.756);
      // Pressure produces a restrained beating neighbor, never a volume alarm.
      value = value*(1-p.tension*.13) + p.tension*.13*Math.sin(phase+TAU*beating*t);
      // A little air within wood and bow, generated deterministically per voice.
      noiseState^=noiseState<<13;noiseState^=noiseState>>>17;noiseState^=noiseState<<5;
      breath+=.18*((noiseState>>>0)/2147483648-1-breath);
      if(event.color==='teal'||event.color==='coral') value+=breath*(.018+.02*(1-definition));
    }
    value *= envelope*decay*event.level*presence;
    const pan = clamp(event.pan+travel*Math.sin(t*.28),-.9,.9);
    left[first+j] += value*Math.cos((pan+1)*Math.PI/4);
    right[first+j] += value*Math.sin((pan+1)*Math.PI/4);
  }
}

// A small, damped room with unequal delay lengths; the tail belongs to the voices.
function reverberate(left, right, sampleRate, p) {
  const wet = .13+.18*p.openness+.13*p.ambient_strength;
  const lengths = [.0713,.0891,.1139,.1373];
  const delays = lengths.map((seconds,i)=>new Float32Array(Math.round(
    seconds*(1+.65*p.openness+i*.01)*sampleRate)));
  const positions = [0,0,0,0], low = [0,0,0,0];
  const feedback = .70+.10*p.ambient_strength;
  const damping = .12+.18*p.definition;
  for(let i=0;i<left.length;i++) {
    const dryL=left[i], dryR=right[i];
    let roomL=0,roomR=0;
    for(let k=0;k<delays.length;k++) {
      const delay=delays[k],position=positions[k],value=delay[position];
      low[k] += damping*(value-low[k]);
      delay[position] = (k%2?dryR:dryL)*.40 + low[k]*feedback;
      positions[k]=(position+1)%delay.length;
      roomL+=value*(k%2?.35:.65);
      roomR+=value*(k%2?.65:.35);
    }
    left[i]=dryL+wet*roomL; right[i]=dryR+wet*roomR;
  }
}

export function renderAudio(spec = {}, {sampleRate = SAMPLE_RATE} = {}) {
  if (!Number.isInteger(sampleRate) || sampleRate<8000 || sampleRate>96000)
    throw new Error('Sample rate must be an integer from 8000 to 96000 Hz.');
  const score=compose(spec),count=Math.round(score.duration*sampleRate);
  const left=new Float32Array(count),right=new Float32Array(count);
  for(const event of score.events) synthVoice(left,right,sampleRate,event,score.spec);
  reverberate(left,right,sampleRate,score.spec);
  // Preserve relative presence between compositions; only attenuate overfull sums.
  let peak=0;
  for(let i=0;i<count;i++) peak=Math.max(peak,Math.abs(left[i]),Math.abs(right[i]));
  const headroom=peak>.72?.72/peak:1;
  for(let i=0;i<count;i++) {
    const t=i/sampleRate;
    const fade=ease(t/.08)*ease((count-1-i)/(sampleRate*1.7));
    left[i]*=headroom*fade; right[i]*=headroom*fade;
  }
  return {left,right,sampleRate,duration:score.duration,spec:score.spec,revision:AUDIO_REVISION};
}

/** Stereo PCM16 WAV, including only public controls in a standard INFO comment. */
export function encodeWav({left,right,sampleRate,spec,revision=AUDIO_REVISION}) {
  if (left.length!==right.length) throw new Error('Audio channels must have equal length.');
  const encoder=new TextEncoder();
  const metadata=encoder.encode(JSON.stringify({fieldAudio:revision,spec})+'\0');
  const padded=metadata.length+(metadata.length%2),dataSize=left.length*4;
  const buffer=new ArrayBuffer(44+dataSize+20+padded),view=new DataView(buffer);
  const text=(offset,value)=>new Uint8Array(buffer,offset,value.length).set(encoder.encode(value));
  text(0,'RIFF');view.setUint32(4,buffer.byteLength-8,true);text(8,'WAVE');
  text(12,'fmt ');view.setUint32(16,16,true);view.setUint16(20,1,true);
  view.setUint16(22,2,true);view.setUint32(24,sampleRate,true);
  view.setUint32(28,sampleRate*4,true);view.setUint16(32,4,true);view.setUint16(34,16,true);
  text(36,'data');view.setUint32(40,dataSize,true);
  for(let i=0;i<left.length;i++) {
    for(let channel=0;channel<2;channel++) {
      const value=clamp(channel?right[i]:left[i],-1,1);
      view.setInt16(44+i*4+channel*2,Math.round(value*(value<0?32768:32767)),true);
    }
  }
  const offset=44+dataSize;
  text(offset,'LIST');view.setUint32(offset+4,12+padded,true);text(offset+8,'INFO');
  text(offset+12,'ICMT');view.setUint32(offset+16,metadata.length,true);
  new Uint8Array(buffer,offset+20,metadata.length).set(metadata);
  return buffer;
}
