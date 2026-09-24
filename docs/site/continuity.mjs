// Shared update contract for the local publisher, persistent store, and display.
import {validate} from './renderer.mjs';

export const CONTINUITY_VERSION = 1;
export const HISTORY_LIMIT = 80;
export const TRANSITIONS = ['gather','reach','hold','settle','return','reorient'];
const PHASES=['early','middle','late'];
const COVERAGE=['available','summarized','partial','missing'];
const object=(value,name)=>{
  if(!value||typeof value!=='object'||Array.isArray(value)) throw new Error(name+' must be an object.');
  return value;
};
const keys=(value,allowed,name)=>{
  object(value,name);
  for(const key of Object.keys(value)) if(!allowed.includes(key)) throw new Error('Unknown '+name+' field: '+key);
};
export function text(value,name,max=160) {
  if(typeof value!=='string'||!value.trim()||value.length>max||/[\u0000-\u001f]/.test(value))
    throw new Error(name+' must be nonempty text, at most '+max+' characters.');
  return value.trim();
}
export const conversationId=value=>text(value,'Conversation ID',100);

export function validateUpdate(input) {
  keys(input,['version','conversation','sequence','title','source','coverage','spec','transition','at'],'update');
  if(input.version!==1) throw new Error('Use continuity version 1.');
  const conversation=conversationId(input.conversation);
  if(!Number.isSafeInteger(input.sequence)||input.sequence<1) throw new Error('Sequence must be a positive integer.');
  keys(input.source,['turn','producer','kind'],'source');
  if(!['participant','observer','scripted'].includes(input.source.kind)) throw new Error('Choose participant, observer, or scripted source.');
  const source={turn:text(input.source.turn,'Source turn'),producer:text(input.source.producer,'Producer',100),kind:input.source.kind};
  keys(input.coverage,[...PHASES,'basis','gaps'],'coverage');
  const coverage={};
  for(const phase of PHASES) {
    if(!COVERAGE.includes(input.coverage[phase])) throw new Error('Describe '+phase+' coverage.');
    coverage[phase]=input.coverage[phase];
  }
  if(!Array.isArray(input.coverage.basis)||!input.coverage.basis.length||input.coverage.basis.length>3||
    input.coverage.basis.some(x=>!['verbatim','summary','retrieved_excerpts'].includes(x)))
    throw new Error('Coverage basis must list verbatim, summary, and/or retrieved_excerpts.');
  coverage.basis=[...new Set(input.coverage.basis)];
  coverage.gaps=text(input.coverage.gaps,'Coverage gaps',600);
  const transition=input.transition??'settle';
  if(!TRANSITIONS.includes(transition)) throw new Error('Unknown transition.');
  const at=input.at??new Date().toISOString();
  if(typeof at!=='string'||!Number.isFinite(Date.parse(at))) throw new Error('Use a valid update timestamp.');
  return {version:1,conversation,sequence:input.sequence,title:text(input.title,'Conversation title',120),
    source,coverage,spec:validate(object(input.spec,'Drawing controls')),transition,at:new Date(at).toISOString()};
}

// A revisable index to source material, never an exported reasoning trace.
export function validateLedger(input) {
  if(input===undefined) return null;
  keys(input,['phases','open_questions','direction'],'ledger');
  if(!Array.isArray(input.phases)||input.phases.length>12) throw new Error('Keep at most 12 substantive phases.');
  const phases=input.phases.map(phase=>{
    keys(phase,['name','references','note'],'phase');
    if(!Array.isArray(phase.references)||!phase.references.length||phase.references.length>12)
      throw new Error('Each phase needs 1–12 source references.');
    return {name:text(phase.name,'Phase name',100),references:phase.references.map(ref=>text(ref,'Source reference',160)),
      note:text(phase.note,'High-level phase note',800)};
  });
  if(!Array.isArray(input.open_questions)||input.open_questions.length>12) throw new Error('Keep at most 12 open questions.');
  return {phases,open_questions:input.open_questions.map(q=>text(q,'Open question',400)),
    direction:text(input.direction,'Shared direction',800)};
}

export function appendUpdate(state,input,ledger) {
  const update=validateUpdate(input);
  if(state&&state.conversation!==update.conversation) throw new Error('The update belongs to a different conversation.');
  const previous=state?.updates.at(-1);
  if(previous&&update.sequence<=previous.sequence) throw new Error('Stale or duplicate sequence; read the current state and publish a newer sequence.');
  const context=ledger===undefined?(state?.ledger??null):validateLedger(ledger);
  return {version:1,conversation:update.conversation,title:update.title,
    updates:[...(state?.updates??[]),update].slice(-HISTORY_LIMIT),ledger:context};
}

export function validateState(input) {
  object(input,'Saved state');
  if(input.version!==1||!Array.isArray(input.updates)||!input.updates.length||input.updates.length>HISTORY_LIMIT)
    throw new Error('Invalid saved continuity history.');
  let state=null;
  for(const update of input.updates) state=appendUpdate(state,update);
  if(input.conversation!==state.conversation) throw new Error('Saved conversation does not match its updates.');
  state.ledger=input.ledger===null||input.ledger===undefined?null:validateLedger(input.ledger);
  return state;
}

export const publicState=state=>({version:state.version,conversation:state.conversation,title:state.title,updates:state.updates});
