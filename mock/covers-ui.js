/* Presentación de imágenes verificadas y portada tipográfica local; sin llamadas de red propias. */
(()=>{
 const events=window.GALICIA_EVENTS?.events||[], entries=window.GALICIA_COVER_MANIFEST?.events||{};
 const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 for(const event of events){const cover=entries[event.id]||{};event.image=cover.url||null;event.imagePage=cover.imagePage||null;event.imageSource=cover.url?`Imagen publicada por ${event.community}`:null;event.coverStatus=cover.status||'no-image';event.coverWidth=cover.width||null;event.coverHeight=cover.height||null;}
 // Paleta estable por comunidad; el color es decorativo, no indica prioridad.
 function hash(text){
  let value=Array.from(String(text)).reduce((seed,char)=>((seed*31+char.codePointAt(0))>>>0),0);
  value=Math.imul(value^(value>>>16),0x45d9f3b);value=Math.imul(value^(value>>>16),0x45d9f3b);
  return (value^(value>>>16))>>>0;
 }
 function design(event){
  const title=String(event.title||''),community=String(event.community||'');
  let topic='Encuentro tech',glyph='↗';
  if(/wordpress/i.test(community+' '+title)){topic='WordPress';glyph='W'}
  else if(/flutter/i.test(title)){topic='Desarrollo móvil';glyph='</>'}
  else if(/hackathon/i.test(title)){topic='Hackathon';glyph='{ }'}
  else if(/\bia\b|\bai\b|inteligencia artificial/i.test(title)){topic='Inteligencia artificial';glyph='✳'}
  else if(/python/i.test(community+' '+title)){topic='Python';glyph='>_'}
  else if(/devfest/i.test(title)){topic='DevFest';glyph='</>'}
  const seed=hash(community||event.id||title);
  return {palette:['mint','iris','sky','rose'][seed%4],layout:['orbit','tiles','waves'][hash(event.id||title)%3],topic,glyph};
 }
 function dateParts(event){
  const date=new Date(event.start);
  if(!event.start||Number.isNaN(date.getTime()))return {day:'—',month:'Fecha pendiente'};
  const format=options=>new Intl.DateTimeFormat('es-ES',{...options,timeZone:'Europe/Madrid'}).format(date);
  const end=new Date(event.end),day=format({day:'2-digit'});
  const endFormat=options=>new Intl.DateTimeFormat('es-ES',{...options,timeZone:'Europe/Madrid'}).format(end);
  const differentDay=event.end&&!Number.isNaN(end.getTime())&&format({year:'numeric',month:'2-digit',day:'2-digit'})!==endFormat({year:'numeric',month:'2-digit',day:'2-digit'});
  if(differentDay){
   const sameMonth=format({year:'numeric',month:'2-digit'})===endFormat({year:'numeric',month:'2-digit'});
   if(sameMonth)return {day:day+'–'+endFormat({day:'2-digit'}),month:format({month:'short'}).replace('.','')+' '+format({year:'numeric'})};
   return {day:day+' '+format({month:'short'}).replace('.',''),month:'→ '+endFormat({day:'2-digit',month:'short',year:'numeric'}).replaceAll('.','')};
  }
  return {day,month:format({month:'short'}).replace('.','')+' '+format({year:'numeric'})};
 }
 function artwork(layout){
  const shapes={
   orbit:'<circle cx="235" cy="160" r="149"/><circle cx="235" cy="160" r="112"/><circle cx="235" cy="160" r="75"/><path d="M12 295 308 20"/><circle class="poster-art-solid" cx="130" cy="257" r="19"/>',
   tiles:'<rect class="poster-art-solid" x="130" y="0" width="142" height="142" rx="65"/><rect x="130" y="155" width="142" height="142" rx="20"/><rect x="-25" y="155" width="142" height="142" rx="65"/><path d="M146 225h110m-55-55v110"/>',
   waves:'<path d="M25 320V176A155 155 0 0 1 335 176v144M62 320V176a118 118 0 0 1 236 0v144M99 320V176a81 81 0 0 1 162 0v144M136 320V176a44 44 0 0 1 88 0v144"/>'
  };
  return `<svg class="poster-art" viewBox="0 0 320 320" fill="none" aria-hidden="true" focusable="false">${shapes[layout]}</svg>`;
 }
 function fallback(event,options={}){
  const model=design(event),date=dateParts(event);
  if(['mint','iris','sky','rose'].includes(options.palette))model.palette=options.palette;
  if(['orbit','tiles','waves'].includes(options.layout))model.layout=options.layout;
  const symbol=`galicia-tech-symbol-compact${document.documentElement.dataset.theme==='dark'?'-dark':''}.svg?v=brand-motion-dark-20261020`;
  return `<div class="generated-cover" data-palette="${model.palette}" data-layout="${model.layout}" data-cover-id="${esc(event.id)}">
   ${artwork(model.layout)}<span class="poster-glyph" aria-hidden="true">${esc(model.glyph)}</span>
   <div class="poster-top"><span class="poster-community">${esc(event.community||'Comunidad tech')}</span><img class="poster-brand" data-brand-symbol src="${symbol}" alt="" width="32" height="32"></div>
   <div class="poster-content"><span class="poster-topic">${esc(model.topic)}</span><strong class="poster-title" data-length="${event.title?.length>75?'long':'normal'}">${esc(event.title||'Encuentro tecnológico')}</strong></div>
   <div class="poster-bottom"><span class="poster-date${date.day.length>2?' is-range':''}"><b>${date.day}</b><span>${esc(date.month)}</span></span><span class="poster-place">${esc(event.city||'Galicia')}</span><span class="poster-signature">Galicia Tech<span>Portada automática</span></span></div>
  </div>`;
 }
 function html(event,cls='cover',options={}){
  if(!event.image||options.automatic)return `<div class="${cls} cover-auto-wrap" data-cover-id="${esc(event.id)}">${fallback(event,options)}</div>`;
  return `<div class="${cls} cover-real" data-cover-id="${esc(event.id)}"><img src="${esc(event.image)}" alt="Portada de ${esc(event.title)}" loading="lazy" referrerpolicy="no-referrer"><div class="cover-fallback generated-fallback" hidden>${fallback(event)}</div></div>`;
 }
 function fitGenerated(root=document){
  root.querySelectorAll('.generated-cover').forEach(poster=>{
   const title=poster.querySelector('.poster-title'),content=poster.querySelector('.poster-content');
   if(!title||!content||!poster.clientWidth||getComputedStyle(title).display==='none')return;
   title.style.removeProperty('font-size');
   let size=parseFloat(getComputedStyle(title).fontSize),steps=0;
   while(content.scrollHeight>content.clientHeight+1&&size>11&&steps++<35){size-=1;title.style.fontSize=size+'px'}
  });
 }
 function attach(root=document){
  requestAnimationFrame(()=>fitGenerated(root));
  root.querySelectorAll('.cover-real > img').forEach(img=>{
   const fail=()=>{img.hidden=true;const box=img.closest('.cover-real'),fallbackEl=box?.querySelector(':scope > .cover-fallback');if(fallbackEl)fallbackEl.hidden=false;box?.classList.add('has-generated-cover');fitAll();const attribution=root.querySelector('.cover-attribution');if(attribution)attribution.textContent='Portada automática de la agenda.';};
   img.addEventListener('error',fail,{once:true});
   if(img.complete&&!img.naturalWidth)fail();
   img.addEventListener('load',()=>{const box=img.closest('.featured-box');if(box)fitFeature(box);const detail=img.closest('.detail-hero');if(detail)fitDetail(detail);},{once:true});
  });
 }
 function ratioFor(event,img){return img?.naturalWidth&&img?.naturalHeight?img.naturalWidth/img.naturalHeight:event?.coverWidth&&event?.coverHeight?event.coverWidth/event.coverHeight:1;}
 function eventFor(box){const id=box.querySelector('.cover')?.dataset.coverId;return events.find(event=>event.id===id)}
 function fitFeature(box){
  const cover=box.querySelector('.cover'),img=cover?.querySelector('img');if(!cover)return;
  const generated=cover.classList.contains('cover-auto-wrap')||cover.classList.contains('has-generated-cover');
  const ratio=generated?1.6:ratioFor(eventFor(box),img), available=Math.max(1,box.clientWidth);
  const mobile=matchMedia('(max-width:620px)').matches;
  const imageAreaHeight=mobile?230:box.clientHeight;
  const min=available*.28,max=available*(mobile?1:(generated ? .46 : .60));
  const width=Math.max(min,Math.min(max,imageAreaHeight*ratio));
  cover.style.width=`${Math.round(width)}px`;
  cover.style.height='100%';
  cover.style.marginInline='auto';
  cover.style.gridColumn=mobile?'1/-1':'auto';
  cover.style.aspectRatio='auto';
  box.style.gridTemplateColumns=mobile?'1fr':`${Math.round(width)}px minmax(0,1fr)`;
  fitGenerated(box);
  if(ratio>1.6&&img?.src)cover.style.setProperty('--cover-bg',`url("${img.src.replace(/"/g,'%22')}")`);else cover.style.removeProperty('--cover-bg');
 }
 function setCoverSize(box,img,detail=false){
  const cover=box.querySelector('.cover'), info=box.querySelector(detail?'.detail-heading':'.featured-info');if(!cover)return;
  const ratio=cover.classList.contains('cover-auto-wrap')||cover.classList.contains('has-generated-cover')?1.6:ratioFor(null,img), widthAvail=Math.max(1,box.clientWidth);
  if(matchMedia('(max-width:620px)').matches){
   let width=widthAvail, height=width/ratio;
   if(height>380){height=380;width=height*ratio;}
   cover.style.width=`${Math.round(width)}px`;cover.style.height=`${Math.round(height)}px`;cover.style.marginInline='auto';cover.style.gridColumn='1/-1';
   box.style.gridTemplateColumns='1fr';
  }else{
   const maxWidth=widthAvail*.49;
   const desiredHeight=Math.min(420,Math.max(250,(info?.scrollHeight||300)+44));
   let height=Math.min(desiredHeight,maxWidth/ratio),width=height*ratio;
   if(height<180){height=Math.min(180,maxWidth/ratio);width=height*ratio;}
   cover.style.width=`${Math.round(width)}px`;cover.style.height=`${Math.round(height)}px`;cover.style.marginInline='0';cover.style.gridColumn='auto';
   box.style.gridTemplateColumns=`${Math.round(width)}px minmax(0,1fr)`;
  }
  cover.style.aspectRatio=String(ratio);
 }
 function fitDetail(box){setCoverSize(box,box.querySelector('.cover > img'),true);fitGenerated(box)}
 function fitAll(){document.querySelectorAll('.featured-box:not(.empty)').forEach(fitFeature);document.querySelectorAll('.detail-hero').forEach(fitDetail);fitGenerated()}
 window.GaliciaCovers={html,attach,fitAll,fitFeature,fitDetail,design,fitGenerated};
 addEventListener('resize',()=>requestAnimationFrame(fitAll),{passive:true});
})();
