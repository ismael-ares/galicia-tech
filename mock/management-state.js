/* Estado local del prototipo. No ejecuta el colector ni modifica sus resultados. */
(()=>{
const data=window.GALICIA_EVENTS,key='galicia-tech-management-v1',clone=value=>JSON.parse(JSON.stringify(value));
const catalog=window.GALICIA_SOURCE_CATALOG,initialSources=catalog.sources,cases=window.GALICIA_REVIEW_CASES,originalEvents=clone(data.events);
const safeURL=value=>{try{const url=new URL(value);return ['https:','http:'].includes(url.protocol)&&!url.username&&!url.password?url.href:null}catch{return null}};
const samePage=(a,b)=>{try{const x=new URL(a),y=new URL(b);return x.origin===y.origin&&x.pathname.replace(/\/+$/,'')===y.pathname.replace(/\/+$/,'')}catch{return false}};
function validDecision(item,decision){if(!decision||!['approved','discarded','pending'].includes(decision.status))return false;if(decision.status!=='approved')return true;return item.field.kind==='url'?Boolean(safeURL(decision.value)):item.field.kind==='choice'?item.field.options.some(option=>option.value===decision.value):false;}
let state={catalogVersion:catalog.version,sources:clone(initialSources),decisions:{}},needsMigration=false;
try{const saved=JSON.parse(localStorage.getItem(key));if(saved){
 needsMigration=(saved.catalogVersion||1)<catalog.version;
 if(Array.isArray(saved.sources)){
  const merged=[];
  for(const source of saved.sources){if(needsMigration&&source&&(catalog.removedSources||[]).some(removed=>(saved.catalogVersion||1)<(removed.removedInVersion||2)&&(removed.id===source.id||removed.urls.some(url=>samePage(url,source.url)))))continue;if(!source||typeof source.id!=='string'||typeof source.name!=='string'||!safeURL(source.url)||!['A Coruña','Ourense','Santiago de Compostela','Lugo','Pontevedra','Vigo','Ferrol','Toda Galicia'].includes(source.city))continue;
   const seed=initialSources.find(original=>original.id===source.id)||initialSources.find(original=>samePage(original.url,source.url));
   const entry={...(seed||{}),...source,id:seed?.id||source.id,name:source.name.slice(0,100),url:safeURL(source.url),enabled:source.enabled!==false,snapshot:Boolean(seed&&samePage(seed.url,source.url))};
   if(seed&&entry.snapshot){entry.checkedAt=seed.checkedAt;entry.method=seed.method;entry.note=seed.note;entry.finalURL=seed.finalURL}
   else{delete entry.checkedAt;delete entry.note;delete entry.finalURL}
   if(!merged.some(item=>item.id===entry.id||samePage(item.url,entry.url)))merged.push(entry);
  }
  for(const seed of initialSources)if(!merged.some(item=>item.id===seed.id||samePage(item.url,seed.url)))merged.push(clone(seed));
  state.sources=merged;
 }
 if(saved.decisions&&typeof saved.decisions==='object')for(const item of cases){const decision=saved.decisions[item.id];if(!validDecision(item,decision))continue;state.decisions[item.id]={status:decision.status,value:typeof decision.value==='string'?decision.value:'',note:typeof decision.note==='string'?decision.note.slice(0,1000):'',at:typeof decision.at==='string'?decision.at:''};}
}}catch{}
if(needsMigration){try{localStorage.setItem(key,JSON.stringify(state))}catch{}}
const effectiveDecision=item=>state.decisions[item.id]||item.defaultDecision||{status:'pending',note:''};
const pending=()=>cases.filter(item=>effectiveDecision(item).status==='pending');
function updateCounters(){document.querySelectorAll('[data-review-count]').forEach(element=>{element.textContent=pending().length;element.hidden=!pending().length});}
function persist(){let saved=true;try{localStorage.setItem(key,JSON.stringify(state))}catch{saved=false}updateCounters();return saved;}
function notify(message){const node=document.getElementById('toast');if(node){node.textContent=message;node.hidden=false;clearTimeout(notify.timer);notify.timer=setTimeout(()=>{node.hidden=true},6000)}}
function setField(event,path,value){const parts=path.split('.');if(parts.some(part=>['__proto__','prototype','constructor'].includes(part)))return;let cursor=event;for(const part of parts.slice(0,-1)){if(!cursor[part]||typeof cursor[part]!=='object')cursor[part]={};cursor=cursor[part]}cursor[parts.at(-1)]=value;}
function applyEvents(){const events=new Map(clone(originalEvents).map(event=>[event.id,event]));for(const item of cases){const decision=effectiveDecision(item);if(decision.status==='pending')continue;if(decision.status==='discarded'){events.delete(item.eventId);continue}let event=events.get(item.eventId);if(!event&&item.candidate){event=clone(item.candidate);events.set(item.eventId,event)}if(!event)continue;Object.assign(event,clone(item.approvedPatch||{}));if(item.field.kind==='choice'){const option=item.field.options.find(option=>option.value===decision.value);Object.assign(event,clone(option.patch||{}));}else if(item.field.kind==='url'){setField(event,item.field.path,safeURL(decision.value));if(item.field.path==='registration.url')event.registration.label=item.field.linkLabel||'Inscripción revisada';}}
 data.events=Array.from(events.values());}
window.GaliciaManagement={cases,safeURL,validDecision,notify,pending,get sources(){return clone(state.sources)},decision:id=>{const item=cases.find(item=>item.id===id);return clone(item?effectiveDecision(item):{status:'pending',note:''})},saveSources(sources){state.sources=clone(sources);return persist()},decide(id,decision){const item=cases.find(item=>item.id===id);if(!item||!validDecision(item,decision))return false;state.decisions[id]={...decision,at:new Date().toISOString()};applyEvents();return persist()},reopen(id){const item=cases.find(item=>item.id===id);if(item?.defaultDecision)state.decisions[id]={status:'pending',note:''};else delete state.decisions[id];applyEvents();return persist()},updateCounters};
applyEvents();document.addEventListener('DOMContentLoaded',updateCounters);
})();
