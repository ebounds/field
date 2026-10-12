const art=document.getElementById('trailer-concept-art');
document.getElementById('trailer-polarizer').addEventListener('click',event=>{const on=art.classList.toggle('on');event.currentTarget.setAttribute('aria-pressed',String(on));event.currentTarget.textContent=on?'Polarizer on':'Polarizer off';});
document.getElementById('trailer-zoom').addEventListener('click',event=>{const zoom=art.classList.toggle('zoom');event.currentTarget.setAttribute('aria-pressed',String(zoom));event.currentTarget.textContent=zoom?'Whole view':'Inspect the gap';});
