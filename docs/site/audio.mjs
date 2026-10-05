// Field Listening 1.2. One deterministic instrument for the browser and Node.
// No samples, network, transcript, or model inference. Input is the Field v4 spec.
import {validate} from './renderer.mjs';

export const AUDIO_REVISION = '1.2';
export const DURATION = 24;
export const SAMPLE_RATE = 44100;
const TAU = 2 * Math.PI;
const ROOT = 146.8323839587; // D3: the same center in every composition.
const clamp = (x, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, x));
const ease = x => { x = clamp(x); return x*x*(3-2*x); };

// These are authored conventions, not universal emotional meanings of intervals.
// Ratios share a tonal center, allowing colors to coexist without key changes.
// Palette is the material: each hue has its own way of beginning, ringing or
// holding, its own partials, and its own air or grain. Amplitudes are relative
// to the fundamental; `fade` darkens a partial over time; `level` balances the
// materials so that changing palette does not make a piece louder.
export const VOICES = {
  teal:   {ratios:[1, 9/8, 3/2, 2, 9/4], name:'breathing wood', room:{light:-.03, hold:-.01},
    sound:{harmonics:[1,.06,.40,.05,.19,.03,.08,0,.035], fade:.08, onset:[.05,.55], flutter:.015,
      air:{level:.42, centre:9, low:900, high:2600, q:.8, chiff:1.8, chiffTime:.07}, level:.903}},
  blue:   {ratios:[1, 4/3, 3/2, 2, 8/3], name:'clear, spare tones', room:{light:.05, hold:-.04},
    sound:{harmonics:[1,.14,0,.05], fade:.30, onset:[.02,.35],
      tine:{ratio:6, level:.05, time:.09}, level:1.007}},
  violet: {ratios:[1, 9/8, 6/5, 3/2, 9/4], name:'suspended glass', room:{light:.10, hold:.05},
    sound:{harmonics:[1], modes:[[2.756,.52,.30],[5.404,.24,.6],[8.933,.09,1.0]], onset:[.35,1.4],
      shimmer:{beat:.7, mix:.55}, level:1.213}},
  amber:  {ratios:[1, 5/4, 3/2, 5/3, 2], name:'soft felt and wood', room:{light:-.06, hold:-.02},
    sound:{harmonics:[1,.50,.26,.13,.06,.03], fade:.45, onset:[.025,.35], ring:{tau:1.6, floor:.32},
      thump:{level:.6, centre:1.6, time:.045}, level:1.195}},
  coral:  {ratios:[1, 16/15, 4/3, 3/2, 8/5], name:'bowed, close intervals', room:{light:0, hold:.01},
    sound:{harmonics:[1,.55,.42,.30,.24,.18,.13,.10,.07,.05], fade:.03, onset:[.20,1.1], grain:.06,
      vibrato:{rate:5.0, cents:7, delay:.45}, air:{level:.22, centre:6, low:800, high:3200, q:1.0}, level:.855}},
  pearl:  {ratios:[1, 5/4, 3/2, 2, 3], name:'open harmonic light', room:{light:.08, hold:.04},
    sound:{harmonics:[1,.45,.32,.26,0,.20,0,.15,0,0,0,.07], fade:.04, onset:[.12,.9],
      light:{rate:.31, depth:.35, from:6}, level:.885}}
};
// The capsule's voice belongs to no palette: a low D with restrained harmonics.
const CENTRE = {harmonics:[1,.12,.025], onset:[2.5,2.5]};

/** A musical form, not a chronology or reconstruction of a conversation. */
export function compose(spec = {}) {
  const p = validate(spec), events = [];
  const main = VOICES[p.primary];
  const air = .22 + p.openness*.68;
  // The visual's reading order, given time. A statement in the field's own
  // material comes first; a real rest; an answer that brings in the second-look
  // voices; a breath; and the return to D. In a rest nothing sounds, the centre
  // included, and the room empties. Openness lengthens the rests.
  const statement = [0, 8.6], answer = [8.6+.8+.9*p.openness, 16.4];
  const close = [16.4+.5+.6*p.openness, 21.9], spans = [statement, answer, close];
  const add = (start, duration, ratio, color, level, pan, role, extra = {}) => {
    const span = spans.find(([from,to]) => start>=from && start<to);
    if (!span) return;
    duration = Math.min(duration, span[1]-start);
    if (duration<.6) return;
    events.push({start, duration, frequency:ROOT*ratio,
      color, level, pan:clamp(pan + p.imbalance*.16,-.85,.85), role, ...extra});
  };

  // The capsule's audible counterpart stays centered and independent of palette.
  // It enters under the statement, falls silent for the answer, and returns.
  add(.9,statement[1]-.9,.5,'pearl',.095,0,'center',{anchor:true,pan:0,attack:2.2,release:2.6});
  add(close[0],close[1]-close[0],.5,'pearl',.095,0,'center',{anchor:true,pan:0,attack:1.4,release:2.8});
  if(p.ambient_strength>0) for(const [from,to] of spans) add(from+(from?.25:1.3),to-from,.75,
    p.ambient||p.primary,.022*p.ambient_strength,0,'atmosphere',{soft:true,held:true,attack:1.8});
  const order = p.form === 'sweep' ? [0,1,2,3,4,2,1] :
    p.form === 'mantle' ? [3,2,4,1,3,2,0] : [0,2,1,3,2,1,0];
  // Four entries state the field and three answer it, timed within each span.
  const onsets = p.form === 'sweep' ? [.6,2.45,4.25,6.05,.1,1.85,3.6] :
    p.form === 'mantle' ? [.5,2.8,4.9,6.5,.25,2.3,4.1] : [.45,2.35,4.35,6.2,.15,2,3.8];
  const pans = order.map((_,i)=>p.form === 'sweep' ? (i/6*2-1)*air : Math.sin(i*2.4)*air*.65);
  for (let i=0; i<order.length; i++) {
    const arc = Math.sin(i/6*Math.PI);
    const register = p.form === 'mantle' ? 2 : (i===4 && p.openness>.7 ? 2 : 1);
    // Voices release well before the next entry, so entries stay audible as
    // entries and the room is allowed to empty. Breadth lengthens, it does not
    // fill: a broad field sustains, a spare one leaves air between its voices.
    // Entries sit closer than in 1.1, so each voice is shorter in proportion.
    const duration = (p.form === 'mantle' ? 3.4 : 2.7) + 1.6*p.breadth;
    const onset = (i<4 ? 0 : answer[0]) + onsets[i] + Math.sin(i*1.9)*p.folding*.4;
    add(onset,duration,main.ratios[order[i]]*register,p.primary,
      .115*(.82+.18*arc),pans[i],'voice',{articulation:p.definition});

    // Breadth is weight and voicing, rather than an increase in master volume.
    if (i%2===0 && p.breadth>.15) add(onset+.45,duration+.5,
      main.ratios[order[i]]*.5,p.primary,.043*p.breadth,-pans[i]*.55,'body');
  }
  // A remembered contour grows from existing voices: the statement's entries
  // recur, softened, in the answer and again at the return. Never a separate timeline.
  if (p.history>0) [answer[0]+.8,answer[0]+2.7,close[0]+.4,close[0]+1.9].forEach((start,i)=>
    add(start,2.6+p.history*1.4,main.ratios[order[i]],p.primary,.049*p.history,-pans[i]*.8,'trace',{soft:true}));

  // A second color lives in the same room, sharing the root and phrase boundaries.
  // Like the picture's countercurrent it is a second look: one glimpse late in
  // the statement, then the answer, then a last voice at the return.
  if (p.secondary) {
    const secondary = VOICES[p.secondary];
    [5.3,answer[0]+.7,answer[0]+3.6,close[0]+.9].forEach((start,i)=>add(start,3.4,
      secondary.ratios[[2,1,3,0][i]],p.secondary,.042,
      Math.cos(i*2.2)*air*.55,'companion',{soft:true}));
  }
  if (p.counterpoint>0) {
    const color = p.secondary || p.accent || p.primary;
    const ratios = VOICES[color].ratios;
    [6.6,answer[0]+1.2,answer[0]+3.4,close[0]+1.4].forEach((start,i)=>add(start,2.6,
      ratios[[1,3,2,0][i]]*(i===1?2:1),color,.062*p.counterpoint,
      (i%2===0?-.7:.7)*air,'counterpoint',{articulation:p.definition}));
  }
  // Folding and complexity make a sparse filigree, mostly in the answer; there
  // is no mechanical beat.
  const detail = Math.round(p.complexity*6);
  const lace = [answer[0]+1,answer[0]+3,6.7,answer[0]+4.7,5,close[0]+2.1];
  for (let i=0; i<detail; i++) add(lace[i]+Math.sin(i*2)*p.folding*.5,1.8,
    main.ratios[[2,4,1,3,2,0][i]]*2,p.primary,.027,
    Math.sin(i*2.1)*air,'filament',{articulation:1});
  if (p.accent && p.accent_strength>0) {
    [7.1,answer[0]+3.9].forEach((start,i)=>add(start,3.0,
      VOICES[p.accent].ratios[i===0?2:1]*2,p.accent,.048*p.accent_strength,
      (i===0?-.45:.45)*air,'accent',{articulation:.85}));
  }
  if (p.gesture!=='none' && p.gesture_strength>0) {
    const sequence = p.gesture==='fold' ? [3,1,2] : p.gesture==='braid' ? [1,3,2] : [2,2,2];
    sequence.forEach((index,i)=>add(answer[0]+1.6+i*(p.gesture==='echo'?1.6:1.1),1.9,
      main.ratios[index]*(p.gesture==='braid'&&i===1?2:1),p.primary,
      .034*p.gesture_strength*(p.gesture==='echo'?1-i*.23:1),
      Math.sin(i*2+1)*air,'gesture',{articulation:.8}));
  }
  // A quiet open fifth lets the phrase settle on D without forcing a major/minor ending.
  add(close[0]+.2,4.4,1,p.primary,.066,0,'return',{soft:true});
  add(close[0]+.65,3.8,1.5,p.primary,.028,air*.3,'return',{soft:true});
  return {revision:AUDIO_REVISION,duration:DURATION,spec:p,events};
}

function synthVoice(left, right, sampleRate, event, p) {
  const sound = event.anchor ? CENTRE : VOICES[event.color].sound;
  const first = Math.floor(event.start*sampleRate);
  const length = Math.min(Math.floor(event.duration*sampleRate),left.length-first);
  if (length<=0) return;
  const definition = event.articulation ?? p.definition;
  const [crisp,soft] = sound.onset;
  const attack = event.attack ?? (event.anchor ? 2.5 : event.soft ? Math.max(.6,soft) : crisp+(soft-crisp)*(1-definition));
  const release = event.release ?? (event.anchor ? 3.6 : Math.min(event.duration*.48,1.1+1.1*p.breadth));
  const ring = !event.anchor && !event.held && sound.ring;
  const brightness = (.65+.35*p.saturation)*(1-p.stretch*.15)*(event.soft?.8:1);
  const frequency = event.frequency, dt = 1/sampleRate, limit = sampleRate*.43;
  const travel = event.anchor?0:p.flow*.2;
  const beating = event.anchor?0:p.tension*(event.role==='counterpoint'?1.9:.75);
  // Epistemic texture. The capsule is the one fixed thing, so it is never described.
  // Elsewhere, an inferred reading keeps a voice's outline and loses its body:
  // the fundamental withdraws while the rim and air that describe it remain.
  const described = event.anchor ? 0 : 1-p.grounding;
  const presence = .82+.78*p.intensity;
  const harmonics = sound.harmonics, gains = [], steps = [];
  for (let k=1; k<=harmonics.length && frequency*k<limit; k++) {
    gains.push(harmonics[k-1]*(k===1 ? 1-.74*described : brightness));
    steps.push(Math.exp(-dt*(k-1)*((sound.fade||0)+.045+.025*definition)));
  }
  const modes = (sound.modes||[]).filter(([ratio])=>frequency*ratio<limit)
    .map(([ratio,amount,fade])=>({ratio, gain:amount*brightness, step:Math.exp(-dt*fade)}));
  const rim = event.anchor ? 0 : .26*described*brightness;
  const filter = (centre,q) => ({g:2*Math.sin(Math.PI*Math.min(centre,sampleRate*.15)/sampleRate), damp:1/q, low:0, band:0});
  const air = sound.air && !event.anchor ? filter(clamp(frequency*sound.air.centre,sound.air.low,sound.air.high),sound.air.q) : null;
  const thump = sound.thump && !event.soft ? filter(frequency*sound.thump.centre,.7) : null;
  const rough = event.anchor ? null : filter(Math.min(frequency*7,3000),.9);
  const vibrato = sound.vibrato, cents = vibrato ? 2**(vibrato.cents/1200)-1 : 0;
  let noiseState=(Math.round(frequency*1000)+Math.round(event.start*10000))|0;
  let ringLevel=1, rimLevel=1, generalDecay=1, grain=0, grainTarget=0, panL=0, panR=0, carry=1;
  const level = event.level*presence*(sound.level||1);
  const generalStep = Math.exp(-dt/(2.1+3.5*p.breadth));
  const ringStep = ring ? Math.exp(-dt/ring.tau) : 1, rimStep = Math.exp(-dt*.75);
  const grainEvery = Math.round(.05*sampleRate), grainStep = 1-Math.exp(-dt/.057);
  const amp = gains.slice(), modeAmp = modes.map(m=>m.gain), light = gains.map(()=>1);
  for (let j=0; j<length; j++) {
    const t = j*dt;
    if ((j&31)===0) {
      const pan = clamp(event.pan+travel*Math.sin(t*.28),-.9,.9);
      panL = Math.cos((pan+1)*Math.PI/4); panR = Math.sin((pan+1)*Math.PI/4);
      // The capsule's tone is continuous, not motionless: it opens with the phrase
      // and withdraws at either end, leaving the room to the voices and to silence.
      if (event.anchor) carry = .30+.70*Math.sin(Math.PI*Math.min(1,t/event.duration))**.75;
      // Open harmonic light: the upper partials of pearl drift slowly in strength.
      if (sound.light) for (let k=sound.light.from-1; k<light.length; k++)
        light[k] = 1+sound.light.depth*Math.sin(TAU*sound.light.rate*t+k);
    }
    const envelope = ease(t/attack)*ease((event.duration-t)/release);
    // Slow phase drift is shallow enough to retain a stable musical pitch.
    let phase = TAU*frequency*t;
    if (!event.anchor) phase += .12*Math.sin(TAU*.21*t+event.start);
    if (vibrato && t>vibrato.delay)
      phase -= ease((t-vibrato.delay)/.6)*frequency*cents*Math.cos(TAU*vibrato.rate*t)/vibrato.rate;
    const s1 = Math.sin(phase), c2 = 2*Math.cos(phase);
    let value = 0, previous = 0, current = s1;
    for (let k=0; k<amp.length; k++) {
      value += amp[k]*light[k]*current;
      const next = c2*current-previous; previous = current; current = next;
      amp[k] *= steps[k];
    }
    if (sound.shimmer) value = (value+sound.shimmer.mix*amp[0]*Math.sin(phase+TAU*sound.shimmer.beat*t))/(1+sound.shimmer.mix);
    for (let m=0; m<modes.length; m++) { value += modeAmp[m]*Math.sin(phase*modes[m].ratio); modeAmp[m] *= modes[m].step; }
    if (sound.tine && !event.soft && t<sound.tine.time*8)
      value += sound.tine.level*brightness*Math.exp(-t/sound.tine.time)*Math.sin(phase*sound.tine.ratio);
    if (rim) { value += rim*rimLevel*Math.sin(phase*2.756); rimLevel *= rimStep; }
    // Pressure produces a restrained beating neighbor, never a volume alarm.
    if (beating) value = value*(1-p.tension*.13) + p.tension*.13*Math.sin(phase+TAU*beating*t);
    noiseState^=noiseState<<13; noiseState^=noiseState>>>17; noiseState^=noiseState<<5;
    const white = (noiseState>>>0)/2147483648-1;
    if (air) {
      air.low += air.g*air.band; air.band += air.g*(white-air.low-air.damp*air.band);
      // The chiff is a breath at the onset, added to the air rather than scaling it,
      // so an inferred reading's extra air never turns it into a burst.
      const chiff = sound.air.chiff && !event.soft ? sound.air.chiff*Math.exp(-t/sound.air.chiffTime) : 0;
      value += sound.air.level*air.band*(1+.3*described+chiff);
    }
    if (thump && t<sound.thump.time*8) {
      thump.low += thump.g*thump.band; thump.band += thump.g*(white-thump.low-thump.damp*thump.band);
      value += sound.thump.level*thump.band*Math.exp(-t/sound.thump.time);
    }
    // The air that describes an inferred voice stays quiet, as in 1.1.
    if (rough && described>0) {
      rough.low += rough.g*rough.band; rough.band += rough.g*(white-rough.low-rough.damp*rough.band);
      value += .10*described*rough.band;
    }
    // Bow pressure wanders a little, irregularly: grain, not a tremolo.
    if (sound.grain) {
      if (j%grainEvery===0) { noiseState^=noiseState<<13; noiseState^=noiseState>>>17; noiseState^=noiseState<<5; grainTarget=(noiseState>>>0)/2147483648-1; }
      grain += grainStep*(grainTarget-grain); value *= 1+sound.grain*grain;
    }
    if (sound.flutter) value *= 1+sound.flutter*Math.sin(TAU*1.3*t)*Math.sin(TAU*.37*t);
    let shape = envelope*carry*level;
    if (ring) { shape *= ring.floor+(1-ring.floor)*ringLevel; ringLevel *= ringStep; }
    else if (!event.anchor) { shape *= .48+.52*generalDecay; generalDecay *= generalStep; }
    value *= shape;
    left[first+j] += value*panL;
    right[first+j] += value*panR;
  }
}

// A small, damped room with unequal delay lengths; the tail belongs to the voices.
// The ambient hue colors the room: glass and open light ring brighter and
// longer, wood and felt keep it warm and close. The rests are where it is heard.
function reverberate(left, right, sampleRate, p) {
  const wet = .13+.18*p.openness+.13*p.ambient_strength;
  const lengths = [.0713,.0891,.1139,.1373];
  const delays = lengths.map((seconds,i)=>new Float32Array(Math.round(
    seconds*(1+.65*p.openness+i*.01)*sampleRate)));
  const positions = [0,0,0,0], low = [0,0,0,0];
  const room = VOICES[p.ambient||p.primary].room, color = .5+.5*p.ambient_strength;
  const feedback = .60+.10*p.ambient_strength+room.hold*color;
  const damping = .17+.20*p.definition+room.light*color;
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
