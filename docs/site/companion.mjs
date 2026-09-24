import {validateState,publicState,appendUpdate,conversationId} from './continuity.mjs';
import {FieldMovement} from './movement.mjs';
import {STUDY} from './companion-studies.mjs';
import {PALETTE} from './renderer.mjs';
import {createListening} from './listening.mjs';

const $=selector=>document.querySelector(selector),params=new URLSearchParams(location.search);
const live=params.get('mode')==='live';
let state=null,viewed=null,selected='',stream=null,generation=0,connected=false;
let demoTimer=0,replayTimer=0,demoIndex=0,viewingHistory=false;
const scene=new FieldMovement($('#field-stage'));
const listening=createListening({getSpec:()=>viewed?.spec||STUDY[0].update.spec,
  getName:()=>viewed?.title||'this field',download});
const cachePrefix='field-companion-v1:';
function storageGet(key) {try{return localStorage.getItem(key);}catch{return null;}}
function storageSet(key,value) {try{localStorage.setItem(key,value);}catch{$('#companion-status').textContent='Browser storage is unavailable. The local server still keeps your conversation history.';}}
function message(text) {$('#companion-status').textContent=text;}
function connection(text,kind='ready') {$('#connection').textContent=text;$('#connection').dataset.state=kind;}
function download(blob,filename) {
  const url=URL.createObjectURL(blob),link=document.createElement('a');
  link.href=url;link.download=filename;document.body.append(link);link.click();link.remove();
  setTimeout(()=>URL.revokeObjectURL(url),30000);
}
function cache() {if(live&&state)storageSet(cachePrefix+selected,JSON.stringify(publicState(state)));}
function date(value) {return new Date(value).toLocaleString(undefined,{dateStyle:'medium',timeStyle:'short'});}
function age(value) {
  const seconds=Math.max(0,Math.floor((Date.now()-Date.parse(value))/1000));
  if(seconds<60)return 'under a minute ago';
  if(seconds<3600)return Math.floor(seconds/60)+' minutes ago';
  if(seconds<86400)return Math.floor(seconds/3600)+' hours ago';
  return Math.floor(seconds/86400)+' days ago';
}
function freshness() {
  if(!live||!state)return;
  const latest=state.updates.at(-1);
  connection((connected?'Connected · ':'Offline · saved expression · ')+
    'last expression '+age(latest.at)+(viewingHistory?' · viewing history':''),connected?'ready':'offline');
}
function inspect(update,previous) {
  const details={Author:update.source.producer,Source:update.source.kind==='scripted'?'Scripted demonstration':update.source.kind==='observer'?'Observer interpretation':'Participating assistant',
    'Source boundary':update.source.turn,'Updated':date(update.at),Expression:String(update.sequence),
    'Context coverage':['early','middle','late'].map(k=>k+': '+update.coverage[k]).join(' · '),
    'Source material':update.coverage.basis.join(', '),'Coverage gaps':update.coverage.gaps,
    'Retained contour':previous&&update.spec.history>0?'From expression '+previous.sequence:'No previous contour used'};
  $('#inspection-values').replaceChildren();
  for(const [name,value] of Object.entries(details)) {
    const dt=document.createElement('dt'),dd=document.createElement('dd');dt.textContent=name;dd.textContent=value;$('#inspection-values').append(dt,dd);
  }
}
function timeline() {
  $('#history-list').replaceChildren();
  if(!state)return;
  $('#history-count').textContent=state.updates.length+' moment'+(state.updates.length===1?'':'s');
  for(const update of state.updates.slice(-12)) {
    const li=document.createElement('li'),button=document.createElement('button');button.type='button';
    button.textContent=live?'Expression '+update.sequence:update.source.turn;
    button.style.setProperty('--moment-color',PALETTE[update.spec.primary]);
    button.setAttribute('aria-current',String(update.sequence===viewed?.sequence));
    button.addEventListener('click',()=>{stopReplay();stopDemo();viewingHistory=true;show(update);});
    li.append(button);$('#history-list').append(li);
  }
  $('#replay').disabled=state.updates.length<2;
  $('#return-current').hidden=!viewingHistory;
  $('#history-note').textContent=state.updates.length>12?'Showing the last 12 moments. Replay includes up to 80 saved expressions.':'A trace can carry an earlier contour into the present expression.';
}
function show(update,{immediate=false}={}) {
  const index=state.updates.findIndex(x=>x.sequence===update.sequence),previous=state.updates[index-1];
  viewed=update;
  $('#empty-note').hidden=true;
  $('#session-title').textContent=update.title;
  $('#view-kind').textContent=viewingHistory?'History · '+update.sequence:live?'Current expression':'Scripted study';
  const study=STUDY.find(x=>x.update.sequence===update.sequence);
  $('#current-moment').textContent=live?(viewingHistory?'An earlier expression.':'Holding the latest expression.'):(study?.description||'');
  scene.show(update,previous,{immediate});listening.update();
  $('#save-field').disabled=false;$('#save-history').disabled=false;
  const audioSupported=Boolean((window.AudioContext||window.webkitAudioContext)&&window.Worker);
  $('#listen').disabled=!audioSupported;$('#save-audio').disabled=!audioSupported;
  inspect(update,previous);timeline();freshness();
}
function current() {stopReplay();viewingHistory=false;if(state)show(state.updates.at(-1));}
function stopReplay() {clearInterval(replayTimer);replayTimer=0;$('#replay').textContent='Replay history ↺';}
function stopDemo() {clearInterval(demoTimer);demoTimer=0;$('#play-study').textContent='Play the study';}
function advanceDemo() {
  if(demoIndex>=STUDY.length-1){stopDemo();return;}
  const update=STUDY[++demoIndex].update;
  state=appendUpdate(state,update);viewingHistory=false;show(update);
  $('#next-study').disabled=demoIndex>=STUDY.length-1;
  if(demoIndex>=STUDY.length-1)stopDemo();
}
function restartDemo() {
  stopDemo();stopReplay();listening.stop('Sound begins only when you press Listen.');
  demoIndex=0;state=appendUpdate(null,STUDY[0].update);viewingHistory=false;
  $('#next-study').disabled=false;show(state.updates[0],{immediate:true});
}

async function listConversations() {
  const response=await fetch('/api/status',{cache:'no-store'});
  if(!response.ok)throw new Error('Start the local companion to connect a conversation.');
  const data=await response.json(),select=$('#conversation');
  select.replaceChildren();
  if(!data.conversations.length) {
    const option=document.createElement('option');option.value='';option.textContent='Waiting for an expression';select.append(option);
  }
  for(const item of data.conversations) {
    const option=document.createElement('option');option.value=item.id;option.textContent=item.title;select.append(option);
  }
  if(selected&&!data.conversations.some(item=>item.id===selected)) {
    const option=document.createElement('option');option.value=selected;option.textContent=state?.title||selected;select.append(option);
  }
  if(selected)select.value=selected;
  else if(data.conversations.length)connectConversation(data.conversations[0].id);
}
function connectConversation(id) {
  conversationId(id);
  const token=++generation;stream?.close();connected=false;selected=id;state=null;viewed=null;
  stopReplay();listening.stop('Sound begins only when you press Listen.');
  viewingHistory=false;scene.finish();scene.target=null;$('#field-stage').replaceChildren();
  $('#inspection-values').replaceChildren();$('#history-list').replaceChildren();$('#history-count').textContent='0 moments';
  $('#listen').disabled=true;$('#save-audio').disabled=true;$('#save-field').disabled=true;$('#save-history').disabled=true;$('#replay').disabled=true;
  $('#return-current').hidden=true;$('#current-moment').textContent='';$('#session-title').textContent=id;
  $('#view-kind').textContent='Waiting for an expression';$('#empty-note').hidden=false;
  connection('Connecting to the selected conversation…');
  const url=new URL(location.href);url.searchParams.set('conversation',id);history.replaceState(null,'',url);
  storageSet('field-last-conversation',id);
  const saved=storageGet(cachePrefix+id);
  if(saved)try {
    const restored=validateState(JSON.parse(saved));
    if(restored.conversation===id&&restored.updates.every(u=>u.source.kind!=='scripted')) {
      state=restored;show(state.updates.at(-1),{immediate:true});freshness();
    }
  }catch {message('The browser copy could not be restored. Checking the local server.');}
  stream=new EventSource('/api/events?conversation='+encodeURIComponent(id));
  stream.addEventListener('field',event=>{
    if(token!==generation)return;
    try {
      const payload=JSON.parse(event.data);
      if(!payload.state) {
        connected=true;
        connection(state?'Connected · showing saved expression; publish a new update to resume.':'Connected · waiting for the first expression.');return;
      }
      const next=validateState(payload.state);
      if(next.conversation!==selected||next.updates.some(u=>u.source.kind==='scripted'))throw new Error('The update did not match the selected live conversation.');
      const latest=next.updates.at(-1),oldSequence=state?.updates.at(-1).sequence??0;
      if(latest.sequence<oldSequence)throw new Error('An older state arrived. Keeping the saved expression.');
      connected=true;
      if(latest.sequence===oldSequence) {freshness();return;}
      const first=!state;
      state=next;cache();
      if(!viewingHistory)show(latest,{immediate:first});
      else {timeline();freshness();message('A new expression is available. Return to current when you wish.');}
    } catch(error) {connected=false;connection(error.message,'offline');}
  });
  stream.onerror=()=>{
    if(token!==generation)return;
    connected=false;
    if(state)freshness();else connection('Companion disconnected. Waiting to reconnect.','offline');
  };
}

$('#play-study').addEventListener('click',()=>{
  if(demoTimer){stopDemo();return;}
  stopReplay();if(demoIndex===STUDY.length-1)restartDemo();
  advanceDemo();if(demoIndex<STUDY.length-1){demoTimer=setInterval(advanceDemo,8500);$('#play-study').textContent='Pause the study';}
});
$('#next-study').addEventListener('click',()=>{stopDemo();stopReplay();advanceDemo();});
$('#restart-study').addEventListener('click',restartDemo);
$('#return-current').addEventListener('click',current);
$('#replay').addEventListener('click',()=>{
  if(replayTimer){current();return;}
  stopDemo();viewingHistory=true;let index=0;
  const frames=[...state.updates];show(frames[0]);$('#replay').textContent='Stop replay';
  replayTimer=setInterval(()=>{
    if(++index>=frames.length){current();return;}
    show(frames[index]);$('#replay').textContent='Stop replay';
  },7000);
});
$('#conversation').addEventListener('change',event=>{if(event.target.value)connectConversation(event.target.value);});
$('#refresh-conversations').addEventListener('click',()=>listConversations().catch(error=>connection(error.message,'offline')));
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
let motion=storageGet('field-movement')!=='off';
function motionPreference() {
  scene.setEnabled(motion&&!reduced.matches);
  $('#movement').textContent=reduced.matches?'Reduced motion':motion?'Movement on':'Still view';
  $('#movement').disabled=reduced.matches;$('#movement').setAttribute('aria-pressed',String(motion&&!reduced.matches));
}
$('#movement').addEventListener('click',()=>{motion=!motion;storageSet('field-movement',motion?'on':'off');motionPreference();});
reduced.addEventListener('change',motionPreference);motionPreference();
$('#save-field').addEventListener('click',()=>{download(new Blob([scene.snapshot()],{type:'image/svg+xml'}),'field-continuity.svg');message('Saved this expression with its controls, coverage, and retained contour.');});
$('#save-history').addEventListener('click',()=>{download(new Blob([JSON.stringify(publicState(state),null,2)],{type:'application/json'}),'field-history.json');message('Saved the composition history. Conversation notes are kept separately by the local companion.');});
$('#focus-view').addEventListener('click',()=>{
  const focus=document.body.classList.toggle('focus');$('#focus-view').textContent=focus?'Show context':'Focus view';$('#focus-view').setAttribute('aria-pressed',String(focus));
});
if(params.get('compact')==='1')$('#focus-view').click();
$('#small-window').addEventListener('click',()=>{
  const url=new URL(location.href);url.searchParams.set('compact','1');
  const popup=window.open(url.href,'field-companion','popup,width=460,height=780');
  if(!popup){document.body.classList.add('focus');$('#focus-view').textContent='Show context';$('#focus-view').setAttribute('aria-pressed','true');message('Showing a focused view here.');}
});
document.addEventListener('visibilitychange',()=>{if(document.hidden){stopDemo();stopReplay();}});
window.addEventListener('pagehide',()=>{stream?.close();stopDemo();stopReplay();scene.finish();});
window.addEventListener('pageshow',event=>{if(event.persisted&&live&&selected)connectConversation(selected);});

$('#demo-panel').hidden=live;$('#live-panel').hidden=!live;
if(live) {
  $('#listen').disabled=true;$('#save-audio').disabled=true;$('#empty-note').hidden=false;
  const initial=params.get('conversation')||storageGet('field-last-conversation');
  if(initial)try {connectConversation(initial);}catch(error){message(error.message);}
  listConversations().catch(error=>connection(error.message,'offline'));
  setInterval(()=>{if(!document.hidden)listConversations().catch(()=>{});},5000);
  setInterval(freshness,15000);
} else {connection('Scripted study · no live conversation connected');restartDemo();}
