#!/usr/bin/env node
// Node 18+. No dependencies. Same instrument as the browser listening layer.
import {readFile,writeFile} from 'node:fs/promises';
import {renderAudio,encodeWav} from '../docs/site/audio.mjs';

async function main() {
  const args=process.argv.slice(2);
  let source,output='field.wav';
  for(let i=0;i<args.length;i++) {
    if(args[i]==='--help') {
      console.log('Usage: node scripts/render_audio.mjs [--spec controls.json] [--output field.wav]');
      return;
    }
    if(!['--spec','--output'].includes(args[i]) || !args[i+1] || args[i+1].startsWith('--'))
      throw new Error('Use --spec controls.json and/or --output field.wav. See --help.');
    if(args[i]==='--spec') source=args[++i]; else output=args[++i];
  }
  const spec=source?JSON.parse(await readFile(source,'utf8')):{};
  const audio=renderAudio(spec);
  await writeFile(output,new Uint8Array(encodeWav(audio)));
  console.log(`Wrote ${output}: ${audio.duration}s, stereo ${audio.sampleRate} Hz, Field Listening ${audio.revision}.`);
}
main().catch(error=>{console.error(error.message);process.exitCode=1;});
