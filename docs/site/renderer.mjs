// Browser implementation of scripts/render_field.py, rendering revision 4.4.
// Keep geometry and material in step with the Python reference renderer.
export const REVISION = '4.4';
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

export function pointsPath(points) {
  const xy = p => p.map(v => fixed(v, 2)).join(',');
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
  const turn = (-18+38*p.flow)*PI/180;
  const bezier = (u, p0, p1, p2, p3) => [0,1].map(k => (1-u)**3*p0[k] + 3*(1-u)**2*u*p1[k] + 3*(1-u)*u*u*p2[k] + u**3*p3[k]);
  const rotate = (x, y) => [x*cos(turn)-y*sin(turn), x*sin(turn)+y*cos(turn)];
  function rawPoint(u, inset = 0) {
    if (form !== 'envelope') {
      let x, y;
      if (form === 'sweep') [x,y] = u <= .5 ? bezier(2*u,[-340,170],[-250,250],[-130,90],[-20,110]) : bezier(2*u-1,[-20,110],[110,125],[190,-150],[345,-175]);
      else [x,y] = u <= .5 ? bezier(2*u,[-285,180],[-360,-40],[-180,-270],[0,-250]) : bezier(2*u-1,[0,-250],[180,-255],[360,-50],[285,180]);
      const envelope = sin(PI*u);
      x = x*a/295 + 34*skew*envelope + 15*fold*sin(5*PI*u-.7)*envelope;
      y = y*b/215 + 30*t*exp(-1*((u-.48)/.13)**2) + 22*fold*sin(3*PI*u+.25)*envelope;
      return rotate(x,y);
    }
    const theta = start+(end-start)*u, phase = atan2(sin(theta-2.65), cos(theta-2.65));
    let r = 1-.36*t*exp(-1*(phase/.38)**2) + .065*skew*cos(theta);
    r += fold*(.18*sin(3*theta+.5)+.07*cos(5*theta-.7));
    return rotate((a-inset)*cos(theta)*r + 52*skew*sin(theta)**2, (b-inset*.68)*sin(theta)*r);
  }
  const extent = max(...seq(201, i => rawPoint(i/200)).flat().map(abs));
  const fit = min(1, 395/max(1,extent));
  function point(u, inset = 0) {
    let x, y;
    if (form === 'envelope') [x,y] = rawPoint(u, inset);
    else {
      [x,y] = rawPoint(u);
      const before = rawPoint(max(0,u-.001)), after = rawPoint(min(1,u+.001));
      const dx = after[0]-before[0], dy = after[1]-before[1], length = max(1e-6,hypot(dx,dy));
      const [nx,ny] = form === 'sweep' ? [dy/length,-dx/length] : [-dy/length,dx/length];
      x += inset*nx; y += inset*ny;
    }
    return [500+fit*x,500+fit*y];
  }
  const us = seq(97, i => i/96);
  function thickness(u) {
    const theta = start+(end-start)*u, taper = max(0,sin(PI*u))**.42;
    let width = (16+91*breadth+17*power+15*(1-d))*taper*(.78+.22*sin(theta+fold));
    const phase = atan2(sin(theta-2.65), cos(theta-2.65));
    width *= (1-.18*t*exp(-1*(phase/.45)**2))*(1+.17*fold*sin(3*theta+.8));
    return min(width,min(a,b)*.48);
  }
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
  return {a,b,fit,point,surface,us,ribbon,strip,thickness};
}

export function render(spec = {}) {
  const p = validate(spec);
  const pigment = name => { const [l, a, b] = toOklab(PALETTE[name]); return oklabHex([l, a*p.saturation, b*p.saturation]); };
  const mix = (a, b, amount) => { const second = toOklab(b); return oklabHex(toOklab(a).map((x, i) => x*(1-amount) + second[i]*amount)); };
  const light = (color, amount) => { const [l, a, b] = toOklab(color); return oklabHex([min(.91, l*amount), a, b]); };
  // Lit but withdrawn material, for surfaces that are remembered or inferred.
  const pale = (color, amount, chroma) => { const [l, a, b] = toOklab(color); return oklabHex([min(.91, l*amount), a*chroma, b*chroma]); };
  const c1 = pigment(p.primary), c2 = pigment(p.secondary || p.primary), ca = pigment(p.accent || p.primary);
  const ambient = pigment(p.ambient || p.primary), climate = p.ambient_strength;
  const bgCentre = mix('#101A25', ambient, .03+.38*climate), bgEdge = mix('#080D16', ambient, .02+.12*climate);
  const {openness:o, tension:t, definition:d, complexity:c, intensity:power, imbalance:skew, breadth, folding:fold, stretch, form} = p;
  const strength = .26+.65*power;
  const {a,b,fit,point,surface,us,ribbon,strip,thickness} = geometry(p);
  const outline = ribbon(0,1), accentMix = p.accent ? mix(c1,ca,p.accent_strength*.85) : c1;
  // Epistemic texture: how much of this reading rests on material actually
  // present. What is not grounded is described rather than filled.
  const weave = 1-p.grounding;
  const aperture = (6+112*o)*PI/180, first = -.42+aperture/2, last = 2*PI-.42-aperture/2;
  // The visible seat of compression, following the geometry that tension bends.
  const strainU = form === 'envelope' ? min(.86,max(.14,(2.65-first)/(last-first))) : .48;
  const counterHue = p.accent ? ca : c2;
  const svg = [];
  const add = value => svg.push(value);
  const path = (shape, attrs) => '<path d="' + shape + '" ' + attrs + '/>';
  const stops = (colors, offsets, opacity = []) => colors.map((color,i)=>'<stop' + (i ? ' offset="'+offsets[i]+'"' : '')+' stop-color="'+color+'"' + (opacity[i] === undefined ? '' : ' stop-opacity="'+opacity[i]+'"')+'/>').join('');
  const linear = (id, coords, colors, offsets, opacity) => '<linearGradient id="'+id+'" '+coords+'>'+stops(colors,offsets,opacity)+'</linearGradient>';
  const pageGradient = 'gradientUnits="userSpaceOnUse" x1="180" y1="720" x2="820" y2="270"';
  const metadata = Object.fromEntries(Object.keys(p).sort().map(k=>[k,p[k]]));
  add('<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="1000" viewBox="0 0 1000 1000" role="img" aria-label="A central titanium capsule with a unified abstract field" data-field-version="4" data-field-renderer="'+REVISION+'">');
  add('<metadata id="field-spec">'+xml(JSON.stringify(metadata))+'</metadata><defs>');
  add('<radialGradient id="background">'+stops([bgCentre,bgEdge],[0,1])+'</radialGradient>');
  add(linear('field-ink','x1="18%" y1="72%" x2="82%" y2="27%"',[c1,c2,accentMix,c1],[0,.38,.69,1]));
  add('<radialGradient id="field-atmosphere">'+stops([c1,c2,c1],[0,.6,1],[fixed(.07+.18*breadth),fixed(.02+.08*breadth),0])+'</radialGradient>');
  add(linear('field-accent-ink','',[ca,ca,ca],[0,.5,1],[0,.72,0]));
  add(linear('field-edge-ink',pageGradient,[c1,c2,c1,c1],[0,.32,.58,1],[.1,.75,.15,.6]));
  add(linear('field-crest','gradientUnits="userSpaceOnUse" x1="170" y1="690" x2="790" y2="280"',[light(c1,1.28),light(c2,1.45),light(c1,1.3),light(c1,1.4)],[0,.36,.68,1],[.25,.9,.35,.65]));
  add(linear('field-depth','gradientUnits="userSpaceOnUse" x1="230" y1="730" x2="760" y2="300"',Array(4).fill('#0B1520'),[0,.35,.7,1],[0,.48,.1,.3]));
  add(linear('field-history-ink','gradientUnits="userSpaceOnUse" x1="190" y1="730" x2="810" y2="270"',[pale(c2,.74,.5),pale(c1,1.24,.44),pale(c2,.72,.5)],[0,.47,1],[.5,.92,.45]));
  add(linear('field-counter-ink',pageGradient,[light(counterHue,.5),light(counterHue,1.34),light(counterHue,.6)],[0,.42,1]));
  add(linear('drone-metal','x1="0" y1="0" x2="0" y2="1"',['#34414D','#202B35','#101922'],[0,.5,1]));
  add(linear('drone-rim','x1="0" y1="0" x2="1" y2="1"',['#DDE5EA','#8C9BA9','#DDE5EA'],[0,.6,1],[.68,.21,.30]));
  for (const [id,blur] of [['field-soft',1.5+18*(1-d)],['field-diffuse',1.2+5*(1-d)**2]]) add('<filter id="'+id+'" x="-25%" y="-25%" width="150%" height="150%" color-interpolation-filters="sRGB"><feGaussianBlur stdDeviation="'+fixed(blur,2)+'"/></filter>');
  const lanes = 28;
  for (let j=0;j<lanes;j++) {
    const f=(j+.5)/lanes;
    const illumination=.46+.66*exp(-1*((f-.27)/.3)**2)+.16*exp(-1*((f-.91)/.13)**2);
    add(linear('field-skin-'+j,pageGradient,[c1,c2,accentMix,c1].map(color=>light(color,illumination)),[0,.38,.69,1]));
  }
  add('</defs><rect id="field-background" width="1000" height="1000" fill="url(#background)"/><g id="field-envelope">');
  add('<ellipse cx="500" cy="500" rx="'+fixed(min(435,a*fit+45),2)+'" ry="'+fixed(min(420,b*fit+65),2)+'" fill="url(#field-atmosphere)" transform="rotate('+fixed(-18+38*p.flow,2)+' 500 500)"/>');
  if (p.history) {
    const location = (u,f,displacement) => {
      const [x,y]=surface(u,f), outer=point(u,0), inner=point(u,1);
      const dx=inner[0]-outer[0],dy=inner[1]-outer[1],length=max(1e-6,hypot(dx,dy));
      return [x-displacement*dx/length,y-displacement*dy/length];
    };
    const offset = u=>p.history*(30+34*breadth)*sin(PI*u)**1.6*(.84+.16*cos(3*PI*u));
    const ridge=closed(us.map(u=>location(u,.07,offset(u))),reverse(us).map(u=>location(u,.34,offset(u)*.17)));
    const edge=pointsPath(us.filter(u=>u>=.16&&u<=.84).map(u=>location(u,.07,offset(u))));
    add('<g id="field-history" opacity="'+fixed(strength*p.history*(.86+.14*d))+'">'+path(ridge,'fill="url(#field-history-ink)" filter="url(#field-diffuse)"')+path(edge,'fill="none" stroke="'+pale(c2,1.36,.5)+'" stroke-width="'+fixed(1+1.9*p.history,2)+'" opacity=".82"')+'</g>');
  }
  add(path(outline,'fill="url(#field-ink)" opacity="'+fixed(strength*.28*(1-.72*weave))+'" filter="url(#field-soft)"'));
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
  if(weave) {
    // Inference is drawn, not filled: the section ribs that define the form
    // stay visible where its material does not. This is not low definition,
    // which blurs everything equally; here the structure stays exact.
    const ribs=7+roundEven(13*weave);
    add('<g id="field-reticulation" fill="none" stroke-linecap="round" opacity="'+fixed(strength*(.62+.38*d))+'">');
    for(let j=0;j<ribs;j++) {
      const u=.06+.88*(j+.5)/ribs, span=weave*(.52+.48*sin(PI*u));
      add(path(pointsPath(seq(13,k=>surface(u,span*k/12))),'stroke="'+pale(c1,1.38,.6)+'" stroke-width="'+fixed(.9+1.3*weave,2)+'" opacity="'+fixed(.4+.5*sin(PI*u))+'"'));
    }
    // A held outer edge keeps the described form exact where it is not filled.
    add(path(pointsPath(us.map(u=>surface(u,.02))),'stroke="'+pale(c1,1.3,.55)+'" stroke-width="'+fixed(.7+1.1*weave,2)+'" opacity="'+fixed(.3+.4*weave)+'"'));
    add('</g>');
  }
  // Light falls only where there is material to catch it, so it moves inward.
  add(path(strip(.07,.94,.31+.5*weave,(.13+.035*breadth)*(1-.45*weave),.12),'id="field-shoulder-light" fill="url(#field-crest)" opacity="'+fixed(strength*(.45+.4*d))+'" filter="url(#field-diffuse)"'));
  if(p.counterpoint) {
    // A second current lives in the same material, so it is modelled by the
    // same light. It parts above the shoulder, where the surface can be read.
    const section=[.14,...us.filter(u=>u>.14&&u<.86),.86];
    const parting=u=>.52*p.counterpoint*max(0,sin(PI*((u-.14)/.72)))**1.4;
    const near=section.map(u=>surface(u,.40));
    const lens=closed(near,reverse(section).map(u=>surface(u,.40+parting(u))));
    const seam=pointsPath(section.map(u=>surface(u,.40+parting(u))));
    add('<g id="field-countercurrent" opacity="'+fixed(strength*p.counterpoint*(.74+.26*d))+'">'
      +path(lens,'fill="url(#field-counter-ink)" filter="url(#field-diffuse)"')
      +path(pointsPath(near),'fill="none" stroke="#0B1520" stroke-width="'+fixed(1.1+2.4*p.counterpoint,2)+'" opacity=".5"')
      +path(seam,'fill="none" stroke="'+light(counterHue,1.44)+'" stroke-width="'+fixed(1+3*p.counterpoint,2)+'" opacity=".88"')+'</g>');
  }
  add(path(strip(.21,.75,.2+.58*weave,.045+.03*breadth,.08),'id="field-grazing-light" fill="url(#field-crest)" opacity="'+fixed(strength*(.35+.35*d))+'"'));
  if(t) {
    // Compression gathers shadow behind the strained contour and concentrates
    // light along it. Unresolved pressure, not alarm.
    const lo=max(.02,strainU-.18), hi=min(.98,strainU+.18);
    add(path(strip(lo,hi,.46,.07+.17*t,.1),'id="field-strain" fill="url(#field-depth)" opacity="'+fixed(strength*t*(.5+.3*d))+'" filter="url(#field-diffuse)"'));
    add(path(strip(max(.02,strainU-.13),min(.98,strainU+.13),.2,.028+.05*t),'id="field-strain-light" fill="url(#field-crest)" opacity="'+fixed(strength*t*(.55+.3*d))+'"'));
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
  add('</g><g id="field-filaments" fill="none" stroke-linecap="round" opacity="'+fixed(strength*(.42+.58*d))+'">');
  const count=1+roundEven(c*10);
  for(let j=0;j<count;j++) {
    const f=.12+.79*((j+1)/(count+1))**1.45,lo=.015+.045*(j%3),hi=.985-.04*((j+1)%4);
    const samples=us.filter(u=>u>=lo&&u<=hi);
    const shift=u=>(.012*t+.045*fold)*sin(5*PI*u+j*.9)*sin(PI*u);
    const pts=samples.map(u=>surface(u,f+shift(u)));
    const trough=samples.map(u=>surface(u,f+shift(u)+.028*sin(PI*u)));
    const weight=j%3===0?1:.55, relief=.72+1.15*breadth;
    // Each filament is a crest with its own shadow, so fine structure reads
    // as a change of surface direction rather than a drawn line.
    add(path(pointsPath(trough),'stroke="#0B1520" stroke-width="'+fixed((1+1.05*d)*relief*weight,2)+'" opacity="'+fixed((.19+.19*d)*weight)+'"'));
    add(path(pointsPath(pts),'stroke="'+light(c1,1.32)+'" stroke-width="'+fixed((.85+.95*d)*relief*weight,2)+'" opacity="'+fixed((.3+.33*d)*weight)+'"'));
  }
  add('</g><g id="field-accent" fill="none">');
  if(p.accent) {
    const seg=pointsPath(us.filter(u=>u>=.37&&u<=.69).map(u=>surface(u,.57)));
    add(path(seg,'stroke="url(#field-accent-ink)" stroke-width="'+fixed(6+25*p.accent_strength,2)+'" opacity="'+fixed(.25+.45*p.accent_strength,2)+'" filter="url(#field-soft)"'));
    add(path(seg,'stroke="url(#field-accent-ink)" stroke-width="'+fixed(1.6+4*p.accent_strength,2)+'" opacity=".76"'));
  }
  if(d>.55) add(path(pointsPath(us.filter(u=>u>=.17&&u<=.21).map(u=>point(u,thickness(u)*.45))),'stroke="'+light(c1,1.18)+'" stroke-width="1.2" opacity="'+fixed(strength*(d-.55)*.7)+'"'));
  add('</g><g id="field-gesture" fill="none" stroke-linecap="round">');
  const g=p.gesture,gs=p.gesture_strength;
  if(g!=='none'&&gs) for(let j=0;j<(g==='braid'?2:1);j++) {
    const pts=us.filter(u=>u>=.28&&u<=.64).map(u=>{
      const v=(u-.28)/.36,bow=sin(PI*v),wave=g==='braid'?sin(v*PI*3+j*PI):bow;
      return point(u,thickness(u)*.5+(g==='echo'?42:-38)*gs*wave*bow);
    });
    add(path(pointsPath(pts),'stroke="#0B1520" stroke-width="'+fixed(2.6+5*gs,2)+'" opacity="'+fixed(.16+.26*gs)+'"'));
    add(path(pointsPath(pts),'stroke="'+light(c2,1.3)+'" stroke-width="'+fixed(1.4+3.2*gs,2)+'" opacity="'+fixed(.34+.5*gs)+'"'));
  }
  add('</g><g id="drone-body"><rect x="436" y="468" width="128" height="64" rx="32" fill="url(#drone-metal)" stroke="url(#drone-rim)" stroke-width="1.5"/></g></svg>');
  return svg.join('\n')+'\n';
}
