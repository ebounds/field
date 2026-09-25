// Browser checks using Chrome's DevTools pipe; no npm packages.
// CHROME_BIN=/path/to/chromium node scripts/check_public_site.mjs [URL] [screenshots]
import {spawn} from 'node:child_process';
import {mkdtemp, mkdir, readFile, writeFile, readdir, rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import assert from 'node:assert/strict';

const url = process.argv[2] || 'http://127.0.0.1:8765/';
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
async function spec() {
  await waitFor("document.querySelector('#field-image')?.src.startsWith('blob:')");
  return evaluate("(async()=>{await document.querySelector('#field-image').decode(); const svg=await (await fetch(document.querySelector('#field-image').src)).text();return JSON.parse(new DOMParser().parseFromString(svg,'image/svg+xml').querySelector('#field-spec').textContent);})()");
}
async function settle() { await pause(180); return spec(); }
async function screenshot(name) {
  if(!screenshots) return;
  const shot=await command('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});
  await writeFile(join(screenshots,name+'.png'),Buffer.from(shot.data,'base64'));
}
async function navigate(target) {
  await command('Page.navigate',{url:target});
  await waitFor("document.readyState==='complete' && document.querySelector('#field-image')?.src.startsWith('blob:')");
}
async function click(selector) {
  const box=await evaluate(`(()=>{const el=document.querySelector(${JSON.stringify(selector)});el.scrollIntoView({block:'center',behavior:'instant'});const r=el.getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2};})()`);
  await command('Input.dispatchMouseEvent',{type:'mousePressed',...box,button:'left',clickCount:1});
  await command('Input.dispatchMouseEvent',{type:'mouseReleased',...box,button:'left',clickCount:1});
}

try {
  const target=await command('Target.createTarget',{url:'about:blank'},false);
  const attached=await command('Target.attachToTarget',{targetId:target.targetId,flatten:true},false);
  session=attached.sessionId;
  await command('Page.enable'); await command('Runtime.enable'); await command('Network.enable');
  await command('Page.addScriptToEvaluateOnNewDocument',{source:`
    window.audioAudit={contexts:[],starts:0,stops:0};
    const NativeAudioContext=window.AudioContext;
    window.AudioContext=class extends NativeAudioContext {
      constructor(...args){super(...args);window.audioAudit.contexts.push(this);}
      createBufferSource(){
        const source=super.createBufferSource(),start=source.start.bind(source),stop=source.stop.bind(source);
        source.start=(...args)=>{window.audioAudit.starts++;window.audioAudit.source=source;return start(...args);};
        source.stop=(...args)=>{window.audioAudit.stops++;return stop(...args);};
        return source;
      }
    };
  `});
  await command('Browser.setDownloadBehavior',{behavior:'allow',downloadPath:downloads},false);
  await command('Emulation.setDeviceMetricsOverride',{width:1440,height:1000,deviceScaleFactor:1,mobile:false});
  await navigate(url);
  assert.equal((await spec()).form,'sweep');
  await screenshot('field-site-desktop');
  await evaluate("document.querySelector('#playground').scrollIntoView({behavior:'instant'})");
  await screenshot('field-site-playground');
  await evaluate("document.querySelector('input[name=form][value=mantle]').click()");
  assert.equal((await settle()).form,'mantle');
  await evaluate("document.querySelector('#tension').value='.95';document.querySelector('#tension').dispatchEvent(new Event('input',{bubbles:true}))");
  assert.equal((await settle()).tension,.95);
  await evaluate("document.querySelector('[data-color=amber]').click()");
  assert.equal((await settle()).primary,'amber');
  await evaluate("document.querySelector('#study').value='integrated';document.querySelector('#study').dispatchEvent(new Event('change',{bubbles:true}))");
  const original=await settle();
  assert.equal(original.history,.65); assert.equal(original.form,'envelope');
  await evaluate("Object.defineProperty(navigator,'clipboard',{value:{writeText:async text=>{window.copiedText=text}},configurable:true});document.querySelector('#share').click()");
  const shared=await evaluate('location.href');
  assert(shared.includes('#field='));
  assert.equal(await evaluate('window.copiedText'),shared);
  await navigate(shared);
  assert.deepEqual(await spec(),original);
  await evaluate("document.querySelector('#spec-input').value='{} broken';document.querySelector('#import-spec').click()");
  assert((await evaluate("document.querySelector('#status').textContent")).includes('Could not load'));
  assert.deepEqual(await spec(),original);
  await evaluate("document.querySelector('#spec-input').value=JSON.stringify({form:'mantle',primary:'coral',counterpoint:.8});document.querySelector('#import-spec').click()");
  assert.equal((await settle()).primary,'coral');
  await evaluate("document.querySelector('#save-svg').click();document.querySelector('#save-png').click()");
  for(let i=0;i<80;i++){if((await readdir(downloads)).includes('field-4.4.png')) break;await pause(100);}
  const png=await readFile(join(downloads,'field-4.4.png'));
  assert.equal(png.readUInt32BE(16),2000);assert.equal(png.readUInt32BE(20),2000);
  const svg=await readFile(join(downloads,'field-4.4.svg'),'utf8');
  assert(svg.includes('"primary":"coral"')&&!svg.includes('NaN'));
  await evaluate("Object.defineProperty(navigator,'clipboard',{value:{writeText:async text=>{window.copiedText=text}},configurable:true});document.querySelector('#copy-prompt').click()");
  assert((await evaluate('window.copiedText')).includes('whole available conversation'));
  // Real Web Audio playback under trusted gestures, with no sound on load or export.
  assert.equal(await evaluate('window.audioAudit.contexts.length'),0);
  await click('#listening summary');
  assert.equal(await evaluate('window.audioAudit.contexts.length'),0);
  await click('#save-audio');
  await waitFor("document.querySelector('#audio-status').textContent.startsWith('Saved')");
  assert.equal(await evaluate('window.audioAudit.contexts.length'),0);
  for(let i=0;i<80;i++){if((await readdir(downloads)).includes('field-listening.wav')) break;await pause(100);}
  const wav=await readFile(join(downloads,'field-listening.wav'));
  assert.equal(wav.readUInt32LE(24),44100);assert.equal(wav.readUInt16LE(22),2);
  assert.equal(wav.readUInt32LE(40),24*44100*4);
  const info=44+24*44100*4;
  const metadata=JSON.parse(wav.toString('utf8',info+20,info+20+wav.readUInt32LE(info+16)-1));
  assert.deepEqual(metadata.spec,await spec());
  await click('#listen');
  await waitFor("document.querySelector('#listen').textContent==='Stop listening'");
  assert.equal(await evaluate('window.audioAudit.starts'),1);
  assert.equal(await evaluate('window.audioAudit.contexts[0].state'),'running');
  await evaluate("document.querySelector('#audio-volume').value='0';document.querySelector('#audio-volume').dispatchEvent(new Event('input',{bubbles:true}))");
  assert.equal(await evaluate("document.querySelector('#audio-volume-value').textContent"),'0%');
  await evaluate("document.querySelector('input[name=form][value=sweep]').click()");
  assert((await evaluate("document.querySelector('#audio-status').textContent")).includes('next listen'));
  assert.equal(await evaluate('window.audioAudit.starts'),1);
  await screenshot('field-listening-desktop');
  await click('#listening summary');
  await waitFor("document.querySelector('#listen').textContent==='Listen'");
  assert.equal(await evaluate('window.audioAudit.stops'),1);
  await pause(180);
  assert.equal(await evaluate('window.audioAudit.contexts[0].state'),'suspended');
  await click('#listening summary');
  // Cancel while a new render is still running; stale work must never start sound.
  await click('#listen');
  await click('#listen');
  await pause(1300);
  assert.equal(await evaluate('window.audioAudit.starts'),1);
  assert.equal(await evaluate("document.querySelector('#listen').textContent"),'Listen');
  await click('#listen');
  await waitFor("document.querySelector('#listen').textContent==='Stop listening'");
  assert.equal(await evaluate('window.audioAudit.starts'),2);
  await evaluate('window.audioAudit.source.playbackRate.value=32');
  await waitFor("document.querySelector('#audio-status').textContent.startsWith('Returned to silence')");
  assert.equal(await evaluate("document.querySelector('#audio-progress').value"),24);
  assert.equal(await evaluate('window.audioAudit.contexts[0].state'),'suspended');
  // Reusing a cached render restores its waveform; device suspension requires a new gesture.
  await evaluate("document.querySelector('#reset').click()");
  await settle();
  await click('#listen');
  await waitFor("document.querySelector('#listen').textContent==='Stop listening'");
  await click('#listen');
  await evaluate("document.querySelector('#reset').click()");
  await settle();
  await click('#listen');
  await waitFor("document.querySelector('#listen').textContent==='Stop listening'");
  assert.equal(await evaluate("document.querySelector('#audio-wave').children.length"),80);
  await evaluate('window.audioAudit.contexts[0].suspend()');
  await waitFor("document.querySelector('#audio-status').textContent.startsWith('Audio was interrupted')");
  assert.equal(await evaluate("document.querySelector('#listen').textContent"),'Listen');
  await command('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});
  await navigate(url);
  await screenshot('field-site-phone');
  assert.equal(await evaluate('document.documentElement.scrollWidth<=innerWidth'),true);
  await evaluate("document.querySelector('#playground').scrollIntoView({behavior:'instant'})");
  await screenshot('field-site-phone-playground');
  await click('#listening summary');
  await screenshot('field-listening-phone');
  assert.equal(await evaluate('document.documentElement.scrollWidth<=innerWidth'),true);
  await evaluate("document.querySelector('#controls').scrollIntoView({behavior:'instant'})");
  await screenshot('field-site-phone-controls');
  assert.equal(await evaluate("getComputedStyle(document.querySelector('.control-preview')).display"),'flex');
  await evaluate("document.querySelector('#openness').focus()");
  const before=(await spec()).openness;
  await command('Input.dispatchKeyEvent',{type:'keyDown',key:'ArrowLeft',code:'ArrowLeft',windowsVirtualKeyCode:37});
  await command('Input.dispatchKeyEvent',{type:'keyUp',key:'ArrowLeft',code:'ArrowLeft',windowsVirtualKeyCode:37});
  assert.equal((await settle()).openness,Math.round((before-.01)*100)/100);
  await command('Emulation.setDeviceMetricsOverride',{width:320,height:740,deviceScaleFactor:1,mobile:true});
  assert.equal(await evaluate('document.documentElement.scrollWidth<=innerWidth'),true);
  await navigate(url+'#field=broken');
  assert.equal((await spec()).form,'sweep');
  assert((await evaluate("document.querySelector('#status').textContent")).includes('could not be read'));
  const local=await evaluate("Array.from(document.querySelectorAll('a[href],img[src],script[src],link[href]')).map(el=>el.href||el.src).filter(value=>value&&value.startsWith(location.origin)&&!value.includes('#'))");
  for(const link of new Set(local)) {const response=await fetch(link,{method:'HEAD'});assert(response.ok,link+': '+response.status);}
  assert.deepEqual(errors,[]);
  console.log('Passed: desktop/mobile layout, visual controls, share round trip, imports, SVG/PNG/WAV exports, opt-in audio, real playback, volume, cancellation, snapshot semantics, natural ending, cleanup, keyboard, links, and no browser errors.');
} finally {
  await command('Browser.close',{},false).catch(()=>{});
  browser.kill();
  for(const item of pending.values()) clearTimeout(item.timer);
  await pause(250);
  await rm(temp,{recursive:true,force:true,maxRetries:3});
}
