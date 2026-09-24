import {encodeWav, VOICES, DURATION} from './audio.mjs';

// Listening is opt-in. No AudioContext, worker, or sound before a button press.
export function createListening({getSpec,getName,download}) {
  const $=selector=>document.querySelector(selector);
  const panel=$('#listening'),play=$('#listen'),save=$('#save-audio');
  const status=$('#audio-status'),progress=$('#audio-progress'),volume=$('#audio-volume');
  let context,source,gain,worker,pending,cached,cacheKey;
  let request=0,started=0,animation=0,playing=false,rendering=false,exporting=false;
  let snapshotName='',snapshotKey='',changed=false,disposed=false;
  const key=()=>JSON.stringify(getSpec());

  function buttons() {
    play.textContent=rendering?'Cancel':playing?'Stop listening':'Listen';
    play.setAttribute('aria-pressed',String(playing));
    save.disabled=rendering||exporting;
    panel.dataset.playing=String(playing);
  }
  function drawWave(audio) {
    const svg=$('#audio-wave'),ns='http://www.w3.org/2000/svg';
    svg.replaceChildren();
    const bars=80,step=Math.floor(audio.left.length/bars);
    for(let i=0;i<bars;i++) {
      let energy=0;
      for(let j=i*step;j<(i+1)*step;j+=16) energy+=audio.left[j]**2+audio.right[j]**2;
      const height=Math.max(1,Math.min(32,Math.sqrt(energy/(step/16))*120));
      const line=document.createElementNS(ns,'line');
      for(const [name,value] of Object.entries({x1:i*5+2,x2:i*5+2,y1:20-height/2,y2:20+height/2}))
        line.setAttribute(name,value);
      svg.append(line);
    }
  }
  function tick() {
    if(!playing) return;
    const elapsed=Math.min(DURATION,Math.max(0,context.currentTime-started));
    progress.value=elapsed;
    $('#audio-time').textContent=`0:${String(Math.floor(elapsed)).padStart(2,'0')} / 0:24`;
    animation=requestAnimationFrame(tick);
  }
  function cancelRender() {
    if(worker) {worker.terminate();worker=null;}
    if(pending) {pending.reject(new DOMException('Cancelled','AbortError'));pending=null;}
    rendering=false;
  }
  function silence() {
    cancelAnimationFrame(animation);
    if(source) {
      const oldSource=source,oldGain=gain;
      source=null;gain=null;oldSource.onended=null;
      const now=context.currentTime;
      oldGain.gain.cancelScheduledValues(now);
      oldGain.gain.setValueAtTime(oldGain.gain.value,now);
      oldGain.gain.linearRampToValueAtTime(0,now+.08);
      oldSource.stop(now+.09);
      oldSource.onended=()=>{oldSource.disconnect();oldGain.disconnect();};
      // Device interruptions can stop the audio clock before its scheduled end.
      setTimeout(()=>{oldSource.disconnect();oldGain.disconnect();},180);
    }
    playing=false;
    // After the release, free the audio device while keeping it ready for a gesture.
    const idleRequest=request;
    setTimeout(()=>{
      if(context && !playing && !rendering && request===idleRequest && context.state==='running')
        context.suspend().catch(()=>{});
    },130);
  }
  function stop(text='Listening stopped.') {
    ++request;cancelRender();silence();
    exporting=false;progress.value=0;buttons();status.textContent=text;
  }
  function generate(spec) {
    const nextKey=JSON.stringify(spec);
    if(cached&&cacheKey===nextKey) {drawWave(cached);return Promise.resolve(cached);}
    rendering=true;buttons();
    return new Promise((resolve,reject)=>{
      pending={reject};
      try { worker=new Worker(new URL('./audio-worker.mjs',import.meta.url),{type:'module'}); }
      catch(error) {pending=null;rendering=false;buttons();reject(error);return;}
      const finish=()=>{worker?.terminate();worker=null;pending=null;rendering=false;buttons();};
      worker.onmessage=({data})=>{
        finish();
        if(data.error) {reject(new Error(data.error));return;}
        cached=data.audio;cacheKey=nextKey;drawWave(cached);resolve(cached);
      };
      worker.onerror=()=>{finish();reject(new Error('The sound could not be prepared. Please try again.'));};
      worker.postMessage({spec});
    });
  }

  play.addEventListener('click',async()=>{
    if(playing||rendering) {stop();return;}
    const token=++request,spec={...getSpec()};
    snapshotName=getName();snapshotKey=JSON.stringify(spec);changed=false;
    status.textContent='Preparing a listening field…';
    try {
      // Resume synchronously within the gesture, before waiting for the worker.
      if(!context) {
        const nextContext=new AudioContext();context=nextContext;
        nextContext.addEventListener('statechange',()=>{
          if(context===nextContext&&playing&&nextContext.state!=='running')
            stop('Audio was interrupted. Press Listen when you are ready.');
        });
      }
      const resumed=context.resume();
      const [audio]=await Promise.all([generate(spec),resumed]);
      if(token!==request||disposed) return;
      if(context.state!=='running') throw new Error('Audio is paused by the browser. Press Listen again.');
      const buffer=context.createBuffer(2,audio.left.length,audio.sampleRate);
      buffer.copyToChannel(audio.left,0);buffer.copyToChannel(audio.right,1);
      source=context.createBufferSource();gain=context.createGain();
      source.buffer=buffer;gain.gain.value=Number(volume.value);
      source.connect(gain);gain.connect(context.destination);
      source.onended=()=>{
        source?.disconnect();gain?.disconnect();source=null;gain=null;
        playing=false;cancelAnimationFrame(animation);progress.value=DURATION;
        $('#audio-time').textContent='0:24 / 0:24';buttons();
        status.textContent=changed?'The field has changed. Listen again for its new expression.':'Returned to silence. Listen again when you wish.';
        context.suspend().catch(()=>{});
      };
      started=context.currentTime;playing=true;source.start();buttons();tick();
      status.textContent=`Listening to ${snapshotName.toLowerCase()}.${changed?' Changes will sound on the next listen.':''}`;
    } catch(error) {
      if(token!==request||error.name==='AbortError') return;
      stop(error.message||'Listening is unavailable in this browser.');
    }
  });

  save.addEventListener('click',async()=>{
    if(exporting||rendering) return;
    // Export exactly the current field; it never starts or resumes audio playback.
    const spec={...getSpec()},token=++request;
    silence();exporting=true;buttons();status.textContent='Preparing your WAV…';
    try {
      const audio=await generate(spec);
      if(token!==request||disposed) return;
      download(new Blob([encodeWav(audio)],{type:'audio/wav'}),'field-listening.wav');
      status.textContent='Saved 24 seconds of stereo sound, with the Field controls embedded.';
    } catch(error) {
      if(token!==request||error.name==='AbortError') return;
      status.textContent=error.message;
    } finally {if(token===request) {exporting=false;buttons();}}
  });
  volume.addEventListener('input',()=>{
    $('#audio-volume-value').textContent=Math.round(Number(volume.value)*100)+'%';
    if(gain) gain.gain.setTargetAtTime(Number(volume.value),context.currentTime,.025);
  });
  panel.addEventListener('toggle',()=>{
    if(!panel.open&&(playing||rendering)) stop('Listening closed.');
    if(panel.open) panel.closest('.art-column').scrollIntoView({block:'start',behavior:'instant'});
  });
  document.addEventListener('visibilitychange',()=>{
    if(document.hidden&&(playing||rendering)) stop('Listening stopped while you were away.');
  });
  window.addEventListener('pagehide',()=>{stop();context?.close().catch(()=>{});context=null;});
  if(!window.AudioContext||!window.Worker) {
    play.disabled=true;save.disabled=true;
    status.textContent='Listening needs a browser with Web Audio and module workers.';
  }
  return {
    update() {
      const p=getSpec();
      $('#audio-description').textContent=`${VOICES[p.primary].name}. ${p.form==='envelope'?'A phrase that gathers and returns.':p.form==='sweep'?'A phrase that reaches across open space.':'A high canopy of slowly unfolding tones.'}`;
      if((playing||rendering)&&snapshotKey!==key()) {
        changed=true;
        if(playing) status.textContent=`Listening to ${snapshotName.toLowerCase()}. Changes will sound on the next listen.`;
      }
      if(!playing&&!rendering) {
        $('#audio-wave').replaceChildren();progress.value=0;
        $('#audio-time').textContent='0:00 / 0:24';
        if(cached) status.textContent='Listen to hear this composition.';
      }
    },
    dispose() {disposed=true;stop();context?.close().catch(()=>{});}
  };
}
