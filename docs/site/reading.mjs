// The companion's legend: what the field in view says, where it sits on each
// channel, and how that is drawn. It is read in the picture's own order, and
// its words are the visual grammar's. It never alters the field's own SVG.
import {render,validate,PALETTE} from './renderer.mjs';

const HUES={teal:'attention, receptivity, engaged inquiry',blue:'analytical composure, precision, evidential restraint',
  violet:'imagination, exploratory reach, open possibilities',amber:'warmth, care, constructive affiliation',
  coral:'friction, consequential concern, live tension',pearl:'clarity or integration'};
const FORMS={envelope:'gathers around the centre',sweep:'carries an open direction across the frame',mantle:'holds tall space around the centre'};
const GESTURES={fold:'a bend',echo:'a continuation',braid:'an intertwining'};
const PHASES=['early','middle','late'];
const BASIS={verbatim:'the messages themselves',summary:'a summary',retrieved_excerpts:'retrieved excerpts'};
const number=v=>(Math.round(v*100)/100).toString().replace(/^(-?)0\./,'$1.');
const band=(v,low,mid,high)=>v<=.33?low:v>=.67?high:mid;
const el=(tag,attributes={},...children)=>{
  const node=document.createElement(tag);
  for(const [name,value] of Object.entries(attributes)) node.setAttribute(name,value);
  node.append(...children);return node;
};
// A row's three small pictures: this same field with one control low, as it is, and high.
const sweep=(control,low,high,labels=['less','more'],also={})=>p=>[[
  [labels[0]+' · '+number(low),{...also,[control]:low}],['now · '+number(p[control]),{},true],[labels[1]+' · '+number(high),{...also,[control]:high}]]];

// In reading order. `at` places the field on the row's scale; `mark` names the
// SVG groups that carry it, for rows whose mark can be picked out of the picture.
const ROWS=[
  {key:'colour',look:'first',name:'Colour',
    say:p=>'Mostly '+p.primary+': '+HUES[p.primary]+'.'
      +(p.secondary&&p.secondary!==p.primary?' With '+p.secondary+': '+HUES[p.secondary]+'.':'')
      +(p.accent?' '+band(p.accent_strength,'A faint ','A ','A pronounced ')+p.accent+' accent: '+HUES[p.accent]+'.':''),
    drawn:'Colour is the stance. The first colour is the dominant quality, the second a supporting one blended through the band, and an accent is a third nuance inside it. Saturation runs from muted to vivid.',
    changed:(a,b)=>a.primary!==b.primary||a.secondary!==b.secondary||a.accent!==b.accent?'the colours':''},
  {key:'climate',look:'first',name:'Climate',control:'ambient_strength',
    say:p=>'A '+(p.ambient||p.primary)+' climate, '+band(p.ambient_strength,'a restrained dark surround','present around the field','permeating the frame')+'.',
    drawn:'The background is the lasting climate of the conversation. Its hue says which, and its brightness says how far that climate reaches, not how good the mood is.',
    strips:sweep('ambient_strength',.05,.9,['restrained','permeating']),
    changed:(a,b)=>(a.ambient||a.primary)!==(b.ambient||b.primary)?'the climate\'s colour':''},
  {key:'form',look:'first',name:'Form',
    say:p=>(p.form==='envelope'?'An ':'A ')+p.form+': it '+FORMS[p.form]+'.',
    drawn:'One of three ways of holding space. A choice of composition, not a mood.',
    strips:p=>[Object.keys(FORMS).map(form=>[form,{form},form===p.form])],
    changed:(a,b)=>a.form!==b.form?'the form ('+a.form+' to '+b.form+')':''},
  {key:'openness',look:'first',name:'Openness',control:'openness',
    say:p=>band(p.openness,'Small and held.','Partly open.','Expansive and open.'),
    drawn:'How far the form opens: the gap in an envelope, the reach of a sweep or a mantle.',strips:sweep('openness',.1,1,['held','open'])},
  {key:'breadth',look:'first',name:'Breadth',control:'breadth',
    say:p=>band(p.breadth,'Thin and specifically focused.','Moderately broad.','Broad and enveloping.'),
    drawn:'How thick the band is.',strips:sweep('breadth',.1,1,['thin','broad'])},
  {key:'folding',look:'first',name:'Folding',control:'folding',
    say:p=>band(p.folding,'Smooth and continuous.','Somewhat folded.','Distinctly folded: several qualities held together.'),
    drawn:'The contour folds and its surface turns. Complexity or ambivalence, not automatically distress.',strips:sweep('folding',0,1,['smooth','folded'])},
  {key:'pull',look:'first',name:'Pull',control:'imbalance',at:p=>Math.abs(p.imbalance),
    say:p=>band(Math.abs(p.imbalance),'No lateral pull to speak of.','A pull to one side.','A strong pull to one side.'),
    drawn:'The form leans. How far says how strong a live, unresolved pull is. Which way says nothing.',
    strips:p=>[[['one way',{imbalance:-.8}],['now · '+number(Math.abs(p.imbalance)),{},true],['the other',{imbalance:.8}]]]},
  {key:'light',look:'first',name:'Light',control:'intensity',
    say:p=>band(p.intensity,'A quiet presence.','A clear presence.','Strong and luminous.'),
    drawn:'How brightly the whole field stands out. Not certainty.',strips:sweep('intensity',.15,1,['quiet','luminous'])},
  {key:'softness',look:'first',name:'Softness',control:'definition',
    say:p=>band(p.definition,'Diffuse: the shape of this isn’t settled.','Partly resolved.','Clearly articulated.'),
    drawn:'How sharply everything is drawn, the marks below included. Not a correctness score.',strips:sweep('definition',.1,1,['diffuse','articulated'])},

  {key:'pressure',look:'second',name:'Pressure',control:'tension',mark:['field-strain','field-strain-light'],
    say:p=>band(p.tension,'Supple, with little pressure.','Some pressure.','Strong local compression: unresolved pressure.'),
    drawn:'The contour pinches at one place, and the colour there grows denser.',strips:sweep('tension',0,1,['supple','compressed'])},
  {key:'threads',look:'second',name:'Threads',control:'complexity',mark:['field-filaments'],
    say:p=>band(p.complexity,'Few threads.','Several threads.','Rich, interwoven fine structure.'),
    drawn:'Fine threads along the band, in its own colour. How many considerations are held at once, not how many messages.',strips:sweep('complexity',0,1,['few','rich'])},
  {key:'current',look:'second',name:'A second current',control:'counterpoint',mark:['field-countercurrent'],absent:p=>!p.counterpoint,
    say:p=>!p.counterpoint?'None here.':band(p.counterpoint,'A slight second current.','A second current alongside the first.','A strong second current alongside the first.'),
    drawn:'A strand in its own colour parts from the band, leaving a dark opening, and rejoins it. A quality held alongside another, not automatically a conflict.',strips:sweep('counterpoint',0,.9,['none','strong'])},
  {key:'remains',look:'second',name:'What remains',control:'history',mark:['field-history'],absent:p=>!p.history,
    say:p=>!p.history?'Nothing carried forward.':band(p.history,'A faint trace of an earlier change.','An earlier change, still present.','An earlier change, strongly present.'),
    drawn:'A dimmer shell just outside the band. On this page it follows the actual contour of the moment before. A retained influence, not a timeline.',strips:sweep('history',0,.9,['none','strong'])},
  {key:'grounding',look:'second',name:'Met or reconstructed',control:'grounding',mark:['field-reticulation'],absent:p=>p.grounding>=1,
    say:p=>p.grounding>=.95?'Met directly.':band(p.grounding,'Mostly reconstructed. Little of it was met directly.','About half met directly, the rest reconstructed.','Mostly met directly, some of it reconstructed.'),
    drawn:'How much of this reading rests on what was actually in the conversation, as against a summary, a memory or an inference. Where it was not met, the outer band thins and its cross-ribs show: the shape is described, the material is not there.',
    strips:p=>[[['met · 1',{grounding:1}],['.6',{grounding:.6}],['.3',{grounding:.3}]],
      [['unsure of the shape',{definition:.1,grounding:1}],['sure of the shape, not met',{definition:Math.max(p.definition,.8),grounding:.3}]]],
    captions:['Less and less of it met, on this field:','Two different things. Low softness says the shape is unsettled. Low grounding says the shape is clear and was not touched:']},
  {key:'gesture',look:'second',name:'Gesture',control:'gesture_strength',mark:['field-gesture'],absent:p=>p.gesture==='none'||!p.gesture_strength,
    say:p=>p.gesture==='none'||!p.gesture_strength?'None here.':'A'+(p.gesture==='echo'?'n ':' ')+p.gesture+': '+GESTURES[p.gesture]+band(p.gesture_strength,', delicate.','.',', pronounced.'),
    drawn:'An optional local inflection: a strand of the second colour, with a glow of the same colour around it.',
    strips:p=>sweep('gesture_strength',0,.9,['none','pronounced'],p.gesture==='none'?{gesture:'braid'}:{})(p),
    changed:(a,b)=>a.gesture!==b.gesture?'the gesture ('+a.gesture+' to '+b.gesture+')':''}
];

export function createReading({getSvg}) {
  const panel=document.querySelector('#reading'),changed=document.querySelector('#reading-changed');
  const pointer=document.querySelector('#reading-pointer'),rows=new Map();
  let now=null,before=null,coverage=null,pointed='',timer=0;
  const remember=value=>{try{localStorage.setItem('field-reading',value);}catch{}};

  for(const row of ROWS) {
    const value=el('span',{class:'reading-value'}),say=el('span',{class:'reading-say'});
    const scale=el('span',{class:'reading-scale','aria-hidden':'true'},el('b'),el('i'));
    const extra=el('div',{class:'reading-extra'}),strips=el('div',{class:'reading-strips'});
    const more=el('div',{class:'reading-more'},el('p',{class:'reading-drawn'},row.drawn),extra,strips);
    const point=row.mark?el('button',{type:'button',class:'text-link reading-point',id:'reading-point-'+row.key,'aria-pressed':'false'},'Show me in the picture'):null;
    if(point) {more.append(point);point.addEventListener('click',()=>show(pointed===row.key?'':row.key));}
    const head=el('summary',{},el('span',{class:'reading-name'},row.name),value,row.control?scale:'',say);
    const details=el('details',{id:'reading-row-'+row.key},head,more);
    details.addEventListener('toggle',()=>{if(details.open)draw(row.key);else{release(row.key);if(pointed===row.key)show('');}});
    document.querySelector('#reading-'+row.look).append(el('li',{class:'reading-row'},details));
    rows.set(row.key,{row,details,value,scale,say,extra,strips,point,urls:[],drawn:''});
  }
  panel.addEventListener('toggle',()=>{
    remember(panel.open?'open':'closed');
    if(panel.open) for(const [key,item] of rows) {if(item.details.open)draw(key);}
    else show('');
  });
  try{if(localStorage.getItem('field-reading')==='open')panel.open=true;}catch{}
  if(location.hash==='#reading')panel.open=true;   // a link can open the guide

  const at=(row,p)=>row.at?row.at(p):p[row.control];
  function release(key) {
    const item=rows.get(key);
    for(const url of item.urls) URL.revokeObjectURL(url);
    item.urls=[];item.strips.replaceChildren();item.drawn='';
  }
  /** The small pictures of an open row, drawn once per field. */
  function draw(key) {
    const item=rows.get(key),identity=JSON.stringify(now);
    if(!now||!item.row.strips||!panel.open||!item.details.open||item.drawn===identity) return;
    release(key);item.drawn=identity;
    item.row.strips(now).forEach((strip,index)=>{
      if(item.row.captions) item.strips.append(el('p',{class:'reading-caption'},item.row.captions[index]));
      const figures=el('div',{class:'reading-strip'});
      for(const [label,change,current] of strip) {
        // Each picture is its own document, so its gradients can't be mistaken for the field's.
        const url=URL.createObjectURL(new Blob([render({...now,...change})],{type:'image/svg+xml'}));
        item.urls.push(url);
        figures.append(el('figure',current?{class:'is-now'}:{},el('img',{src:url,alt:'',width:'200',height:'200',loading:'lazy'}),el('figcaption',{},label)));
      }
      item.strips.append(figures);
    });
  }
  /** Dim the picture and light one mark alone, from a copy of the field as it stands. */
  function show(key) {
    if(pointed) {
      const last=rows.get(pointed);last.point.setAttribute('aria-pressed','false');last.point.textContent='Show me in the picture';
      URL.revokeObjectURL(pointer.querySelector('img').src);pointer.querySelector('img').removeAttribute('src');
    }
    pointed='';pointer.hidden=true;
    const source=key&&getSvg();
    if(!source) return;
    const item=rows.get(key),svg=new DOMParser().parseFromString(source,'image/svg+xml').documentElement,keep=new Set(item.row.mark);
    for(const node of [...svg.querySelectorAll('metadata,#field-background')]) node.remove();
    for(const node of [...svg.querySelector('#field-envelope').children]) if(!keep.has(node.id)) node.remove();
    for(const node of [...svg.children]) if(node.tagName==='g'&&!['field-envelope','drone-body'].includes(node.id)&&!keep.has(node.id)) node.remove();
    for(const id of keep) {
      const mark=svg.querySelector('#'+id);
      if(mark?.hasAttribute('opacity')) mark.setAttribute('opacity',String(Math.min(1,1.7*Number(mark.getAttribute('opacity')))));
    }
    pointer.querySelector('img').src=URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(svg)],{type:'image/svg+xml'}));
    pointer.hidden=false;pointed=key;item.point.setAttribute('aria-pressed','true');item.point.textContent='Showing it alone. Release';
  }
  function differences() {
    const found=[];
    for(const row of ROWS) {
      const named=row.changed?.(before,now);
      if(named) found.push(named);
      if(!row.control) continue;
      const from=at(row,before),to=at(row,now);
      if(Math.abs(to-from)>=.1) found.push(row.name.toLowerCase()+(to>from?' up':' down')+' ('+number(from)+' to '+number(to)+')');
    }
    return found;
  }
  function record(item) {
    item.extra.replaceChildren();
    if(item.row.key==='colour') {
      const roles={[now.primary]:'first'};
      if(now.secondary&&!roles[now.secondary]) roles[now.secondary]='second';
      if(now.accent&&!roles[now.accent]) roles[now.accent]='accent';
      const palette=el('dl',{class:'reading-palette'});
      for(const [hue,meaning] of Object.entries(HUES)) {
        const swatch=el('i',{'aria-hidden':'true'});swatch.style.background=PALETTE[hue];
        palette.append(el('dt',roles[hue]?{class:'is-here'}:{},swatch,hue+(roles[hue]?' · '+roles[hue]:'')),el('dd',{},meaning));
      }
      item.extra.append(palette,el('p',{class:'reading-fact'},'Saturation '+number(now.saturation)+': '
        +(now.saturation<.65?'muted.':now.saturation>1.05?'vivid.':'neither muted nor vivid.')));
    }
    if(item.row.key==='grounding'&&coverage) {
      // The coverage record is what grounding answers to, so the two are shown together.
      const basis=coverage.basis.map(name=>BASIS[name]||name);
      item.extra.append(el('p',{class:'reading-fact'},'What this reading had to go on: '
        +PHASES.map(phase=>phase+' '+coverage[phase]).join(', ')+'. From '+basis.join(' and ')+'.'),
        el('p',{class:'reading-fact'},'Gaps: '+coverage.gaps));
    }
  }
  return {
    update(update,previous) {
      now=validate(update.spec);before=previous?validate(previous.spec):null;coverage=update.coverage;
      show('');
      for(const item of rows.values()) {
        const {row}=item;
        item.say.textContent=row.say(now);
        item.details.classList.toggle('is-absent',Boolean(row.absent?.(now)));
        if(item.point) item.point.disabled=Boolean(row.absent?.(now));
        if(row.control) {
          const here=at(row,now),was=before?at(row,before):here;
          item.value.textContent=number(here);
          item.scale.style.setProperty('--at',100*here+'%');item.scale.style.setProperty('--was',100*was+'%');
          item.scale.classList.toggle('has-moved',Math.abs(here-was)>=.02);
        }
        record(item);
      }
      const moved=before?differences():null;
      changed.textContent=!before?'The first moment in view.':moved.length?'Since the moment before: '+moved.join('; ')+'.':'Little has moved since the moment before.';
      // The small pictures wait until the field itself has started to move.
      clearTimeout(timer);
      timer=setTimeout(()=>{for(const [key,item] of rows) if(item.details.open) draw(key);},450);
    },
    clear() {
      clearTimeout(timer);show('');now=before=coverage=null;changed.textContent='';
      for(const [key,item] of rows) {release(key);item.say.textContent='';item.value.textContent='';item.extra.replaceChildren();}
    }
  };
}
