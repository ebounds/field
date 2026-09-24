// Motion uses the canonical SVG's corresponding curves and materials.
// The capsule never moves. Rendering stops when a transition has settled.
import {render,geometry,pointsPath,PALETTE,toOklab,oklabHex} from './renderer.mjs';

const NS='http://www.w3.org/2000/svg';
const numbers=/-?(?:\d*\.\d+|\d+\.?\d*)(?:e[+-]?\d+)?/gi;
const clamp=x=>Math.max(0,Math.min(1,x));
const smooth=x=>{x=clamp(x);return x*x*(3-2*x);};
const durations={gather:3600,reach:4600,hold:6200,settle:5200,return:5600,reorient:3400};
const numeric=new Set(['d','cx','cy','rx','ry','x','y','x1','x2','y1','y2','width','height','stroke-width',
  'opacity','stdDeviation','transform','stop-opacity','offset']);

export function numericTween(from,to) {
  const a=from.match(numbers)?.map(Number),b=to.match(numbers)?.map(Number);
  if(!a||!b||a.length!==b.length||from.replace(numbers,'#')!==to.replace(numbers,'#')) return null;
  const parts=to.split(numbers); // This regex has no capture groups.
  const differences=b.map((v,i)=>v-a[i]);
  return t=>{
    if(t>=1) return to;
    if(t<=0) return from;
    let value=parts[0];
    for(let i=0;i<b.length;i++) value+=(a[i]+differences[i]*t).toFixed(3)+parts[i+1];
    return value;
  };
}

function element(tag,attributes={}) {
  const el=document.createElementNS(NS,tag);
  for(const [key,value] of Object.entries(attributes)) el.setAttribute(key,value);
  return el;
}

export function compositionSVG(update,previous) {
  const svg=new DOMParser().parseFromString(render(update.spec),'image/svg+xml').documentElement;
  if(previous&&update.spec.history>0) {
    const current=geometry(update.spec),past=geometry(previous.spec),h=update.spec.history;
    const us=Array.from({length:97},(_,i)=>i/96);
    const location=(u,f)=>{
      const target=current.surface(u,f),old=past.surface(u,f);
      const influence=.62*h*Math.sin(Math.PI*u)**1.7;
      return target.map((x,i)=>x*(1-influence)+old[i]*influence);
    };
    const outer=us.map(u=>location(u,.08));
    const inner=us.map(u=>location(u,.08+.19*Math.sin(Math.PI*u)));
    const path=pointsPath(outer)+' '+pointsPath(inner.reverse()).replace('M','L')+' Z';
    const ink=element('linearGradient',{id:'retained-ink',x1:'0',y1:'1',x2:'1',y2:'0'});
    for(const [offset,color] of [[0,previous.spec.primary],[.5,previous.spec.secondary||previous.spec.primary],[1,update.spec.primary]])
      ink.append(element('stop',{offset,'stop-color':PALETTE[color]}));
    svg.querySelector('defs').append(ink);
    const group=svg.querySelector('#field-history');
    group.setAttribute('data-trace-source',String(previous.sequence));
    group.replaceChildren(element('path',{d:path,fill:'url(#retained-ink)',filter:'url(#field-diffuse)'}),
      element('path',{d:pointsPath(outer),fill:'none',stroke:PALETTE[previous.spec.primary],'stroke-width':'.9',opacity:'.32'}));
  }
  const coverage=element('metadata',{id:'field-coverage'});
  coverage.textContent=JSON.stringify({synthesis_version:'3.2',scope:'whole_available_conversation',
    source_basis:update.coverage.basis,phase_coverage:Object.fromEntries(['early','middle','late'].map(k=>[k,update.coverage[k]])),material_gaps:update.coverage.gaps});
  const provenance=element('metadata',{id:'field-continuity'});
  provenance.textContent=JSON.stringify({version:1,conversation:update.conversation,sequence:update.sequence,
    source:update.source,at:update.at,transition:update.transition,
    previous:previous&&update.spec.history>0?{sequence:previous.sequence,spec:previous.spec}:null});
  svg.append(coverage,provenance);
  return svg;
}

function indexTree(root) {
  const indexed=new Map();
  function walk(el,parentKey='') {
    const key=el.id?'#'+el.id:parentKey;
    indexed.set(key,el);
    const counts=new Map();
    for(const child of el.children) {
      if(child.id) walk(child,key);
      else {const count=counts.get(child.tagName)||0;counts.set(child.tagName,count+1);walk(child,key+'/'+child.tagName+':'+count);}
    }
  }
  walk(root,'svg');return indexed;
}

export class FieldMovement {
  constructor(container,{onSettled=()=>{}}={}) {
    this.container=container;this.onSettled=onSettled;this.enabled=true;this.frame=0;this.target=null;
    this.reduced=matchMedia('(prefers-reduced-motion: reduce)');
    this.onPreference=()=>{if(this.reduced.matches)this.finish();};
    this.reduced.addEventListener('change',this.onPreference);
    this.onVisibility=()=>{if(document.hidden)this.finish();};
    document.addEventListener('visibilitychange',this.onVisibility);
  }
  setEnabled(value) {this.enabled=value;if(!value)this.finish();}
  finish() {
    cancelAnimationFrame(this.frame);this.frame=0;
    if(this.target) this.container.replaceChildren(this.target.cloneNode(true));
    this.container.dataset.moving='false';this.onSettled();
  }
  show(update,previous,{immediate=false}={}) {
    cancelAnimationFrame(this.frame);this.frame=0;
    const target=compositionSVG(update,previous),before=this.container.querySelector('svg');
    this.target=target.cloneNode(true);
    if(!before||immediate||!this.enabled||this.reduced.matches||document.hidden) {this.finish();return;}
    const oldMap=indexTree(before),newMap=indexTree(target),tweens=[];
    // Missing material gently enters or leaves; shared paths retain correspondence.
    for(const [key,node] of newMap) {
      const old=oldMap.get(key);
      if(node.closest('metadata')||node.closest('#drone-body')||node.closest('#drone-metal')||node.closest('#drone-rim')) continue;
      if(!old) {
        if(node.parentElement&&oldMap.has([...newMap].find(([,v])=>v===node.parentElement)?.[0])&& !node.closest('defs')) {
          const opacity=Number(node.getAttribute('opacity')??1);node.setAttribute('opacity','0');
          tweens.push({node,name:'opacity',run:t=>String(opacity*t),delay:0});
        }
        continue;
      }
      for(const attribute of [...node.attributes]) {
        const name=attribute.name,to=attribute.value,from=old.getAttribute(name);
        if(from===null||from===to) continue;
        let run;
        if(/^#[0-9a-f]{6}$/i.test(from)&&/^#[0-9a-f]{6}$/i.test(to)) {
          const a=toOklab(from),b=toOklab(to),colors=Array.from({length:65},(_,i)=>oklabHex(a.map((v,j)=>v+(b[j]-v)*i/64)));
          run=t=>colors[Math.min(64,Math.round(t*64))];
        } else if(numeric.has(name)) run=numericTween(from,to);
        if(run) {
          const delay=node.closest('#field-history') ? .10 : 0;
          tweens.push({node,name,run,delay});node.setAttribute(name,run(0));
        }
      }
    }
    const oldKeys=new Map([...oldMap].map(([k,n])=>[n,k]));
    for(const [key,node] of oldMap) {
      if(newMap.has(key)||node.closest('defs')||node.closest('metadata')) continue;
      const parent=newMap.get(oldKeys.get(node.parentElement));
      if(!parent) continue;
      const ghost=node.cloneNode(true),opacity=Number(ghost.getAttribute('opacity')??1);
      ghost.removeAttribute('id');parent.append(ghost);
      tweens.push({node:ghost,name:'opacity',run:t=>String(opacity*(1-t)),delay:0});
    }
    if(!tweens.length) {this.finish();return;}
    this.container.replaceChildren(target);this.container.dataset.moving='true';
    const duration=durations[update.transition],start=performance.now();let last=-Infinity;
    const draw=now=>{
      const elapsed=(now-start)/duration;
      if(elapsed>=1) {this.finish();return;}
      if(now-last>=1000/24) {
        for(const item of tweens) {
          let t=smooth((elapsed-item.delay)/(1-item.delay));
          if(update.transition==='gather') t=1-(1-t)**1.25;
          if(update.transition==='hold') t=t*t;
          item.node.setAttribute(item.name,item.run(t));
        }
        last=now;
      }
      this.frame=requestAnimationFrame(draw);
    };
    this.frame=requestAnimationFrame(draw);
  }
  snapshot() {return this.target?new XMLSerializer().serializeToString(this.target):'';}
  dispose() {cancelAnimationFrame(this.frame);this.reduced.removeEventListener('change',this.onPreference);document.removeEventListener('visibilitychange',this.onVisibility);}
}
