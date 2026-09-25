import assert from 'node:assert/strict';
import {mkdtemp,readdir,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {get} from 'node:http';
import {startCompanion} from './field.mjs';
import {appendUpdate,validateUpdate,validateState} from '../docs/site/continuity.mjs';
import {numericTween} from '../docs/site/movement.mjs';

const make=(conversation,sequence)=>({version:1,conversation,sequence,title:'Shared inquiry',
  source:{kind:'participant',producer:'Test participant',turn:'turn-'+sequence},
  coverage:{early:'summarized',middle:'available',late:'available',basis:['summary','verbatim'],gaps:'Opening available as a summary.'},
  spec:{primary:'violet',secondary:'teal',form:sequence%2?'mantle':'sweep',history:.6,
    // Epistemic texture must survive the live publish path, not only the browser.
    grounding:sequence%2?.4:1},transition:'settle'});
const ledger={phases:[{name:'Opening',references:['turn-1'],note:'An open, careful inquiry.'}],open_questions:['How should continuity unfold?'],direction:'Explore the next expression.'};
const storage=await mkdtemp(join(tmpdir(),'field-continuity-'));
let app=await startCompanion({port:0,data:storage});
const publish=async(update,context,headers={})=>fetch(app.url+'/api/publish',{method:'POST',
  headers:{'Content-Type':'application/json','X-Field-Client':'4.5',...headers},body:JSON.stringify({update,ledger:context})});
try {
  const blank=await (await fetch(app.url+'/api/status')).json();assert.deepEqual(blank.conversations,[]);
  assert.equal((await publish(make('a',1),ledger)).status,201);
  const first=await (await fetch(app.url+'/api/state?conversation=a')).json();
  assert.equal(first.updates[0].spec.grounding,.4,'grounding must survive publication');
  assert.equal(first.updates.length,1);assert.equal(first.ledger,undefined);
  assert.deepEqual((await (await fetch(app.url+'/api/context?conversation=a')).json()).ledger,ledger);
  assert.equal((await publish(make('a',1))).status,409);
  assert.equal((await publish({...make('a',2),spec:{tension:9}})).status,400);
  assert.equal((await publish({...make('a',2),source:{...make('a',2).source,kind:'scripted'}})).status,400);
  assert.equal((await publish(make('a',2),undefined,{'X-Field-Client':'wrong'})).status,403);
  assert.equal((await publish(make('a',2),undefined,{Origin:'https://example.org'})).status,403);
  assert.equal(await new Promise((resolve,reject)=>get(app.url+'/api/status',{headers:{Host:'hostile.example'}},r=>{r.resume();resolve(r.statusCode);}).on('error',reject)),403);
  assert.equal((await fetch(app.url+'/%2e%2e%2fSKILL.md')).status,404);
  assert.equal((await publish(make('b',1))).status,201);
  const controller=new AbortController();
  const response=await fetch(app.url+'/api/events?conversation=a',{signal:controller.signal});
  const reader=response.body.getReader(),decoder=new TextDecoder();
  assert(decoder.decode((await reader.read()).value).includes('"conversation":"a"'));
  assert.equal((await publish(make('b',2))).status,201);
  const racing=await Promise.all([publish(make('a',2)),publish(make('a',2))]);
  assert.deepEqual(racing.map(x=>x.status).sort(),[201,409]);
  const event=decoder.decode((await reader.read()).value);
  assert(event.includes('"sequence":2'));assert(!event.includes('"conversation":"b"'));
  controller.abort();await reader.cancel().catch(()=>{});
  assert.equal((await publish(make('../../outside',1))).status,201);
  const files=await readdir(storage);assert.equal(files.filter(x=>x.endsWith('.json')).length,3);
  for(const file of files) {const state=validateState(JSON.parse(await readFile(join(storage,file),'utf8')));assert(state.updates.length>0);}
  await app.close();app=await startCompanion({port:0,data:storage});
  const restored=await (await fetch(app.url+'/api/context?conversation=a')).json();
  assert.equal(restored.updates.at(-1).sequence,2);assert.deepEqual(restored.ledger,ledger);
  assert.equal((await publish(make('a',1))).status,409);
  let rolling=null;
  for(let sequence=1;sequence<=85;sequence++)rolling=appendUpdate(rolling,make('long',sequence),sequence===1?ledger:undefined);
  assert.equal(rolling.updates.length,80);assert.equal(rolling.updates[0].sequence,6);assert.deepEqual(rolling.ledger,ledger);
  assert.throws(()=>appendUpdate(rolling,make('another',90)),/different conversation/);
  assert.throws(()=>validateUpdate({...make('a',3),coverage:{}}),/coverage/);
  assert.throws(()=>validateUpdate({...make('a',3),unexpected:'ignored?'}),/Unknown/);
  const tween=numericTween('M1,2 C3,4 5,6 7,8','M11,12 C13,14 15,16 17,18');
  assert.equal(tween(0),'M1,2 C3,4 5,6 7,8');assert.equal(tween(1),'M11,12 C13,14 15,16 17,18');
  assert.equal(tween(.5),'M6.000,7.000 C8.000,9.000 10.000,11.000 12.000,13.000');
  assert.equal(numericTween('M1,2','L1,2'),null);
  console.log('Passed: publication, validation, isolated streams, durable restart, atomic sequence conflicts, local request boundary, bounded history, retained ledger, and curve endpoints.');
} finally {await app.close();await rm(storage,{recursive:true,force:true});}
