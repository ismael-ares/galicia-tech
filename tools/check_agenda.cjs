// Local sample app; synthetic scheduling and cover cases are isolated in browser responses.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const base=process.env.APP_URL||'http://127.0.0.1:8088';
const out=path.resolve(__dirname,'../output/agenda-redesign');fs.mkdirSync(out,{recursive:true});
const count=(page,n)=>page.waitForFunction(n=>document.querySelectorAll('.meet-card').length===n,n);
const localDay=value=>{const parts=new Intl.DateTimeFormat('en-CA',{year:'numeric',month:'2-digit',day:'2-digit',timeZone:'Europe/Madrid'}).formatToParts(new Date(value));return ['year','month','day'].map(type=>parts.find(part=>part.type===type).value).join('-');};
const end=event=>localDay(event.end&&new Date(event.end)>new Date(event.start)?new Date(event.end).getTime()-1:event.start);
const move=(date,n)=>{const value=new Date(date+'T12:00:00Z');value.setUTCDate(value.getUTCDate()+n);return value.toISOString().slice(0,10);};
const periods=page=>page.getByRole('group',{name:'Periodo',exact:true});
async function images(page){await page.locator('img').evaluateAll(nodes=>Promise.all(nodes.map(img=>img.complete?Promise.resolve():new Promise(resolve=>{img.addEventListener('load',resolve,{once:true});img.addEventListener('error',resolve,{once:true});img.loading='eager';}))));}
async function stage(page){
 return page.locator('.featured-card').evaluate(node=>{
  const box=node.getBoundingClientRect(),poster=node.querySelector('.featured-image-link').getBoundingClientRect(),description=node.querySelector('.featured-description'),summary=description.getBoundingClientRect(),footer=node.querySelector('.featured-bottom').getBoundingClientRect();
  return {height:box.height,poster:poster.width,summary:summary.height,line:parseFloat(getComputedStyle(description).lineHeight),visible:getComputedStyle(description).display!=='none',footerFits:footer.bottom<=box.bottom-5,summaryFits:summary.bottom<=footer.top+1};
 });
}
(async()=>{
 const browser=await chromium.launch({channel:process.env.PLAYWRIGHT_CHANNEL||'chrome',headless:true});
 const errors=[],mutations=[];let page;
 const observe=page=>{page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(r.url().includes('/api/v1/favorites/')&&r.method()!=='GET')mutations.push(r.method());});};
 try{
  const context=await browser.newContext({locale:'es-ES',viewport:{width:1440,height:1050},reducedMotion:'reduce'});page=await context.newPage();observe(page);
  await page.goto(base);await page.locator('.agenda-page').waitFor();
  const catalog=await (await page.request.get(base+'/api/v1/catalog/')).json(),today=localDay(new Date());await count(page,catalog.events.length);
  const upcoming=catalog.events.filter(event=>end(event)>=today).sort((a,b)=>new Date(a.start)-new Date(b.start));
  const past=catalog.events.filter(event=>end(event)<today).sort((a,b)=>new Date(b.start)-new Date(a.start));
  for(const [name,events] of [['proximos',upcoming],['pasados',past]])assert.deepEqual(await page.locator(`.agenda-time-section[data-period="${name}"] .meet-card`).evaluateAll(nodes=>nodes.map(node=>node.dataset.motionItem)),events.map(event=>event.id));
  assert((await page.locator('.agenda-controls').boundingBox()).y<(await page.locator('.featured-section').boundingBox()).y);
  assert.equal(await page.locator('.featured-rail .featured-preview').count(),2);
  for(const card of await page.locator('.meet-card').all()){assert.equal(await card.locator('.meet-description').count(),1);assert.equal(await card.locator('.meet-fact').count(),3);assert.equal(await card.locator('.meet-tags').count(),1);assert.equal(await card.locator('.meet-links a').first().getAttribute('target'),'_blank');}
  const heights=[];
  for(let index=0;index<3;index++){
   const data=await stage(page);heights.push(data.height);assert(data.visible&&data.summary>=data.line*1.9&&data.footerFits&&data.summaryFits,'Featured description and actions fit');
   await page.getByRole('button',{name:'Siguiente destacado',exact:true}).click();
  }
  assert.equal(new Set(heights).size,1,'Featured height stays stable across cover formats');
  await page.getByRole('button',{name:'¿Por qué estos eventos?',exact:true}).click();await page.locator('.featured-section .inline-note').waitFor();
  await page.getByRole('button',{name:'¿Por qué estos eventos?',exact:true}).click();
  const href=await page.locator('.featured-title').getAttribute('href'),id=href.split('/').at(-1);
  await page.locator('.featured-save .save-button').click();await page.locator(`.meet-card[data-motion-item="${id}"] .save-button[aria-pressed=true]`).waitFor();
  await page.locator('.featured-save .save-button').click();await page.locator(`.meet-card[data-motion-item="${id}"] .save-button[aria-pressed=false]`).waitFor();
  const close=page.getByRole('button',{name:'Cerrar aviso',exact:true});if(await close.count())await close.click();
  await images(page);await page.screenshot({path:path.join(out,'agenda-desktop-light.png'),fullPage:true});
  const search=page.getByLabel('Buscar eventos'),before=await search.boundingBox();await search.fill('DevFest');await count(page,2);
  assert.equal(await page.locator('.featured-section').count(),0);assert.equal(await search.evaluate(node=>node===document.activeElement),true);assert(Math.abs((await search.boundingBox()).y-before.y)<1,'Search stays put when featured events collapse');
  await page.getByRole('button',{name:'Filtros',exact:true}).click();await page.getByLabel('Localidad').selectOption('Santiago de Compostela');await count(page,1);
  await page.reload();await count(page,1);assert.equal(await search.inputValue(),'DevFest');
  await page.getByRole('button',{name:'Quitar filtro: Santiago de Compostela',exact:true}).click();await count(page,2);
  await page.locator('.agenda-reset').click();await count(page,catalog.events.length);await page.locator('.featured-section').waitFor();
  await periods(page).getByRole('button',{name:'Próximos',exact:true}).click();await count(page,upcoming.length);assert.equal(new URL(page.url()).searchParams.get('periodo'),'proximos');
  await periods(page).getByRole('button',{name:'Pasados',exact:true}).click();await count(page,past.length);await page.reload();await count(page,past.length);
  await page.goBack();await periods(page).getByRole('button',{name:'Próximos',exact:true}).and(page.locator('[aria-pressed=true]')).waitFor();await count(page,upcoming.length);
  await page.goForward();await periods(page).getByRole('button',{name:'Pasados',exact:true}).and(page.locator('[aria-pressed=true]')).waitFor();await count(page,past.length);
  for(const days of [7,30]){await periods(page).getByRole('button',{name:`Próximos ${days} días`,exact:true}).click();await count(page,upcoming.filter(event=>localDay(event.start)<=move(today,days-1)).length);}
  await search.fill('no-matching-events');await page.getByRole('heading',{name:'No hay coincidencias',exact:true}).waitFor();
  await page.locator('.agenda-empty').getByRole('button',{name:'Limpiar filtros',exact:true}).click();await count(page,catalog.events.length);
  for(const width of [1440,1120,1050,1024,901,900,768,640,390,320]){
   await page.setViewportSize({width,height:1000});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`Agenda overflow at ${width}px`);
   const data=await stage(page);assert(data.visible&&data.footerFits&&data.summaryFits,`Featured layout fits at ${width}px`);assert.equal(await page.locator('.featured-rail').isVisible(),width>1050);
  }
  await page.setViewportSize({width:1440,height:1050});await page.getByRole('button',{name:'Activar modo oscuro'}).click();await images(page);
  await page.screenshot({path:path.join(out,'agenda-desktop-dark.png'),fullPage:true});await page.locator('.language-button').click();await page.getByRole('heading',{name:'Axenda.',exact:true}).waitFor();
  await page.setViewportSize({width:390,height:950});await images(page);await page.screenshot({path:path.join(out,'agenda-mobile-dark-gl.png'),fullPage:true});
  await page.setViewportSize({width:320,height:900});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));

  const edge=await browser.newContext({locale:'es-ES',viewport:{width:1440,height:1050},reducedMotion:'reduce'});
  const fixture=[
   {...catalog.events[0],id:'agenda-expired',start:'2000-01-01T10:00:00+01:00',end:'2000-01-01T11:00:00+01:00'},
   {...catalog.events[0],id:'agenda-live',title:'Arquitecturas abiertas, herramientas de desarrollo y experiencias de la comunidad tecnológica de Galicia',start:'2000-01-02T10:00:00+01:00',end:'2099-01-01T20:00:00+01:00'},
   {...catalog.events[1],id:'agenda-future',start:'2099-01-04T10:00:00+01:00',end:'2099-01-04T11:00:00+01:00'},
   {...catalog.events[2],id:'agenda-next',start:'2099-02-07T10:00:00+01:00',end:'2099-02-07T11:00:00+01:00'}
  ];
  const cover=catalog.covers.find(item=>item.id===catalog.events[0].id).selected;
  const edgeCatalog={...catalog,events:fixture,ranking:['agenda-expired','agenda-live','agenda-live','agenda-future','agenda-next'].map(id=>({id,reason:'Selección por fecha.'})),covers:[{id:'agenda-live',selected:{...cover,width:320,height:1280}},{id:'agenda-future',selected:{...cover,width:1920,height:400}},{id:'agenda-next',selected:null}]};
  await edge.route('**/api/v1/catalog/',route=>route.fulfill({json:edgeCatalog}));const sample=await edge.newPage();observe(sample);await sample.goto(base);await count(sample,4);
  assert.equal(await sample.locator('.dots button').count(),3,'Past and duplicate ranking entries are excluded');
  await sample.locator('.agenda-time-section[data-period="proximos"]').getByText('En curso',{exact:true}).waitFor();await sample.getByRole('heading',{name:/enero de 2000/i}).first().waitFor();
  const widths=[];
  for(let i=0;i<3;i++){const data=await stage(sample);widths.push(data.poster);assert(data.footerFits&&data.summaryFits&&data.summary>=data.line*1.9,'Long titles retain their summary');await sample.getByRole('button',{name:'Siguiente destacado',exact:true}).click();}
  assert(new Set(widths).size>1,'Cover width adapts while the component keeps its height');
  await sample.setViewportSize({width:390,height:950});const mobile=[];
  for(let i=0;i<3;i++){const data=await stage(sample);mobile.push(data.height);assert(data.footerFits&&data.summaryFits&&data.visible);await sample.getByRole('button',{name:'Siguiente destacado',exact:true}).click();}assert.equal(new Set(mobile).size,1);
  edgeCatalog.events=fixture.slice(0,1);await sample.reload();await count(sample,1);assert.equal(await sample.locator('.featured-section').count(),0,'Expired events never appear as upcoming highlights');
  edgeCatalog.events=[];await sample.reload();await sample.getByRole('heading',{name:'Todavía no hay encuentros publicados',exact:true}).waitFor();assert.equal(await sample.locator('.featured-section').count(),0);
  await edge.close();assert.deepEqual(errors,[]);assert.deepEqual(mutations,[]);
  fs.writeFileSync(path.join(out,'checks.json'),JSON.stringify({status:'passed',checks:['search before highlights','upcoming and archive ordering','month/year headings','card contents retained','carousel height','adaptive cover width','long titles','live and expired events','ranking deduplication','local favorites','filters and focus','URL periods/reload/history','7/30-day ranges','empty catalogue','320-1440px','GL/ES','light/dark'],errors},null,2));
  console.log('PASS agenda: composition, carousel, timeline, periods, filters, local saves and responsive GL/ES UI.');
 }catch(error){if(page)await page.screenshot({path:path.join(out,'failure.png'),fullPage:true}).catch(()=>{});throw error;}
 finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
