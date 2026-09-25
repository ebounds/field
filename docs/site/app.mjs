import {render, validate, PALETTE} from './renderer.mjs';
import {PRESETS} from './presets.mjs';
import {createListening} from './listening.mjs';

const $ = selector => document.querySelector(selector);
const title = s => s.charAt(0).toUpperCase() + s.slice(1);
const meanings = {
  teal: 'Attention, receptivity, engaged inquiry.',
  blue: 'Analytical composure, precision, evidential restraint.',
  violet: 'Imagination, exploration, open possibilities.',
  amber: 'Warmth, care, constructive affiliation.',
  coral: 'Friction, consequential concern, live tension.',
  pearl: 'Clarity and integration.'
};
const mainSliders = [
  ['openness','Openness','Held','Open'], ['breadth','Breadth','Fine','Full'],
  ['definition','Definition','Diffuse','Articulate'], ['intensity','Presence','Quiet','Luminous']
];
const fineSliders = [
  ['folding','Folding','Smooth','Interwoven'], ['tension','Tension','Supple','Compressed'],
  ['complexity','Detail','Few threads','Many threads'], ['history','Retained trace','Unmarked','Remembered'],
  ['counterpoint','Countercurrent','One current','Held alongside'], ['ambient_strength','Atmosphere','Restrained','Permeating'],
  ['saturation','Saturation','Muted','Vivid',.25,1.35], ['stretch','Stretch','Tall','Wide',-1,1],
  ['flow','Orientation','Turn left','Turn right',-1,1], ['imbalance','Lateral pull','Left','Right',-1,1],
  ['accent_strength','Accent presence','Subtle','Pronounced'], ['gesture_strength','Gesture presence','Subtle','Pronounced'],
  ['grounding','Grounding','Inferred','Firsthand']
];
const controls = $('#controls');
let state = validate(PRESETS.exploring), startingPoint = 'exploring';
let currentSvg = '', imageUrl = '', frame = 0;
let name = 'Exploring';
const listening=createListening({getSpec:()=>state,getName:()=>name,download});

function message(text) { $('#status').textContent = text; }
function slider([key,label,lowLabel,highLabel,low=0,high=1]) {
  const wrapper = document.createElement('div');
  wrapper.className = 'slider';
  const row = document.createElement('div'); row.className = 'slider-title';
  const caption = document.createElement('label'); caption.htmlFor = key; caption.textContent = label;
  const output = document.createElement('output'); output.htmlFor = key; output.id = key+'-value';
  row.append(caption,output);
  const input = document.createElement('input');
  Object.assign(input,{type:'range',id:key,name:key,min:String(low),max:String(high),step:'.01'});
  input.dataset.control = key;
  const ends = document.createElement('div'); ends.className = 'range-ends'; ends.setAttribute('aria-hidden','true');
  const left = document.createElement('span'); left.textContent = lowLabel;
  const right = document.createElement('span'); right.textContent = highLabel; ends.append(left,right);
  wrapper.append(row,input,ends);
  return wrapper;
}

for (const definition of mainSliders) $('#main-sliders').append(slider(definition));
for (const [key,label] of [['secondary','Supporting color'],['accent','Accent color'],['ambient','Atmosphere color'],['gesture','Local gesture']]) {
  const caption = document.createElement('label');
  caption.className = 'select-label'; caption.htmlFor = key; caption.textContent = label;
  const select = document.createElement('select'); select.id = key; select.name = key; select.dataset.control = key;
  const choices = key === 'gesture' ? ['none','fold','echo','braid'] : ['',...Object.keys(PALETTE)];
  for (const value of choices) {
    const option = document.createElement('option'); option.value = value;
    option.textContent = value ? title(value) : key === 'ambient' ? 'Follow dominant color' : 'None';
    select.append(option);
  }
  $('#fine-controls').append(caption,select);
}
for (const definition of fineSliders) $('#fine-controls').append(slider(definition));
for (const [color,hex] of Object.entries(PALETTE)) {
  const button = document.createElement('button'); button.type = 'button'; button.className = 'swatch';
  button.dataset.color = color; button.style.setProperty('--swatch',hex);
  button.setAttribute('aria-label',title(color)+': '+meanings[color]); button.title = title(color)+': '+meanings[color];
  button.setAttribute('aria-pressed','false');
  const dot = document.createElement('span'); dot.setAttribute('aria-hidden','true'); button.append(dot);
  button.addEventListener('click',()=>change('primary',color));
  $('#palette').append(button);
}

function sync() {
  for (const input of controls.querySelectorAll('[data-control]')) {
    const key = input.dataset.control;
    input.value = state[key] ?? '';
    if (input.type === 'range') {
      const value = Math.round(state[key]*100)+'%';
      $('#'+key+'-value').textContent = value;
      input.setAttribute('aria-valuetext',value+' of the drawing range');
    }
  }
  for (const input of controls.elements.form) input.checked = input.value === state.form;
  for (const swatch of controls.querySelectorAll('[data-color]')) swatch.setAttribute('aria-pressed',String(swatch.dataset.color === state.primary));
  $('#color-meaning').textContent = title(state.primary)+' · '+meanings[state.primary];
  $('#composition-name').textContent = name;
}

function paint() {
  frame = 0;
  try {
    currentSvg = render(state);
    const next = URL.createObjectURL(new Blob([currentSvg],{type:'image/svg+xml'}));
    $('#field-image').src = next;
    $('#field-mini').src = next;
    $('#field-image').alt = 'A wordless '+state.primary+(state.secondary?' and '+state.secondary:'')+' '+state.form+' around a fixed titanium capsule.';
    if (imageUrl) URL.revokeObjectURL(imageUrl);
    imageUrl = next;
    for (const id of ['save-svg','save-png','share']) $('#'+id).disabled = false;
  } catch (error) { message('Could not draw this field. '+error.message); }
}

function schedule() {
  sync();
  listening.update();
  if (!frame) frame = requestAnimationFrame(paint);
}

function change(key,value) {
  state = validate({...state,[key]:value});
  name = 'Your composition'; $('#study').value = 'custom';
  message('');
  if (location.hash.startsWith('#field=')) history.replaceState(null,'',shareUrl());
  schedule();
}

function chooseStudy(key,scroll=false) {
  if (!Object.hasOwn(PRESETS,key)) return;
  startingPoint = key; state = validate(PRESETS[key]); name = title(key);
  $('#study').value = key; message(''); schedule();
  if (location.hash.startsWith('#field=')) history.replaceState(null,'','#playground');
  if (scroll) $('#playground').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});
}

controls.addEventListener('submit',event=>event.preventDefault());
controls.addEventListener('input',event=>{
  const input=event.target, key=input.dataset.control;
  if (key) change(key,input.type==='range'?Number(input.value):(input.value||null));
  else if (input.name==='form') change('form',input.value);
});
$('#study').addEventListener('change',event=>chooseStudy(event.target.value));
$('#reset').addEventListener('click',()=>chooseStudy(startingPoint));
for (const card of document.querySelectorAll('[data-study]')) card.addEventListener('click',()=>chooseStudy(card.dataset.study,true));

function download(blob,filename) {
  const link=document.createElement('a'),url=URL.createObjectURL(blob);
  link.href=url; link.download=filename; document.body.append(link); link.click(); link.remove();
  setTimeout(()=>URL.revokeObjectURL(url),30000);
}
$('#save-svg').addEventListener('click',()=>{
  if (frame) { cancelAnimationFrame(frame); paint(); }
  download(new Blob([currentSvg],{type:'image/svg+xml'}),'field-4.4.svg');
  message('Saved the SVG artwork, with its drawing controls embedded.');
});
$('#save-png').addEventListener('click',async()=>{
  const button=$('#save-png'); button.disabled=true;
  let source='';
  try {
    if (frame) { cancelAnimationFrame(frame); paint(); }
    button.disabled=true;
    source=URL.createObjectURL(new Blob([currentSvg],{type:'image/svg+xml'}));
    const image=new Image(); image.src=source; await image.decode();
    const canvas=document.createElement('canvas'); canvas.width=2000; canvas.height=2000;
    const context=canvas.getContext('2d');
    if (!context) throw new Error('Image export is unavailable in this browser.');
    context.drawImage(image,0,0,2000,2000);
    const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));
    if (!blob) throw new Error('The image could not be saved.');
    download(blob,'field-4.4.png'); message('Saved a 2000 × 2000 image of this field.');
  } catch (error) { message(error.message+' You can also save the SVG.'); }
  finally { if(source) URL.revokeObjectURL(source); button.disabled=false; }
});

function shareUrl() {
  const url=new URL(location.href); url.hash='field='+encodeURIComponent(JSON.stringify(state)); return url.href;
}
async function copy(text,success,button) {
  try {
    await navigator.clipboard.writeText(text); message(success);
    $('#copy-fallback').hidden=true;
    if(button) { const original=button.textContent; button.textContent='Copied'; setTimeout(()=>{button.textContent=original;},2200); }
  } catch {
    $('#copy-fallback').hidden=false;
    $('#copy-value').value=text; $('#copy-value').focus(); $('#copy-value').select();
    message('Select and copy the text below.');
  }
}
$('#share').addEventListener('click',()=>{
  const url=shareUrl(); history.replaceState(null,'',url);
  copy(url,'Copied a link that recreates this exact composition.',$('#share'));
});
$('#copy-prompt').addEventListener('click',()=>copy($('#field-prompt').textContent,'Copied the Field prompt.',$('#copy-prompt')));
$('#copy-spec').addEventListener('click',()=>copy(JSON.stringify(state,null,2),'Copied the current drawing controls.',$('#copy-spec')));
$('#import-spec').addEventListener('click',()=>{
  try {
    const value=$('#spec-input').value;
    if(value.length>16384) throw new Error('Please paste just the drawing controls.');
    const next=validate(JSON.parse(value));
    state=next; name='Your composition'; $('#study').value='custom'; schedule();
    if(location.hash.startsWith('#field=')) history.replaceState(null,'',shareUrl());
    message('Rendered the supplied drawing controls.');
    $('#field-image').scrollIntoView({block:'center',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});
  } catch(error) { message('Could not load these controls. '+error.message); }
});

function loadHash() {
  if(!location.hash.startsWith('#field=')) return false;
  try {
    const value=location.hash.slice(7);
    if(value.length>16384) throw new Error('The shared link is too long.');
    state=validate(JSON.parse(decodeURIComponent(value))); name='Shared composition'; $('#study').value='custom';
    message('A shared composition. Make it your own, or save the artwork.');
    return true;
  } catch {
    state=validate(PRESETS.exploring); name='Exploring'; $('#study').value='exploring';
    message('This shared link could not be read. Showing the Exploring study.'); return false;
  }
}
window.addEventListener('hashchange',()=>{if(location.hash.startsWith('#field=')){loadHash();schedule();}});
const shared=loadHash();
schedule();
if(shared) requestAnimationFrame(()=>$('#playground').scrollIntoView({behavior:'instant'}));
