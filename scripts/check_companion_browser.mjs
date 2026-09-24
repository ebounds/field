// Browser checks using Chrome's DevTools pipe; no npm packages.
// CHROME_BIN=/path/to/chromium node scripts/check_companion_browser.mjs [URL] [screenshots]
import {spawn} from 'node:child_process';
import {mkdtemp, mkdir, readFile, writeFile, readdir, rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import assert from 'node:assert/strict';

const url = process.argv[2] || 'http://127.0.0.1:8767/';
const screenshots = process.argv[3];
const temp = await mkdtemp(join(tmpdir(),'field-browser-'));
const downloads = join(temp,'downloads');
await mkdir(downloads);
if(screenshots) await mkdir(screenshots,{recursive:true});
const browser = spawn(process.env.CHROME_BIN || 'chromium',[
  '--headless','--no-sandbox','--disable-dev-shm-usage','--remote-debugging-pipe',
  '--user-data-dir='+join(temp,'profile'),'about:blank'
],{stdio:['ignore','ignore','pipe','pipe','pipe']});
let sequence=0,buffer='',session,stderr='';
const pending=new Map(), errors=[];
browser.stderr.on('data',chunk=>{stderr+=chunk;});
browser.on('error',error=>{for(const item of pending.values()) item.reject(error);});
browser.stdio[4].on('data',chunk=>{
  buffer+=chunk.toString();
  let end;
  while((end=buffer.indexOf('\0'))>=0) {
    const data=JSON.parse(buffer.slice(0,end)); buffer=buffer.slice(end+1);
    if(data.id&&pending.has(data.id)) {
      const {resolve,reject,timer}=pending.get(data.id); pending.delete(data.id); clearTimeout(timer);
      if(data.error) reject(new Error(JSON.stringify(data.error))); else resolve(data.result);
    }
    if(data.method==='Runtime.exceptionThrown') errors.push(data.params.exceptionDetails);
    if(data.method==='Network.responseReceived'&&data.params.response.status>=400) errors.push(data.params.response.url+': '+data.params.response.status);
  }
});
function command(method,params={},useSession=true) {
  return new Promise((resolve,reject)=>{
    const id=++sequence;
    const timer=setTimeout(()=>{pending.delete(id);reject(new Error(method+' timed out. '+stderr.slice(-500)));},15000);
    pending.set(id,{resolve,reject,timer});
    browser.stdio[3].write(JSON.stringify({id,method,params,...(session&&useSession?{sessionId:session}:{})})+'\0');
  });
}
async function evaluate(expression) {
  const data=await command('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});
  if(data.exceptionDetails) throw new Error(JSON.stringify(data.exceptionDetails));
  return data.result.value;
}
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function waitFor(expression) {
  for(let i=0;i<80;i++){if(await evaluate(expression)) return;await pause(100);}
  throw new Error('Condition timed out: '+expression);
}
async function spec() { return evaluate("JSON.parse(document.querySelector('#field-spec').textContent)"); }
async function screenshot(name) {
  if(!screenshots) return;
  const shot=await command('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});
  await writeFile(join(screenshots,name+'.png'),Buffer.from(shot.data,'base64'));
}
async function navigate(target) {
  await command('Page.navigate',{url:target});
  await waitFor("document.readyState==='complete' && document.querySelector('#field-stage svg')");
}
async function click(selector) {
  const box=await evaluate(`(()=>{const el=document.querySelector(${JSON.stringify(selector)});el.scrollIntoView({block:'center',behavior:'instant'});const r=el.getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2};})()`);
  await command('Input.dispatchMouseEvent',{type:'mousePressed',...box,button:'left',clickCount:1});
  await command('Input.dispatchMouseEvent',{type:'mouseReleased',...box,button:'left',clickCount:1});
}

const {startCompanion}=await import('./field.mjs');
let liveApp=await startCompanion({port:0,data:join(temp,'state')});
const update=(conversation,sequence,primary='violet')=>({version:1,conversation,sequence,title:conversation==='a'?'A continuing inquiry':'Another conversation',source:{producer:'Browser test',kind:'participant',turn:'turn-'+sequence},coverage:{early:'summarized',middle:'available',late:'available',basis:['summary','verbatim'],gaps:'Opening available in summary.'},spec:{form:sequence%2?'mantle':'sweep',primary,secondary:'teal',history:.7,openness:.7,breadth:.75},transition:'settle'});
async function publish(conversation,sequence,primary) {
  const response=await fetch(liveApp.url+'/api/publish',{method:'POST',headers:{'Content-Type':'application/json','X-Field-Client':'4.5'},body:JSON.stringify({update:update(conversation,sequence,primary)})});
  assert.equal(response.status,201);
}
async function currentSequence() {return evaluate("JSON.parse(document.querySelector('#field-continuity').textContent).sequence");}
async function waitSequence(value) {await waitFor(`document.querySelector('#field-continuity') && JSON.parse(document.querySelector('#field-continuity').textContent).sequence===${value}`);}

try {
  const target=await command('Target.createTarget',{url:'about:blank'},false);
  const attached=await command('Target.attachToTarget',{targetId:target.targetId,flatten:true},false);session=attached.sessionId;
  await command('Page.enable');await command('Runtime.enable');await command('Network.enable');
  await command('Page.addScriptToEvaluateOnNewDocument',{source:`
    window.audioAudit={contexts:[],starts:0};
    const Native=window.AudioContext;
    window.AudioContext=class extends Native {
      constructor(...args){super(...args);window.audioAudit.contexts.push(this);}
      createBufferSource(){const source=super.createBufferSource(),start=source.start.bind(source);source.start=(...args)=>{window.audioAudit.starts++;return start(...args)};return source;}
    };
  `});
  await command('Browser.setDownloadBehavior',{behavior:'allow',downloadPath:downloads},false);
  await command('Emulation.setDeviceMetricsOverride',{width:1440,height:1080,deviceScaleFactor:1,mobile:false});
  await navigate(new URL('companion.html',url).href);
  assert((await evaluate("document.querySelector('#connection').textContent")).includes('Scripted'));
  assert.equal(await currentSequence(),1);assert.equal(await evaluate('window.audioAudit.contexts.length'),0);
  await screenshot('companion-desktop');
  await click('#next-study');await waitSequence(2);
  assert.equal(await evaluate("document.querySelector('#field-stage').dataset.moving"),'true');
  await pause(2100);await screenshot('companion-in-motion');
  assert.equal(await evaluate("document.querySelector('#drone-body rect').getAttribute('x')"),'436');
  assert.equal(await evaluate("document.querySelector('#drone-body rect').getAttribute('width')"),'128');
  assert.equal(await evaluate("document.querySelector('#field-history').getAttribute('data-trace-source')"),'1');
  assert.equal(await evaluate("document.querySelector('#field-stage').innerHTML.includes('NaN')"),false);
  await waitFor("document.querySelector('#field-stage').dataset.moving==='false'");
  await click('#save-field');
  for(let i=0;i<80;i++){if((await readdir(downloads)).includes('field-continuity.svg'))break;await pause(100);}
  const saved=await readFile(join(downloads,'field-continuity.svg'),'utf8');
  assert(saved.includes('field-coverage')&&saved.includes('field-continuity')&&saved.includes('data-trace-source="1"'));
  await click('#movement');await click('#next-study');await waitSequence(3);
  assert.equal(await evaluate("document.querySelector('#field-stage').dataset.moving"),'false');
  await click('#replay');assert.equal(await currentSequence(),1);await click('#replay');assert.equal(await currentSequence(),3);
  await command('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});
  await evaluate('window.scrollTo(0,0)');await screenshot('companion-phone');
  assert.equal(await evaluate('document.documentElement.scrollWidth<=innerWidth'),true);
  await click('#listening summary');await screenshot('companion-phone-listening');
  assert.equal(await evaluate('window.audioAudit.contexts.length'),0);
  await command('Emulation.setDeviceMetricsOverride',{width:320,height:740,deviceScaleFactor:1,mobile:true});
  assert.equal(await evaluate('document.documentElement.scrollWidth<=innerWidth'),true);
  await command('Emulation.setDeviceMetricsOverride',{width:1440,height:1080,deviceScaleFactor:1,mobile:false});
  // A real local publication stream, with restoration and isolation.
  await command('Page.navigate',{url:liveApp.url+'/companion.html?mode=live&conversation=a'});
  await waitFor("document.readyState==='complete' && document.querySelector('#connection').textContent.includes('waiting for the first')");
  assert.equal(await evaluate("document.querySelector('#listen').disabled"),true);
  await publish('a',1);await waitSequence(1);
  assert.equal((await spec()).primary,'violet');
  await publish('a',2,'amber');await waitSequence(2);
  await click('#movement'); // Browser preference is scoped to the companion origin.
  await waitFor("document.querySelector('#field-stage').dataset.moving==='false'");
  await screenshot('companion-live');
  await navigate(liveApp.url+'/companion.html?mode=live&conversation=a');
  await waitSequence(2);assert.equal(await evaluate('window.audioAudit.contexts.length'),0);
  assert.equal(await evaluate("document.querySelectorAll('#history-list button').length"),2);
  await publish('b',1,'blue');await click('#refresh-conversations');
  await waitFor("Array.from(document.querySelector('#conversation').options).some(x=>x.value==='b')");
  await evaluate("document.querySelector('#conversation').value='b';document.querySelector('#conversation').dispatchEvent(new Event('change'))");
  await waitFor("JSON.parse(document.querySelector('#field-continuity')?.textContent||'{}').conversation==='b'");
  assert.equal((await spec()).primary,'blue');assert.equal(await evaluate("document.querySelector('#field-history').hasAttribute('data-trace-source')"),false);
  await publish('a',3,'coral');await pause(200);assert.equal((await spec()).primary,'blue');
  await evaluate("document.querySelector('#conversation').value='a';document.querySelector('#conversation').dispatchEvent(new Event('change'))");
  await waitSequence(3);
  await click('#history-list button');await waitSequence(1);
  await publish('a',4,'teal');await pause(200);assert.equal(await currentSequence(),1);
  assert.equal(await evaluate("document.querySelector('#return-current').hidden"),false);
  await click('#return-current');await waitSequence(4);
  await command('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
  await publish('a',5,'pearl');await waitSequence(5);
  assert.equal(await evaluate("document.querySelector('#movement').disabled"),true);
  assert.equal(await evaluate("document.querySelector('#field-stage').dataset.moving"),'false');
  await click('#listening summary');await click('#listen');
  await waitFor("document.querySelector('#listen').textContent==='Stop listening'");
  assert.equal(await evaluate('window.audioAudit.starts'),1);
  await evaluate("document.querySelector('#conversation').value='b';document.querySelector('#conversation').dispatchEvent(new Event('change'))");
  await waitFor("JSON.parse(document.querySelector('#field-continuity')?.textContent||'{}').conversation==='b'");
  assert.equal(await evaluate("document.querySelector('#listen').textContent"),'Listen');
  assert.equal(await evaluate('window.audioAudit.starts'),1);
  const port=liveApp.server.address().port;
  await liveApp.close();
  await waitFor("document.querySelector('#connection').dataset.state==='offline'");
  assert.equal((await spec()).primary,'blue');
  liveApp=await startCompanion({port,data:join(temp,'state')});
  await waitFor("document.querySelector('#connection').textContent.startsWith('Connected')");
  await publish('b',2,'amber');await waitSequence(2);assert.equal((await spec()).primary,'amber');
  await click('.inspection summary');await click('#save-history');
  for(let i=0;i<80;i++){if((await readdir(downloads)).includes('field-history.json'))break;await pause(100);}
  const history=JSON.parse(await readFile(join(downloads,'field-history.json'),'utf8'));
  assert.equal(history.conversation,'b');assert.equal(history.updates.length,2);assert.equal(history.ledger,undefined);
  assert.deepEqual(errors,[]);
  console.log('Passed: scripted movement and real retained contour, fixed capsule, still/reduced motion, replay, SVG/history export, phone layouts, live publishing, isolated conversations, restore/reconnect, freshness, and optional audio.');
} finally {
  await command('Browser.close',{},false).catch(()=>{});browser.kill();
  for(const item of pending.values())clearTimeout(item.timer);
  await liveApp.close();await pause(200);await rm(temp,{recursive:true,force:true,maxRetries:3});
}
