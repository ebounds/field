// Only the viewer's chosen film or phrase sounds at one time.
document.addEventListener('play',event=>{document.querySelectorAll('video,audio').forEach(media=>{if(media!==event.target)media.pause()})},true);
document.addEventListener('visibilitychange',()=>{if(document.hidden)document.querySelectorAll('video,audio').forEach(media=>media.pause())});
