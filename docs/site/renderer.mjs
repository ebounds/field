// Browser implementation of scripts/render_field.py, rendering revision 4.6.
// Keep geometry and material in step with the Python reference renderer. This
// draws 4.6 only; the Python renderer can also set each treatment back to 4.5.
export const REVISION = '4.6';
export const PALETTE = {
  teal: '#42BDB0', blue: '#648DE5', violet: '#9B7BE8',
  amber: '#E8B86A', coral: '#D97979', pearl: '#DDE5EA'
};
export const DEFAULTS = {
  version: 4, primary: 'teal', secondary: 'blue', accent: null,
  openness: .5, tension: .15, definition: .65, complexity: .35,
  intensity: .5, imbalance: 0, gesture: 'none', gesture_strength: 0,
  breadth: .4, folding: .2, stretch: 0, flow: 0, saturation: .85,
  ambient: null, ambient_strength: .25, accent_strength: .4,
  form: 'envelope', history: 0, counterpoint: 0, grounding: 1
};
const {sin, cos, exp, atan2, hypot, min, max, abs, PI} = Math;
const fixed = (n, digits = 3) => n.toFixed(digits);
const roundEven = n => n % 1 === .5 ? 2 * Math.round(n / 2) : Math.round(n);
const xml = s => String(s).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
const seq = (n, f) => Array.from({length: n}, (_, i) => f(i));
const reverse = a => [...a].reverse();
const closed = (a, b) => pointsPath(a) + ' ' + pointsPath(b).replace('M', 'L') + ' Z';

// Revision 4.6 turns a field away from rest only as far as history allows. These
// are the controls an earlier revision needs to draw the same posture, so that a
// check comparing revisions compares their colour and marks, not their angle.
export const posture = (spec = {}) => ({...spec, flow: (spec.flow ?? 0)*(spec.history ?? 0)});

export function validate(spec = {}) {
  if (!spec || typeof spec !== 'object' || Array.isArray(spec)) throw new Error('Use an object of Field drawing controls.');
  for (const key of Object.keys(spec)) if (!Object.hasOwn(DEFAULTS, key)) throw new Error('Unknown control: ' + key);
  const p = {...DEFAULTS, ...spec};
  if (p.version !== 4) throw new Error('Use Field drawing specification version 4.');
  for (const key of ['primary', 'secondary', 'accent', 'ambient']) {
    if (key !== 'primary' && p[key] === null) continue;
    if (typeof p[key] !== 'string' || !Object.hasOwn(PALETTE, p[key])) throw new Error('Choose a Field palette color for ' + key + '.');
  }
  for (const key of Object.keys(DEFAULTS).filter(k => typeof DEFAULTS[k] === 'number' && k !== 'version')) {
    const low = ['imbalance', 'stretch', 'flow'].includes(key) ? -1 : key === 'saturation' ? .25 : 0;
    const high = key === 'saturation' ? 1.35 : 1;
    if (typeof p[key] !== 'number' || !Number.isFinite(p[key]) || p[key] < low || p[key] > high) throw new Error('Invalid value for ' + key + '.');
  }
  if (!['none', 'fold', 'echo', 'braid'].includes(p.gesture)) throw new Error('Choose a Field gesture.');
  if (!['envelope', 'sweep', 'mantle'].includes(p.form)) throw new Error('Choose envelope, sweep, or mantle.');
  return p;
}

export function toOklab(color) {
  const [r, g, b] = [1, 3, 5].map(i => {
    const v = parseInt(color.slice(i, i + 2), 16) / 255;
    return v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4;
  });
  const l = (.4122214708*r + .5363325363*g + .0514459929*b) ** (1/3);
  const m = (.2119034982*r + .6806995451*g + .1073969566*b) ** (1/3);
  const s = (.0883024619*r + .2817188376*g + .6299787005*b) ** (1/3);
  return [.2104542553*l + .7936177850*m - .0040720468*s,
    1.9779984951*l - 2.4285922050*m + .4505937099*s,
    .0259040371*l + .7827717662*m - .8086757660*s];
}

function fromOklab([lightness, a, b]) {
  const l = (lightness + .3963377774*a + .2158037573*b) ** 3;
  const m = (lightness - .1055613458*a - .0638541728*b) ** 3;
  const s = (lightness - .0894841775*a - 1.2914855480*b) ** 3;
  return [4.0767416621*l - 3.3077115913*m + .2309699292*s,
    -1.2684380046*l + 2.6097574011*m - .3413193965*s,
    -.0041960863*l - .7034186147*m + 1.7076147010*s]
    .map(v => v <= .0031308 ? 12.92*v : 1.055*v ** (1/2.4) - .055);
}

export function oklabHex(lab) {
  const [lightness, a, b] = lab;
  let channels = fromOklab(lab);
  if (min(...channels) < 0 || max(...channels) > 1) {
    let low = 0, high = 1;
    for (let i = 0; i < 14; i++) {
      const middle = (low + high) / 2;
      const trial = fromOklab([lightness, a*middle, b*middle]);
      if (min(...trial) >= 0 && max(...trial) <= 1) low = middle;
      else high = middle;
    }
    channels = fromOklab([lightness, a*low, b*low]);
  }
  return '#' + channels.map(v => roundEven(max(0, min(1, v))*255).toString(16).padStart(2, '0')).join('').toUpperCase();
}

export function pointsPath(points, digits = 2) {
  const xy = p => p.map(v => fixed(v, digits)).join(',');
  let result = 'M' + xy(points[0]);
  for (let i = 0; i < points.length - 1; i++) {
    const before = points[max(0, i-1)], here = points[i];
    const after = points[i+1], beyond = points[min(points.length-1, i+2)];
    const c1 = [0, 1].map(k => here[k] + (after[k]-before[k])/6);
    const c2 = [0, 1].map(k => after[k] - (beyond[k]-here[k])/6);
    result += ' C' + xy(c1) + ' ' + xy(c2) + ' ' + xy(after);
  }
  return result;
}

export function geometry(spec = {}) {
  const p = validate(spec);
  const {openness:o, tension:t, definition:d, intensity:power, imbalance:skew, breadth, folding:fold, stretch, form} = p;
  const a = (218+157*o)*(1+.32*max(0,stretch)-.28*max(0,-stretch));
  const b = (153+131*o)*(1+.50*max(0,-stretch)-.25*max(0,stretch));
  const gap = (6+112*o)*PI/180, start = -.42+gap/2, end = 2*PI-.42-gap/2;
  // The field turns away from its resting angle only as far as an earlier
  // change still holds it, so the turn itself says what is retained.
  const turn = (-18+38*p.flow*p.history)*PI/180;
  const bezier = (u, p0, p1, p2, p3) => [0,1].map(k => (1-u)**3*p0[k] + 3*(1-u)**2*u*p1[k] + 3*(1-u)*u*u*p2[k] + u**3*p3[k]);
  const rotate = (x, y) => [x*cos(turn)-y*sin(turn), x*sin(turn)+y*cos(turn)];
  function rawPoint(u, inset = 0) {
    if (form !== 'envelope') {
      let x, y;
      if (form === 'sweep') [x,y] = u <= .5 ? bezier(2*u,[-340,170],[-250,250],[-130,90],[-20,110]) : bezier(2*u-1,[-20,110],[110,125],[190,-150],[345,-175]);
      else [x,y] = u <= .5 ? bezier(2*u,[-285,180],[-360,-40],[-180,-270],[0,-250]) : bezier(2*u-1,[0,-250],[180,-255],[360,-50],[285,180]);
      const envelope = sin(PI*u);
      x = x*a/295 + 34*skew*envelope + 15*fold*sin(5*PI*u-.7)*envelope;
      // Pressure flattens the seat a little; it never dents it.
      y = y*b/215 + 18*t*exp(-1*((u-.48)/.28)**2) + 22*fold*sin(3*PI*u+.25)*envelope;
      return rotate(x,y);
    }
    const theta = start+(end-start)*u, phase = atan2(sin(theta-2.65), cos(theta-2.65));
    let r = 1-.18*t*exp(-1*(phase/.75)**2) + .065*skew*cos(theta);
    r += fold*(.18*sin(3*theta+.5)+.07*cos(5*theta-.7));
    return rotate((a-inset)*cos(theta)*r + 52*skew*sin(theta)**2, (b-inset*.68)*sin(theta)*r);
  }
  // A point moved `inset` into the material from the outer edge, before
  // fitting; a negative inset lies beyond the outer edge.
  function offsetRaw(u, inset = 0) {
    if (form === 'envelope') return rawPoint(u, inset);
    const [x,y] = rawPoint(u);
    const before = rawPoint(max(0,u-.001)), after = rawPoint(min(1,u+.001));
    const dx = after[0]-before[0], dy = after[1]-before[1], length = max(1e-6,hypot(dx,dy));
    const [nx,ny] = form === 'sweep' ? [dy/length,-dx/length] : [-dy/length,dx/length];
    return [x+inset*nx, y+inset*ny];
  }
  // Matter keeps its density whatever the intensity, so width doesn't follow it.
  function thickness(u) {
    const theta = start+(end-start)*u, taper = max(0,sin(PI*u))**.42;
    let width = (16+91*breadth+17*.5+15*(1-d))*taper*(.78+.22*sin(theta+fold));
    const phase = atan2(sin(theta-2.65), cos(theta-2.65));
    width *= (1-.05*t*exp(-1*(phase/.45)**2))*(1+.17*fold*sin(3*theta+.8));
    return min(width,min(a,b)*.48);
  }
  // How far the earlier sheet stands beyond the present outer edge: far enough to
  // show as a second outline, still under the band's own width, so the two
  // overlap and never fork open, and nothing at either tip, where they rejoin.
  const sheetLift = u => p.history*.7*thickness(u)*sin(PI*u)**.7*(.62+.38*u)*(.9+.1*cos(3*PI*u+.4));
  // Keep every expressive posture in the same frame with substantial margins,
  // counting an earlier sheet that stands beyond the outer edge.
  const extent = max(...seq(201, i => p.history ? offsetRaw(i/200, -sheetLift(i/200)) : rawPoint(i/200)).flat().map(abs));
  const fit = min(1, 395/max(1,extent));
  function point(u, inset = 0) {
    const [x,y] = offsetRaw(u, inset);
    return [500+fit*x,500+fit*y];
  }
  const us = seq(97, i => i/96);
  const surface = (u,f) => point(u,thickness(u)*(f+.075*fold*sin(3*PI*u+f*2)*sin(PI*f)));
  const ribbon = (outside,inside) => closed(us.map(u=>surface(u,outside)),reverse(us).map(u=>surface(u,inside)));
  function strip(u0,u1,centre,spread,bend=0) {
    const section = seq(65,i=>u0+(u1-u0)*i/64);
    const margins = u => {
      const taper = max(0,sin(PI*(u-u0)/(u1-u0)))**1.4;
      const middle = centre+bend*fold*sin(4*PI*u+.4), half = spread*taper*(.86+.14*cos(6*PI*u));
      return [middle-half,middle+half];
    };
    return closed(section.map(u=>surface(u,margins(u)[0])),reverse(section).map(u=>surface(u,margins(u)[1])));
  }
  // The earlier sheet: the same surface, lifted beyond the present one.
  const sheetPoint = (u,f) => point(u,thickness(u)*f-sheetLift(u));
  return {a,b,fit,point,surface,us,ribbon,strip,thickness,sheetPoint};
}

export function render(spec = {}) {
  const p = validate(spec);
  const pigment = name => { const [l, a, b] = toOklab(PALETTE[name]); return oklabHex([l, a*p.saturation, b*p.saturation]); };
  const mix = (a, b, amount) => { const second = toOklab(b); return oklabHex(toOklab(a).map((x, i) => x*(1-amount) + second[i]*amount)); };
  const light = (color, amount) => { const [l, a, b] = toOklab(color); return oklabHex([min(.91, l*amount), a, b]); };
  // Lit but withdrawn material, for surfaces that are remembered or inferred.
  const pale = (color, amount, chroma) => { const [l, a, b] = toOklab(color); return oklabHex([min(.91, l*amount), a*chroma, b*chroma]); };
  // Light that carries colour. A hue can only be lightened so far before sRGB
  // has no room left for its chroma, and past that point it turns to white.
  // So a mark is lit only as far as its hue can hold; pearl, which has almost
  // no chroma to lose, is the one colour that still reaches near-white.
  const tint = (color, amount, rich = 1) => {
    const [l, a0, b0] = toOklab(color), a = a0*rich, b = b0*rich;
    const holds = lightness => { const channels = fromOklab([lightness, a*.85, b*.85]); return min(...channels) >= 0 && max(...channels) <= 1; };
    let low = l, high = min(.91, l*amount);
    if (high > low && !holds(high)) {
      for (let i = 0; i < 12; i++) { const middle = (low+high)/2; if (holds(middle)) low = middle; else high = middle; }
      high = low;
    }
    return oklabHex([high, a, b]);
  };
  // The same material in shadow: deeper, and no greyer.
  const shade = (color, amount, chroma = 1) => { const [l, a, b] = toOklab(color); return oklabHex([l*amount, a*chroma, b*chroma]); };
  const c1 = pigment(p.primary), c2 = pigment(p.secondary || p.primary), ca = pigment(p.accent || p.primary);
  const ambient = pigment(p.ambient || p.primary), climate = p.ambient_strength;
  const bgCentre = mix('#101A25', ambient, .03+.38*climate), bgEdge = mix('#080D16', ambient, .02+.12*climate);
  const {openness:o, tension:t, definition:d, complexity:c, intensity:power, imbalance:skew, breadth, folding:fold, stretch, form} = p;
  // Salience is emitted light. Matter keeps its density whatever the intensity,
  // so a quiet field is dim but present, never thinned. A loud field gives its
  // light off, as its bloom, its shoulder of light and the room around it, in its
  // own colour; its skin is not lightened, which would only bleach the hue.
  const strength = .26+.65*.55, glow = .5+power, halo = .75+.5*power;
  const {a,b,fit,point,surface,us,ribbon,strip,thickness,sheetPoint} = geometry(p);
  const outline = ribbon(0,1), accentMix = p.accent ? mix(c1,ca,p.accent_strength*.85) : c1;
  // Epistemic texture: how much of this reading rests on material actually
  // present. What is not grounded is described rather than filled.
  const weave = 1-p.grounding;
  const aperture = (6+112*o)*PI/180, first = -.42+aperture/2, last = 2*PI-.42-aperture/2;
  // The visible seat of compression, following the geometry that tension bends.
  const strainU = form === 'envelope' ? min(.86,max(.14,(2.65-first)/(last-first))) : .48;
  const counterHue = p.accent ? ca : c2;
  // Reading order. Hue, light, posture and softness are read first. The marks
  // that are read second (relief, ridge, second current, seat of strain,
  // reticulation, gesture) are drawn in the field's own hues, and one blur,
  // set by definition, decides how sharply any of them is articulated.
  const fine = .3+9*(1-d)**2;
  const articulate = (x => x*x*(3-2*x))(max(0,min(1,(d-.4)/.45)));
  // Revision 4.6's marks are properties of the same surface, drawn through
  // surface fractions, so the outline stays one continuous curve.
  const bump = (u,u0,u1,power=1) => u0 < u && u < u1 ? sin(PI*(u-u0)/(u1-u0))**power : 0;
  // A region of the surface between two fractions that may vary along it.
  const band = (fa,fb,u0=0,u1=1,steps=64,at=surface) => {
    const section = seq(steps+1,i=>u0+(u1-u0)*i/steps);
    return pointsPath(section.map(u=>at(u,fa(u))),1)+' '+pointsPath(reverse(section).map(u=>at(u,fb(u))),1).replace('M','L')+' Z';
  };
  // A thread of material that thickens and thins along a course.
  const lensAlong = (course,u0,u1,half,steps=72,at=surface) => band(u=>course(u)-half(u),u=>course(u)+half(u),u0,u1,steps,at);
  // A closed curve with no seam: the interpolation wraps around.
  const loopPath = points => {
    const k = points.length, xy = p => p.map(v => fixed(v, 2)).join(',');
    let result = 'M'+xy(points[0]);
    for (let i = 0; i < k; i++) {
      const before = points[(i-1+k)%k], here = points[i], after = points[(i+1)%k], beyond = points[(i+2)%k];
      result += ' C'+xy([0,1].map(q=>here[q]+(after[q]-before[q])/6))+' '+xy([0,1].map(q=>after[q]-(beyond[q]-here[q])/6))+' '+xy(after);
    }
    return result+' Z';
  };
  // Nothing at either tip, so the fibres part around the core and rejoin.
  const coreHalf = u => p.counterpoint ? .2*p.counterpoint**.8*bump(u,.08,.92,1.15) : 0;
  const coreCentre = u => .5+.05*sin(2*PI*(.7*u+.2));
  // Where a strand at fraction fi runs once it has parted round the core.
  const threadCourse = (fi,u) => {
    const centre = coreCentre(u), half = coreHalf(u);
    if (!half) return fi;
    return fi < centre ? fi*(centre-half)/centre : 1-(1-fi)*(1-centre-half)/(1-centre);
  };
  // A meandering course at an uneven rhythm along the inner slope, clear of the
  // core, which shares its hue when there is an accent, and of the shoulder of
  // light on the outer slope.
  const veinCourse = u => .74+.06*sin(2*PI*(1.08*u+.12))+.03*sin(2*PI*(2.9*u+.4))+.015*sin(2*PI*(6.3*u+.2));
  // The same lightness at a neighbouring hue: the play of colour in a pearlescent surface.
  const turnHue = (color,degrees,chroma=1) => {
    const [l,a0,b0] = toOklab(color), q = degrees*PI/180;
    return oklabHex([l,(a0*cos(q)-b0*sin(q))*chroma,(a0*sin(q)+b0*cos(q))*chroma]);
  };
  const svg = [];
  const add = value => svg.push(value);
  const path = (shape, attrs) => '<path d="' + shape + '" ' + attrs + '/>';
  const stops = (colors, offsets, opacity = []) => colors.map((color,i)=>'<stop' + (i ? ' offset="'+offsets[i]+'"' : '')+' stop-color="'+color+'"' + (opacity[i] === undefined ? '' : ' stop-opacity="'+opacity[i]+'"')+'/>').join('');
  const linear = (id, coords, colors, offsets, opacity) => '<linearGradient id="'+id+'" '+coords+'>'+stops(colors,offsets,opacity)+'</linearGradient>';
  const pageGradient = 'gradientUnits="userSpaceOnUse" x1="180" y1="720" x2="820" y2="270"';
  const metadata = Object.fromEntries(Object.keys(p).sort().map(k=>[k,p[k]]));
  add('<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="1000" viewBox="0 0 1000 1000" role="img" aria-label="A central titanium capsule with a unified abstract field" data-field-version="4" data-field-renderer="'+REVISION+'">');
  add('<metadata id="field-spec">'+xml(JSON.stringify(metadata))+'</metadata><defs>');
  // In page units, so that an opening in the field can show the same ground.
  add('<radialGradient id="background" gradientUnits="userSpaceOnUse" cx="500" cy="500" r="500">'+stops([bgCentre,bgEdge],[0,1])+'</radialGradient>');
  add(linear('field-ink','x1="18%" y1="72%" x2="82%" y2="27%"',[c1,c2,accentMix,c1],[0,.38,.69,1]));
  add('<radialGradient id="field-atmosphere">'+stops([c1,c2,c1],[0,.6,1],[fixed((.07+.18*breadth)*halo),fixed((.02+.08*breadth)*halo),0])+'</radialGradient>');
  add(linear('field-edge-ink',pageGradient,[c1,c2,c1,c1],[0,.32,.58,1],[.1,.75,.15,.6]));
  add(linear('field-crest','gradientUnits="userSpaceOnUse" x1="170" y1="690" x2="790" y2="280"',[tint(c1,1.28*glow),tint(c2,1.45*glow),tint(c1,1.3*glow),tint(c1,1.4*glow)],[0,.36,.68,1],[.25,.9,.35,.65]));
  add(linear('field-depth','gradientUnits="userSpaceOnUse" x1="230" y1="730" x2="760" y2="300"',Array(4).fill('#0B1520'),[0,.35,.7,1],[0,.48,.1,.3]));
  add(linear('field-tint',pageGradient,[c1,c2,accentMix,c1].map(color=>tint(color,1.08*glow,1.5)),[0,.38,.69,1]));
  add(linear('field-shade',pageGradient,[c1,c2,accentMix,c1].map(color=>shade(color,.68,1.15)),[0,.38,.69,1]));
  add(linear('field-rib',pageGradient,[c1,c2,accentMix,c1].map(color=>tint(color,1.3,1.15)),[0,.38,.69,1]));
  add(linear('field-counter-ink',pageGradient,[shade(counterHue,.6,1.2),shade(counterHue,.8,1.2),shade(counterHue,.64,1.2)],[0,.42,1]));
  add(linear('drone-metal','x1="0" y1="0" x2="0" y2="1"',['#34414D','#202B35','#101922'],[0,.5,1]));
  add(linear('drone-rim','x1="0" y1="0" x2="1" y2="1"',['#DDE5EA','#8C9BA9','#DDE5EA'],[0,.6,1],[.68,.21,.30]));
  for (const [id,blur] of [['field-soft',1.5+18*(1-d)],['field-diffuse',1.2+5*(1-d)**2]]) add('<filter id="'+id+'" x="-25%" y="-25%" width="150%" height="150%" color-interpolation-filters="sRGB"><feGaussianBlur stdDeviation="'+fixed(blur,2)+'"/></filter>');
  // Marks are thin, so their blur is measured against the page, not their own bounds.
  add('<filter id="field-fine" filterUnits="userSpaceOnUse" x="0" y="0" width="1000" height="1000" color-interpolation-filters="sRGB"><feGaussianBlur stdDeviation="'+fixed(fine,2)+'"/></filter>');
  // What is retained keeps its shape only as far as the field is articulated; otherwise it is an afterglow.
  add('<filter id="field-recede" x="-25%" y="-25%" width="150%" height="150%" color-interpolation-filters="sRGB"><feGaussianBlur stdDeviation="'+fixed(1.2+5*(1-d)**2+(.3+18*(1-d)-5*(1-d)**2)*(1-articulate),2)+'"/></filter>');
  const lanes = 28;
  for (let j=0;j<lanes;j++) {
    const f=(j+.5)/lanes;
    const illumination=.46+.66*exp(-1*((f-.27)/.3)**2)+.16*exp(-1*((f-.91)/.13)**2);
    add(linear('field-skin-'+j,pageGradient,[c1,c2,accentMix,c1].map(color=>tint(color,illumination*min(1,glow))),[0,.38,.69,1]));
  }
  // Each hue family's surface is a texture of the body's own colours, so a
  // surface never lays one hue over another: over its neighbour that would grey.
  const weights={};
  for(const [name,w] of [[p.primary,.62],[p.secondary||p.primary,.38]]) weights[name]=(weights[name]||0)+w;
  const sheetLanes = 9;
  // The earlier sheet is the same material, older: deeper than the present skin
  // and nearly as coloured. Drawn paler, it read as grounding's withdrawn matter
  // instead of as history (axes study, words-only pairs).
  if (p.history) for (let j=0;j<sheetLanes;j++) {
    const f=(j+.5)/sheetLanes, illumination=.52+.58*exp(-1*((f-.27)/.3)**2);
    add(linear('field-sheet-'+j,pageGradient,[c1,c2,c1,c1].map(color=>tint(color,illumination*.8*glow,.92)),[0,.38,.69,1]));
  }
  if (weights.blue) add(linear('field-crisp',pageGradient,[c1,c2,accentMix,c1].map(color=>tint(color,1.8*glow)),[0,.38,.69,1]));
  if (weights.violet) for (const [id,degrees,chroma,amount] of [['field-pearl-a',14,1,1.32],['field-pearl-b',-16,1.15,1.08],['field-pearl-c',30,.9,1.4]])
    add(linear(id,pageGradient,[c1,c2,accentMix,c1].map(color=>tint(turnHue(color,degrees,chroma),amount*glow)),[0,.38,.69,1]));
  add('</defs><rect id="field-background" width="1000" height="1000" fill="url(#background)"/><g id="field-envelope">');
  add('<ellipse cx="500" cy="500" rx="'+fixed(min(435,a*fit+45),2)+'" ry="'+fixed(min(420,b*fit+65),2)+'" fill="url(#field-atmosphere)" transform="rotate('+fixed(-18+38*p.flow*p.history,2)+' 500 500)"/>');
  if (p.history) {
    // Behind the present surface and sharing its tips: the field as it was held
    // before a change that still matters. It overlaps the present sheet
    // throughout, so no gap opens between them, and like any retained mark it
    // keeps its shape only as far as the field is articulated.
    add('<g id="field-history" opacity="'+fixed(strength*(.55+.4*p.history**.6)*(.86+.14*d))+'"><g filter="url(#field-recede)">');
    for (let j=0;j<sheetLanes;j++) add(path(band(()=>j/sheetLanes,()=>min(1,(j+1.6)/sheetLanes),0,1,56,sheetPoint),'fill="url(#field-sheet-'+j+')" opacity=".62"'));
    add('</g>');
    // Its lit outer edge, the earlier contour, thins into both tips, where the two
    // sheets meet. It is the second colour, lit only as far as it holds its
    // chroma: over the dark ground a paler line turns near-white.
    add(path(band(()=>0,u=>.03*sin(PI*u)**.6,.02,.98,72,sheetPoint),'fill="'+tint(c2,1.15*glow,1.2)+'" opacity="'+fixed(.35+.55*articulate)+'" filter="url(#field-fine)"')
      +path(band(()=>.2,u=>.2+.07*sin(PI*u)**.5,.06,.94,72,sheetPoint),'fill="'+tint(pale(c1,.95,.92),1.2*glow)+'" opacity=".45" filter="url(#field-diffuse)"')+'</g>');
  }
  add(path(outline,'fill="url(#field-ink)" opacity="'+fixed(strength*.28*(1-.4*weave)*glow)+'" filter="url(#field-soft)"'));
  add(path(outline,'fill="url(#field-ink)" opacity="'+fixed(strength*(.18+.23*d)*(1-.78*weave))+'" filter="url(#field-diffuse)"'));
  add(path(strip(.11,.9,.79,.15),'fill="url(#field-depth)" opacity="'+fixed(strength*(.08+.16*d))+'" filter="url(#field-diffuse)"'));
  add('<g id="field-surface" opacity="'+fixed(strength*(.35+.1*d))+'" filter="url(#field-diffuse)">');
  for(let j=0;j<lanes;j++) {
    const f=(j+.5)/lanes;
    // Where the reading is inferred, the skin thins; the ribs below carry it.
    const presence=f>=weave?1:.08+.92*(f/max(1e-6,weave))**.7;
    add(path(ribbon(j/lanes,min(1,(j+1.65)/lanes)),'fill="url(#field-skin-'+j+')" opacity="'+fixed(presence)+'"'));
  }
  add('</g>');
  // Threads are the grain of the material. Light, the second current and strain lie over them.
  add('<g id="field-filaments" fill="none" stroke-linecap="round" opacity="'+fixed(strength*(.42+.58*d))+'" filter="url(#field-fine)">');
  // The band resolves into strands, each catching its own light, like a silk
  // cable: one smooth sheet when simple, a bundle when rich. Widths and emphasis
  // vary, every strand tapers into the tips, and a strand thins with the
  // material where the reading was not met.
  const met=f=>f>=weave?1:.3+.7*(f/max(1e-6,weave))**.7, relief=.72+1.15*breadth;
  const widths=seq(1+roundEven(17*c),i=>1+.45*sin(2.4*i+1.1)+.25*sin(5.3*i+.3)), total=widths.reduce((x,y)=>x+y,0);
  const edges=[0];
  for(const w of widths) edges.push(edges[edges.length-1]+w/total);
  add('<g id="field-fibre-grooves">');
  for(let i=1;i<edges.length-1;i++) {
    const lo=.02+.05*((i*7)%5)/5, hi=.98-.05*((i*3)%4)/4;
    add(path(lensAlong(u=>threadCourse(edges[i],u),lo,hi,u=>.017*relief*bump(u,lo,hi,1.4),44),'fill="url(#field-shade)" opacity="'+fixed((.5+.3*d)*met(edges[i]))+'"'));
  }
  add('</g><g id="field-fibre-crests">');
  for(let i=0;i<(edges.length>2?edges.length-1:0);i++) {
    const lo=.03+.05*((i*5)%4)/4, hi=.97-.05*((i*7)%5)/5, width=edges[i+1]-edges[i], emphasis=.5+.5*sin(1.7*i+.4)**2;
    add(path(lensAlong(u=>threadCourse(edges[i]+.38*width,u),lo,hi,u=>.26*width*bump(u,lo,hi,1.4),44),'fill="url(#field-tint)" opacity="'+fixed((.4+.5*emphasis)*(.6+.4*d)*met(edges[i]+.38*width))+'"'));
  }
  add('</g></g>');
  if(weave) {
    // Inference is drawn, not filled: the section ribs that define the form
    // stay visible where its material does not. They soften with definition
    // like every mark, and are drawn broader as they do, so that an unresolved
    // form which was also not met still shows that it is described.
    const ribs=6+roundEven(11*weave);
    add('<g id="field-reticulation" fill="none" stroke-linecap="round" opacity="'+fixed(strength*(.62+.38*d))+'" filter="url(#field-fine)">');
    for(let j=0;j<ribs;j++) {
      const u=.06+.88*(j+.5)/ribs, span=weave*(.52+.48*sin(PI*u));
      add(path(pointsPath(seq(13,k=>surface(u,span*k/12))),'stroke="url(#field-rib)" stroke-width="'+fixed(.9+1.3*weave+.55*fine,2)+'" opacity="'+fixed(.4+.5*sin(PI*u))+'"'));
    }
    // A held outer edge keeps the described form exact where it is not filled.
    add(path(pointsPath(us.map(u=>surface(u,.02))),'stroke="url(#field-rib)" stroke-width="'+fixed(.7+1.1*weave+.4*fine,2)+'" opacity="'+fixed(.3+.4*weave)+'"'));
    add('</g>');
  }
  // Light falls only where there is material to catch it, so it moves inward.
  add(path(strip(.07,.94,.31+.5*weave,(.13+.035*breadth)*(1-.45*weave),.12),'id="field-shoulder-light" fill="url(#field-crest)" opacity="'+fixed(strength*(.45+.4*d)*(.6+.4*glow))+'" filter="url(#field-diffuse)"'));
  // Each hue family has a surface of its own as well as its colour, as Listening
  // gives each a timbre: blue crisp and clear, violet pearlescent, amber soft,
  // coral satin, pearl luminous, teal plain.
  add('<g id="field-hue-surface" filter="url(#field-fine)">');
  if(weights.blue) {
    const w=weights.blue;
    add(path(pointsPath(us.filter(u=>u>=.09&&u<=.88).map(u=>surface(u,.2))),'fill="none" stroke="url(#field-crisp)" stroke-width="'+fixed(.9+.7*d,2)+'" opacity="'+fixed(.75*w*(.5+.5*d))+'"')
      +path(pointsPath(us.filter(u=>u>=.3&&u<=.8).map(u=>surface(u,.9))),'fill="none" stroke="url(#field-crisp)" stroke-width=".8" opacity="'+fixed(.4*w*(.5+.5*d))+'"'));
  }
  if(weights.violet) {
    const w=weights.violet;
    add(path(strip(.06,.92,.15,.12,.1),'fill="url(#field-pearl-a)" opacity="'+fixed(.62*w)+'" filter="url(#field-soft)"')
      +path(strip(.14,.86,.78,.11,.1),'fill="url(#field-pearl-b)" opacity="'+fixed(.5*w)+'" filter="url(#field-soft)"')
      +path(strip(.2,.8,.46,.05,.12),'fill="url(#field-pearl-c)" opacity="'+fixed(.35*w)+'" filter="url(#field-diffuse)"'));
  }
  if(weights.amber) add(path(strip(.05,.95,.5,.42),'fill="url(#field-tint)" opacity="'+fixed(.32*weights.amber)+'" filter="url(#field-soft)"'));
  if(weights.coral) add(path(strip(.1,.9,.32,.1,.1),'fill="url(#field-tint)" opacity="'+fixed(.4*weights.coral)+'" filter="url(#field-diffuse)"'));
  if(weights.pearl) add(path(strip(.08,.92,.42,.26),'fill="#EEF3F6" opacity="'+fixed(.22*weights.pearl)+'" filter="url(#field-soft)"'));
  add('</g>');
  if(p.counterpoint) {
    // A second current inside the material, in its own hue, parting as 4.5's
    // does: along its outer side the fibres stand back and leave a narrow opening
    // the ground shows through; beside the opening it is deep in colour, and it
    // is lit toward the seam on the other side, where it rejoins. Drawn as a band
    // of colour alone, it reads as palette.
    const across=k=>u=>coreCentre(u)+k*coreHalf(u);
    add('<g id="field-countercurrent" opacity="'+fixed(strength*(.8+.2*d))+'">'
      +path(band(across(-.8),across(.8),.08,.92,90),'fill="'+tint(counterHue,1.08*glow,1.2)+'" opacity=".88" filter="url(#field-diffuse)"')
      +'<g filter="url(#field-fine)">'+path(band(across(-1.5),across(-.85),.08,.92,90),'fill="url(#background)" opacity=".85"')
      +path(band(across(-.85),across(-.4),.08,.92,90),'fill="url(#field-counter-ink)" opacity=".85"')
      +path(band(across(.72),across(.9),.08,.92,90),'fill="'+tint(counterHue,1.6*glow,.7)+'" opacity=".92"')+'</g></g>');
  }
  add(path(strip(.21,.75,.2+.58*weave,.045+.03*breadth,.08),'id="field-grazing-light" fill="url(#field-crest)" opacity="'+fixed(strength*(.35+.35*d))+'"'));
  if(t) {
    // Stress made visible as photoelastic fringes: nested contours of the
    // field's own colour that crowd toward the seat of pressure. The outline
    // only flattens a little there; it is never dented or cut.
    const seat=.45, reach=min(.24,strainU-.03,.97-strainU), rings=2+roundEven(4*t);
    const spread=k=>((k+1)/rings)**1.55;
    const ring=(k,grow)=>{
      const s=spread(k), du=reach*(.16+.84*s), df=min(.42,.045+.37*s), centre=seat-.05*s;
      return loopPath(seq(84,i=>2*PI*i/84).map(q=>surface(strainU+du*grow*cos(q)*(1-.1*sin(q)),centre+df*grow*sin(q)*(1+.16*cos(q)))));
    };
    add('<g id="field-strain" fill="none" opacity="'+fixed(strength*(.72+.28*d))+'">'
      +path(strip(max(.02,strainU-.17),min(.98,strainU+.17),.46,.05+.1*t,.1),'fill="url(#field-depth)" opacity="'+fixed(.55*t)+'" filter="url(#field-diffuse)"')
      +path(strip(max(.02,strainU-.07),min(.98,strainU+.07),seat-.02,.025+.045*t),'fill="'+tint(c1,1.9*glow)+'" opacity="'+fixed(.85*t**1.1)+'" filter="url(#field-diffuse)"')
      +'<g id="field-strain-shade" filter="url(#field-diffuse)">');
    for(let k=0;k<rings;k++) add(path(ring(k,1.09),'stroke="url(#field-shade)" stroke-width="'+fixed((2.6+2.6*(1-spread(k)))*(.6+.4*t),2)+'" opacity="'+fixed(.3*t**1.1)+'"'));
    add('</g><g id="field-strain-fringes" filter="url(#field-fine)">'
      +path(strip(max(.02,strainU-.035),min(.98,strainU+.035),seat-.02,.012+.02*t),'fill="'+tint(c1,2.1*glow)+'" opacity="'+fixed(.8*t**1.2)+'"'));
    for(let k=0;k<rings;k++) add(path(ring(k,1),'stroke="'+tint(c1,(1.62-.2*spread(k))*glow,1.1)+'" stroke-width="'+fixed((1.4+2.6*(1-spread(k)))*(.6+.4*t),2)+'" opacity="'+fixed((.45+.5*(1-spread(k)))*t**1.1)+'"'));
    add('</g></g>');
  }
  if(fold) {
    add('<g id="field-fold-light" fill="url(#field-edge-ink)" opacity="'+fixed(strength*fold*(.1+.3*d))+'" filter="url(#field-diffuse)">');
    for(const phase of [0,PI]) {
      const seam=u=>.48+.22*sin(2*PI*u+phase)*sin(PI*u);
      add(path(closed(us.map(u=>surface(u,seam(u))),reverse(us).map(u=>surface(u,seam(u)+.12*sin(PI*u)))),''));
    }
    add('</g>');
    add(path(strip(.28,.79,.53,.045+.08*fold,.14),'id="field-fold-shadow" fill="url(#field-depth)" opacity="'+fixed(strength*fold*(.24+.24*d))+'" filter="url(#field-diffuse)"'));
  }
  add(path(pointsPath(us.map(u=>surface(u,.06))),'fill="none" stroke="url(#field-edge-ink)" stroke-width="'+fixed(.65+.75*d+.9*weave,2)+'" opacity="'+fixed(strength*(d*.68+.3*weave))+'"'));
  add(path(pointsPath(us.filter(u=>u>=.47&&u<=.84).map(u=>surface(u,.9))),'fill="none" stroke="url(#field-edge-ink)" stroke-width="'+fixed(1+.8*d,2)+'" opacity="'+fixed(strength*d*.6)+'"'));
  add('</g><g id="field-accent" fill="none">');
  if(p.accent) {
    // A vein: the accent's quality running through the material like a mineral
    // inclusion, with a little of its colour diffused round it. Its line is denser
    // than the material round it, so it stays its own colour where it crosses
    // another, and only as sharp as the field is articulated.
    const s=p.accent_strength, span=.13+.3*s, lo=max(.05,.5-span), hi=min(.95,.5+span);
    add(path(lensAlong(veinCourse,lo,hi,u=>(.035+.1*s)*bump(u,lo,hi,.8),80),'fill="'+ca+'" opacity="'+fixed(.14+.36*s)+'" filter="url(#field-soft)"')
      +path(lensAlong(veinCourse,lo,hi,u=>(.008+.032*s)*bump(u,lo,hi,.7),80),'fill="'+shade(ca,.9,1.2)+'" opacity="'+fixed(.7+.3*s)+'" filter="url(#field-fine)"'));
  }
  if(d>.55) add(path(pointsPath(us.filter(u=>u>=.17&&u<=.21).map(u=>point(u,thickness(u)*.45))),'stroke="'+light(c1,1.18)+'" stroke-width="1.2" opacity="'+fixed(strength*(d-.55)*.7)+'"'));
  add('</g><g id="field-gesture" fill="none" stroke-linecap="round" filter="url(#field-fine)">');
  const g=p.gesture,gs=p.gesture_strength;
  if(gs&&g==='braid') {
    // Two strands of the band wind round each other for a short run, each lit
    // along its length, passing over and under in turn.
    const ua=.1, ub=.44;
    const course=(u,j)=>{const v=(u-ua)/(ub-ua);return .5+.3*sin(PI*(2.6*v+.35*sin(PI*v))+j*PI)*sin(PI*v)**.5;};
    // Each strand is one of the field's two hues; a blend of the two would grey.
    const half=u=>(.085+.045*gs)*bump(u,ua,ub,.35), strand=[c1,c2];
    for(const j of [0,1]) add(path(lensAlong(u=>course(u,j),ua,ub,half,90),'fill="'+tint(strand[j],.92*glow,1.1)+'" stroke="none" opacity="'+fixed(.14+.22*gs)+'" filter="url(#field-diffuse)"'));
    const crossings=[ua,...[.2,.4,.6,.8].map(x=>ua+(ub-ua)*x),ub];
    for(let i=0;i<crossings.length-1;i++) {
      const j=i%2, a0=max(ua,crossings[i]-.035), a1=min(ub,crossings[i+1]+.035);
      const over=u=>course(u,j), passing=u=>half(u)*bump(u,a0,a1,.85);
      add(path(lensAlong(over,a0,a1,u=>1.4*passing(u),48),'fill="url(#field-shade)" stroke="none" opacity="'+fixed(.22+.26*gs)+'" filter="url(#field-diffuse)"')
        +path(lensAlong(over,a0,a1,passing,48),'fill="'+tint(strand[j],1.08*glow,1.1)+'" stroke="none" opacity="'+fixed(.22+.26*gs)+'" filter="url(#field-diffuse)"')
        +path(lensAlong(u=>over(u)-.3*half(u),a0,a1,u=>.3*passing(u),48),'fill="'+tint(strand[j],1.45*glow,1.1)+'" stroke="none" opacity="'+fixed(.32+.38*gs)+'"'));
    }
  } else if(gs&&g==='fold') {
    // A bend that tucks the outer lip over: the underside shows, deeper, with a
    // shade beneath the tuck and light along its rolled edge.
    const lo=.12, hi=.4, depth=u=>(.2+.3*gs)*bump(u,lo,hi,1.1);
    add(path(band(()=>0,depth,lo,hi,60),'fill="'+shade(c1,.58)+'" stroke="none" opacity="'+fixed(.35+.4*gs)+'" filter="url(#field-diffuse)"')
      +path(band(depth,u=>1.2*depth(u),lo,hi,60),'fill="url(#field-shade)" stroke="none" opacity="'+fixed(.3+.3*gs)+'" filter="url(#field-diffuse)"')
      +path(band(u=>.86*depth(u),depth,lo,hi,60),'fill="'+tint(c2,1.5*glow,1.2)+'" stroke="none" opacity="'+fixed(.45+.4*gs)+'"'));
  } else if(g!=='none'&&gs) for(let j=0;j<(g==='braid'?2:1);j++) {
    const pts=us.filter(u=>u>=.28&&u<=.64).map(u=>{
      const v=(u-.28)/.36,bow=sin(PI*v),wave=g==='braid'?sin(v*PI*3+j*PI):bow;
      return point(u,thickness(u)*.5+(g==='echo'?42:-38)*gs*wave*bow);
    });
    // A glow of the strand's colour, a soft shade under it, and the thread itself.
    add(path(pointsPath(pts),'stroke="'+tint(c2,1.2,1.3)+'" stroke-width="'+fixed(6+15*gs,2)+'" opacity="'+fixed(.07+.14*gs)+'" filter="url(#field-diffuse)"'));
    add(path(pointsPath(pts),'stroke="url(#field-shade)" stroke-width="'+fixed(2.4+4.4*gs,2)+'" opacity="'+fixed(.14+.2*gs)+'"'));
    add(path(pointsPath(pts),'stroke="'+tint(c2,1.12,1.4)+'" stroke-width="'+fixed(1.2+2.4*gs,2)+'" opacity="'+fixed(.3+.42*gs)+'"'));
  }
  add('</g><g id="drone-body"><rect x="436" y="468" width="128" height="64" rx="32" fill="url(#drone-metal)" stroke="url(#drone-rim)" stroke-width="1.5"/></g></svg>');
  return svg.join('\n')+'\n';
}
