import {renderAudio} from './audio.mjs';
self.onmessage = ({data}) => {
  try {
    const audio=renderAudio(data.spec);
    self.postMessage({audio},[audio.left.buffer,audio.right.buffer]);
  } catch (error) { self.postMessage({error:error.message}); }
};
