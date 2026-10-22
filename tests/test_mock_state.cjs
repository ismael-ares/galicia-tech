// Integración del modelo del prototipo: migración y decisiones basadas en datos.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
function load(saved,extend){
 const storage=new Map(saved?[['galicia-tech-management-v1',JSON.stringify(saved)]]:[]);
 const context=vm.createContext({window:{},URL,document:{querySelectorAll:()=>[],addEventListener:()=>{}},localStorage:{getItem:key=>storage.get(key)||null,setItem:(key,value)=>storage.set(key,value)}});
 for(const name of ['eventos.js','more-samples.js','source-catalog.js','review-cases.js'])vm.runInContext(fs.readFileSync(path.join(__dirname,'../mock',name),'utf8'),context);
 if(extend)extend(context.window);
 vm.runInContext(fs.readFileSync(path.join(__dirname,'../mock/management-state.js'),'utf8'),context);
 return {model:context.window.GaliciaManagement,data:context.window.GALICIA_EVENTS,storage};
}
let current=load();
assert.equal(current.model.sources.length,13);
assert.equal(current.data.events.length,8);
assert.equal(current.model.pending().length,2);
assert.equal(current.data.events.filter(event=>event.id==='wordpress-vigo-octubre').length,1);
assert.equal(current.model.decide('gpul-start-time',{status:'approved',value:'18:00'}),false);
assert(!current.data.events.some(event=>event.id==='gpul-terminal'));
current.model.decide('gpul-start-time',{status:'approved',value:'17:00',note:'Prueba sintética de decisión'});
assert.equal(current.data.events.find(event=>event.id==='gpul-terminal').start,'2026-10-21T17:00:00+02:00');
assert.equal(current.model.pending().length,1);
current.model.reopen('gpul-start-time');
assert(!current.data.events.some(event=>event.id==='gpul-terminal'));
current.model.decide('end-time',{status:'approved',value:'19:00'});
assert.equal(current.data.events.find(event=>event.id==='hackathon').end,'2026-10-22T19:00:00+02:00');
assert.equal(current.data.events.find(event=>event.id==='hackathon').statusNote,'');
current.model.reopen('end-time');
assert(current.data.events.find(event=>event.id==='hackathon').statusNote);
const legacySources=current.model.sources.slice(0,4);legacySources[0].enabled=false;
legacySources.push({id:'custom-gpul',name:'Mi GPUL',url:'https://gpul.org/',city:'A Coruña',platform:'Web',enabled:false});
current=load({sources:legacySources,decisions:{'end-time':{status:'approved',value:'19:00',note:'Nota conservada'}}});
assert.equal(current.model.sources.length,13);
assert.equal(current.model.sources.find(source=>source.id==='coruna').enabled,false);
assert.equal(current.model.sources.find(source=>source.id==='gpul').enabled,false);
assert.equal(current.model.sources.find(source=>source.id==='gpul').name,'Mi GPUL');
assert.equal(current.model.decision('end-time').note,'Nota conservada');
assert.equal(current.model.pending().length,1);
const removed=[
 {id:'vigotech',url:'https://vigotech.org/'},
 {id:'python-vigo',url:'https://www.python-vigo.es/'},
 {id:'aindustriosa',url:'https://aindustriosa.org/tipo/eventos/'},
 {id:'custom-cloudnative',url:'https://ocgroups.dev/cncf/group/39aenb6'}
].map(source=>({...source,name:source.id,city:'Vigo',enabled:true,platform:'Web'}));
const previousSources=[...current.model.sources,...removed];
current=load({sources:previousSources,decisions:{'end-time':{status:'approved',value:'19:00',note:'Nota conservada'}}});
assert.equal(current.model.sources.length,13);
assert.equal(current.model.sources.find(source=>source.id==='coruna').enabled,false);
assert.equal(current.model.decision('end-time').note,'Nota conservada');
const migrated=JSON.parse(current.storage.get('galicia-tech-management-v1'));
assert.equal(migrated.catalogVersion,3);
assert.equal(migrated.sources.length,13);
assert(!current.data.events.some(event=>event.sourceIds.includes('vigotech')));
assert(!current.data.events.some(event=>event.sources.some(source=>source.url.includes('vigotech.org'))));
current=load();
assert.equal(current.model.decision('registration').origin,'source');
assert.equal(current.model.decision('registration').status,'approved');
assert.equal(current.data.events.filter(event=>event.id==='hacktoberfest').length,1);
assert.equal(current.data.events.find(event=>event.id==='hacktoberfest').sources.length,2);
current.model.reopen('registration');
assert.equal(current.model.decision('registration').status,'pending');
assert(!current.data.events.some(event=>event.id==='hacktoberfest'));
current=load({catalogVersion:2,sources:[],decisions:{registration:{status:'discarded',note:'Decisión del usuario'}}});
assert(!current.data.events.some(event=>event.id==='hacktoberfest'));
assert.equal(current.model.decision('registration').note,'Decisión del usuario');
current=load({catalogVersion:2,sources:[{id:'custom-readded',url:'https://vigotech.org/',name:'Reañadida manualmente',city:'Vigo',platform:'Web',enabled:true}],decisions:{}});
assert.equal(current.model.sources.length,14);
assert(current.model.sources.some(source=>source.id==='custom-readded'));
current=load(null,window=>{
 const original=window.GALICIA_EVENTS.events[0];
 window.GALICIA_REVIEW_CASES.push({id:'unseen-location',eventId:'unseen-event',published:false,candidate:{...original,id:'unseen-event'},field:{kind:'choice',options:[{value:'new-place',patch:{place:'Lugar de prueba'}}]},approvedPatch:{statusNote:''}});
});
assert.equal(current.model.decide('unseen-location',{status:'approved',value:'new-place'}),true);
assert.equal(current.data.events.find(event=>event.id==='unseen-event').place,'Lugar de prueba');
current.model.decide('unseen-location',{status:'discarded'});
assert(!current.data.events.some(event=>event.id==='unseen-event'));
console.log('PASS modelo: 13 fuentes, 8 eventos de base, corroboración entre fuentes, migración de preferencias y reapertura de decisiones.');
