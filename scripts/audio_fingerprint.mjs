// A coarse listening fingerprint for the Field instrument. Node 18+, no dependencies.
// Hash inequality proves two renders are different files; it says nothing about
// whether anyone could tell them apart. This measures the difference we care about.
//
// Two parts, both from the mono mix:
// - over time, loudness and brightness (zero crossings) in half-second frames;
// - timbre, from the whole piece's long-term spectrum: its spectral centroid and
//   the share of energy in six bands. Palette lives here, and the time course
//   alone under-weights it (4.6 handback, open question 2).
// The scales put roughly five just-noticeable differences in one unit: 6 dB of
// loudness or of a band's share, a third of an octave of centroid.

const FFT_SIZE = 2048;
const WINDOW = Float64Array.from({length:FFT_SIZE},(_,i)=>.5-.5*Math.cos(2*Math.PI*i/(FFT_SIZE-1)));
export const BANDS = [[50,250],[250,500],[500,1000],[1000,2000],[2000,4000],[4000,10000]];
const SHARE_FLOOR = -40;

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
        const a = i+j, b = a+half;
        const vr = re[b]*cr-im[b]*ci, vi = re[b]*ci+im[b]*cr;
        re[b] = re[a]-vr; im[b] = im[a]-vi; re[a] += vr; im[a] += vi;
        const next = cr*wr-ci*wi; ci = cr*wi+ci*wr; cr = next;
      }
    }
  }
}

/** Frames of [rms, zero crossings per sample] and the piece's timbre. */
export function fingerprint(audio) {
  const {left, right, sampleRate} = audio, step = sampleRate/2, frames = [];
  const spectrum = new Float64Array(FFT_SIZE/2), re = new Float64Array(FFT_SIZE), im = new Float64Array(FFT_SIZE);
  for (let start=0; start+step<=left.length; start+=step) {
    let energy=0, crossings=0;
    for (let i=start; i<start+step; i++) {
      const value = left[i]+right[i];
      energy += value*value;
      if (i>start && ((value<0)!==((left[i-1]+right[i-1])<0))) crossings++;
    }
    frames.push([Math.sqrt(energy/step), crossings/step]);
  }
  for (let start=0; start+FFT_SIZE<=left.length; start+=FFT_SIZE/2) {
    for (let i=0; i<FFT_SIZE; i++) { re[i] = (left[start+i]+right[start+i])*WINDOW[i]; im[i] = 0; }
    fft(re, im);
    for (let k=0; k<FFT_SIZE/2; k++) spectrum[k] += re[k]*re[k]+im[k]*im[k];
  }
  let total=0, moment=0;
  const bands = BANDS.map(()=>0), hz = sampleRate/FFT_SIZE;
  for (let k=1; k<FFT_SIZE/2; k++) {
    const frequency = k*hz;
    if (frequency<BANDS[0][0] || frequency>=BANDS.at(-1)[1]) continue;
    total += spectrum[k]; moment += frequency*spectrum[k];
    bands[BANDS.findIndex(([low,high])=>frequency>=low&&frequency<high)] += spectrum[k];
  }
  const centroid = total>0 ? Math.log2(moment/total) : Math.log2(BANDS[0][0]);
  const shares = bands.map(energy=>Math.max(SHARE_FLOOR,10*Math.log10(Math.max(energy,1e-30)/Math.max(total,1e-30))));
  return {frames, timbre:{centroid, shares}};
}

/** The three parts of the distance, each in units of about five JNDs. */
export function distanceParts(a, b) {
  let loudness=0, brightness=0;
  for (let i=0; i<a.frames.length; i++) {
    const [la,za] = a.frames[i], [lb,zb] = b.frames[i];
    loudness += Math.abs(20*Math.log10(Math.max(la,1e-5)/Math.max(lb,1e-5)))/6;
    brightness += Math.abs(za-zb)*90;
  }
  const n = a.frames.length;
  let bands = 0;
  for (let k=0; k<BANDS.length; k++) bands += Math.abs(a.timbre.shares[k]-b.timbre.shares[k]);
  const timbre = Math.abs(a.timbre.centroid-b.timbre.centroid)*3 + bands/BANDS.length/6;
  return {loudness:loudness/n, brightness:brightness/n, timbre};
}

/** Loudness and brightness over time, plus timbre. */
export function listeningDistance(a, b) {
  const {loudness, brightness, timbre} = distanceParts(a, b);
  return +(loudness+brightness+timbre).toFixed(3);
}

/** The time-course part alone: the 4.6 fingerprint, kept for comparison. */
export function timeCourseDistance(a, b) {
  const {loudness, brightness} = distanceParts(a, b);
  return +(loudness+brightness).toFixed(3);
}

/** Features a palette can be named from: centroid and band shares. */
export const timbreFeatures = print => [print.timbre.centroid, ...print.timbre.shares];
/** The 4.6 fingerprint's own whole-piece summary, for comparison. */
export function timeCourseFeatures(print) {
  let weight=0, level=0, crossings=0;
  for (const [rms,rate] of print.frames) {
    const energy = rms*rms;
    weight += energy; level += energy*20*Math.log10(Math.max(rms,1e-5)); crossings += energy*rate;
  }
  return [level/weight, crossings/weight];
}

/**
 * Name each item's palette from its features, holding one study out at a time
 * and comparing with the other studies' mean for each hue (nearest centroid,
 * pooled within-hue spread). With `centred`, each study's own mean over its
 * palettes is removed first: that asks whether a palette leaves the same mark
 * on every piece, the way a listener comparing two palettes of one piece hears it.
 */
export function namePalettes(items, {centred=false}={}) {
  const mean = values => values.reduce((sum,value)=>sum+value,0)/values.length;
  const rows = items.map(item=>({...item, x:[...item.features]}));
  const studies = [...new Set(rows.map(row=>row.study))], hues = [...new Set(rows.map(row=>row.hue))];
  if (centred) for (const study of studies) {
    const group = rows.filter(row=>row.study===study);
    const centre = group[0].x.map((_,d)=>mean(group.map(row=>row.x[d])));
    for (const row of group) row.x = row.x.map((value,d)=>value-centre[d]);
  }
  let correct = 0;
  const confusion = Object.fromEntries(hues.map(hue=>[hue,{}]));
  for (const study of studies) {
    const train = rows.filter(row=>row.study!==study), dims = train[0].x.length;
    const means = Object.fromEntries(hues.map(hue=>{
      const group = train.filter(row=>row.hue===hue);
      return [hue, group[0].x.map((_,d)=>mean(group.map(row=>row.x[d])))];
    }));
    const spread = Array.from({length:dims},(_,d)=>Math.sqrt(
      train.reduce((sum,row)=>sum+(row.x[d]-means[row.hue][d])**2,0)/(train.length-hues.length))||1);
    for (const row of rows.filter(row=>row.study===study)) {
      let best, closest = Infinity;
      for (const hue of hues) {
        const distance = means[hue].reduce((sum,value,d)=>sum+((row.x[d]-value)/spread[d])**2,0);
        if (distance<closest) { closest = distance; best = hue; }
      }
      if (best===row.hue) correct++;
      confusion[row.hue][best] = (confusion[row.hue][best]||0)+1;
    }
  }
  return {correct, total:rows.length, accuracy:correct/rows.length, chance:1/hues.length, confusion};
}
