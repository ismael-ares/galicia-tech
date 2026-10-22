(()=>{
 const events=window.GALICIA_EVENTS.events,covers=window.GaliciaCovers,select=document.querySelector('#sample-event');
 const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 let palette='auto',layout='auto';
 for(const event of events){const option=document.createElement('option');option.value=event.id;option.textContent=event.title;select.append(option)}
 select.value='santiago';
 function render(){
  const event=events.find(e=>e.id===select.value)||events[0];
  document.querySelector('#cover-preview').innerHTML=covers.html(event,'studio-poster',{automatic:true,palette,layout});
  requestAnimationFrame(()=>covers.fitGenerated());
 }
 select.addEventListener('change',render);
 document.querySelectorAll('.studio-controls button[data-palette],.studio-controls button[data-layout]').forEach(button=>button.addEventListener('click',()=>{
  const key=button.hasAttribute('data-palette')?'palette':'layout';
  if(key==='palette')palette=button.dataset.palette;else layout=button.dataset.layout;
  document.querySelectorAll(`.studio-controls button[data-${key}]`).forEach(b=>b.setAttribute('aria-pressed',String(b===button)));render();
 }));
 document.querySelector('#cover-grid').innerHTML=events.map(event=>{
  const model=covers.design(event),colors={mint:'Menta',iris:'Iris',sky:'Atlántico',rose:'Arcilla'},layouts={orbit:'Órbitas',tiles:'Módulos',waves:'Ondas'};
  return `<article class="poster-sample"><a href="evento.html?id=${encodeURIComponent(event.id)}" aria-label="Ver ficha de ${esc(event.title)}">${covers.html(event,'studio-poster',{automatic:true})}</a><div class="poster-caption"><span>${colors[model.palette]} · ${layouts[model.layout]}</span><span>${esc(event.community)}</span></div></article>`;
 }).join('');
 document.querySelector('#mini-covers').innerHTML=[events[0],events[4],events[5]].filter(Boolean).map(event=>covers.html(event,'event-thumb cover-auto-wrap',{automatic:true})).join('');
 render();
})();
