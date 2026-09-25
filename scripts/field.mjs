#!/usr/bin/env node
// Field Companion: local persistence, event transport, and an agent publishing command.
// Node.js 18+, standard library only.
import {createServer} from 'node:http';
import {mkdir,readdir,readFile,writeFile,rename,stat} from 'node:fs/promises';
import {resolve,extname,join,sep} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {randomUUID} from 'node:crypto';
import {appendUpdate,conversationId,publicState,validateState,validateUpdate} from '../docs/site/continuity.mjs';

const DOCS=fileURLToPath(new URL('../docs/',import.meta.url));
const types={'.html':'text/html; charset=utf-8','.mjs':'text/javascript; charset=utf-8',
  '.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.png':'image/png',
  '.json':'application/json','.pdf':'application/pdf','.zip':'application/zip','.md':'text/plain; charset=utf-8','.txt':'text/plain; charset=utf-8'};
const failure=(status,message)=>Object.assign(new Error(message),{status});

export async function startCompanion({port=8767,data=resolve('.field'),docs=DOCS}={}) {
  await mkdir(data,{recursive:true,mode:0o700});
  const states=new Map(),streams=new Set();
  for(const file of await readdir(data)) if(file.endsWith('.json')) {
    const path=join(data,file);
    if((await stat(path)).size>2_000_000) throw new Error('Saved Field state is too large: '+file);
    const state=validateState(JSON.parse(await readFile(path,'utf8')));
    if(states.has(state.conversation)) throw new Error('Duplicate saved conversation: '+state.conversation);
    states.set(state.conversation,state);
  }
  let serial=Promise.resolve();
  const send=(response,status,value)=>{
    response.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});
    response.end(JSON.stringify(value));
  };
  const event=(stream,state)=>stream.response.write('event: field\ndata: '+JSON.stringify({state:state?publicState(state):null})+'\n\n');
  const server=createServer(async(request,response)=>{
    try {
      const bound=server.address().port;
      if(!['127.0.0.1:'+bound,'localhost:'+bound].includes(request.headers.host)) throw failure(403,'Use the local Field address.');
      const origin='http://'+request.headers.host;
      if(request.headers.origin&&request.headers.origin!==origin) throw failure(403,'Cross-origin access is not supported.');
      const url=new URL(request.url,origin);
      if(!['GET','HEAD','POST'].includes(request.method)) throw failure(405,'Method not supported.');
      if(request.method==='POST') {
        if(url.pathname!=='/api/publish') throw failure(404,'Unknown operation.');
        if(request.headers['x-field-client']!=='4.5'||request.headers['content-type']?.split(';')[0]!=='application/json')
          throw failure(403,'Use the Field publisher.');
        let length=0;const chunks=[];
        for await(const chunk of request) {
          length+=chunk.length;
          if(length>65536) throw failure(413,'Keep the update under 64 KiB.');
          chunks.push(chunk);
        }
        let body;
        try {body=JSON.parse(Buffer.concat(chunks).toString('utf8'));}
        catch {throw failure(400,'Invalid JSON.');}
        if(!body||typeof body!=='object'||Array.isArray(body)||Object.keys(body).some(k=>!['update','ledger'].includes(k)))
          throw failure(400,'Supply an update and optional continuity ledger.');
        const task=serial.then(async()=>{
          let next;
          try {
            const update=validateUpdate({...body.update,at:new Date().toISOString()});
            if(update.source.kind==='scripted') throw new Error('Scripted studies belong in the demo, not a live conversation.');
            next=appendUpdate(states.get(update.conversation),update,body.ledger);
          } catch(error) {throw failure(/Stale or duplicate/.test(error.message)?409:400,error.message);}
          const filename=Buffer.from(next.conversation).toString('base64url')+'.json';
          const temporary=join(data,filename+'.'+randomUUID()+'.tmp');
          await writeFile(temporary,JSON.stringify(next,null,2)+'\n',{mode:0o600});
          await rename(temporary,join(data,filename));
          states.set(next.conversation,next);
          for(const stream of streams) if(stream.conversation===next.conversation) event(stream,next);
          return next;
        });
        serial=task.catch(()=>{});
        const state=await task;
        send(response,201,{conversation:state.conversation,sequence:state.updates.at(-1).sequence,
          url:origin+'/companion.html?mode=live&conversation='+encodeURIComponent(state.conversation)});
        return;
      }
      if(url.pathname==='/api/status') {
        send(response,200,{version:'4.5.1',conversations:[...states.values()].map(s=>({id:s.conversation,title:s.title,
          sequence:s.updates.at(-1).sequence,at:s.updates.at(-1).at})).sort((a,b)=>b.at.localeCompare(a.at))});return;
      }
      if(url.pathname==='/api/state'||url.pathname==='/api/context') {
        let id;try{id=conversationId(url.searchParams.get('conversation'));}catch(e){throw failure(400,e.message);}
        const state=states.get(id);
        if(!state) throw failure(404,'No expression has been published for this conversation yet.');
        send(response,200,url.pathname==='/api/context'?state:publicState(state));return;
      }
      if(url.pathname==='/api/events'&&request.method==='GET') {
        let id;try{id=conversationId(url.searchParams.get('conversation'));}catch(e){throw failure(400,e.message);}
        response.writeHead(200,{'Content-Type':'text/event-stream','Cache-Control':'no-cache, no-transform',
          Connection:'keep-alive','X-Content-Type-Options':'nosniff'});
        const stream={conversation:id,response};streams.add(stream);event(stream,states.get(id));
        const heartbeat=setInterval(()=>response.write(': connected\n\n'),15000);
        response.on('close',()=>{clearInterval(heartbeat);streams.delete(stream);});return;
      }
      if(url.pathname.startsWith('/api/')) throw failure(404,'Unknown operation.');
      if(url.pathname==='/') {response.writeHead(302,{Location:'/companion.html?mode=live'});response.end();return;}
      let pathname;
      try {pathname=decodeURIComponent(url.pathname);}catch {throw failure(400,'Invalid path.');}
      const path=resolve(docs,'.'+pathname);
      if(!path.startsWith(resolve(docs)+sep)||!types[extname(path)]) throw failure(404,'File not found.');
      let contents;try {contents=await readFile(path);}catch {throw failure(404,'File not found.');}
      response.writeHead(200,{'Content-Type':types[extname(path)],'Content-Length':contents.length,
        'Cache-Control':'no-cache','X-Content-Type-Options':'nosniff'});
      response.end(request.method==='HEAD'?undefined:contents);
    } catch(error) {
      if(!response.headersSent) send(response,error.status??500,{error:error.status?error.message:'The local companion could not complete this request.'});
      else response.end();
    }
  });
  await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(port,'127.0.0.1',resolve);});
  return {url:'http://127.0.0.1:'+server.address().port,server,
    close:async()=>{for(const stream of streams) stream.response.end();server.closeIdleConnections?.();await new Promise(resolve=>server.close(resolve));}};
}

const help=`Field 4.5.1 — a companion for a continuing conversation

  node scripts/field.mjs serve [--port 8767] [--data .field]
  node scripts/field.mjs publish --file update.json [--ledger context.json] [--url http://127.0.0.1:8767]
  node scripts/field.mjs read --conversation ID [--url http://127.0.0.1:8767]
  node scripts/field.mjs validate --file update.json

Read references/continuity-protocol.md for the update format and continuous-use instructions.
The publisher does not read transcripts or make model calls. The participating agent composes each update.
The server stores selected conversations locally. Stop it with Ctrl+C; restart with the same --data to resume.
`;

async function main() {
  const [command,...args]=process.argv.slice(2);
  if(!command||command==='--help'||command==='help') {console.log(help);return;}
  const allowed={serve:['port','data'],publish:['file','ledger','url'],read:['conversation','url'],validate:['file']}[command];
  if(!allowed) throw new Error('Unknown command. Use --help.');
  const options={};
  for(let i=0;i<args.length;i+=2) {
    const name=args[i].slice(2);
    if(!args[i].startsWith('--')||!allowed.includes(name)||!args[i+1]||args[i+1].startsWith('--')||name in options)
      throw new Error('Invalid option. Use --help.');
    options[name]=args[i+1];
  }
  if(command==='serve') {
    const port=Number(options.port??8767);
    if(!Number.isInteger(port)||port<0||port>65535) throw new Error('Choose a valid port.');
    const app=await startCompanion({port,data:resolve(options.data??'.field')});
    console.log('Field Companion: '+app.url+'\nData: '+resolve(options.data??'.field'));
    for(const signal of ['SIGINT','SIGTERM']) process.once(signal,()=>app.close().then(()=>process.exit(0)));
    return;
  }
  if(command==='validate'||command==='publish') {
    if(!options.file) throw new Error('--file update.json is required.');
    const update=validateUpdate(JSON.parse(await readFile(options.file,'utf8')));
    if(command==='validate') {console.log(JSON.stringify(update,null,2));return;}
    const ledger=options.ledger?JSON.parse(await readFile(options.ledger,'utf8')):undefined;
    const result=await request(options.url,'/api/publish',{method:'POST',headers:{'Content-Type':'application/json','X-Field-Client':'4.5'},body:JSON.stringify({update,ledger})});
    console.log(JSON.stringify(result,null,2));return;
  }
  const id=conversationId(options.conversation);
  console.log(JSON.stringify(await request(options.url,'/api/context?conversation='+encodeURIComponent(id)),null,2));
}

async function request(base='http://127.0.0.1:8767',path,options={}) {
  const url=new URL(base);
  if(url.protocol!=='http:'||!['127.0.0.1','localhost'].includes(url.hostname)||url.username||url.password)
    throw new Error('Use a local Field server at http://127.0.0.1:PORT.');
  let response;
  try {response=await fetch(new URL(path,url),{...options,redirect:'error',signal:AbortSignal.timeout(10000)});}
  catch {throw new Error('Could not reach Field Companion. Start it with: node scripts/field.mjs serve');}
  const result=await response.json();
  if(!response.ok) throw new Error(result.error||'Field rejected the request.');
  return result;
}

if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href)
  main().catch(error=>{console.error(error.message);process.exitCode=1;});
