const {searchFor,openFilters,setFilter,readFilter,goToMonth,currentQuery}=require('./browse_controls.cjs');
// Browser QA against the local sample app; extra density/boundary cases stay in an isolated browser response.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const base=process.env.APP_URL||'http://127.0.0.1:8088';
const out=path.resolve(__dirname,'../output/calendar-redesign');fs.mkdirSync(out,{recursive:true});
const day=(page,date)=>page.locator(`[data-day="${date}"] .calendar-day-button`);
async function month(page,value){await page.waitForFunction(value=>document.querySelector('.calendar-month-title-button')?.dataset.month===value,value);}
async function images(page){await page.locator('img').evaluateAll(nodes=>Promise.all(nodes.map(img=>img.complete?Promise.resolve():new Promise(resolve=>{img.addEventListener('load',resolve,{once:true});img.addEventListener('error',resolve,{once:true});img.loading='eager';}))));}
(async()=>{
 const browser=await chromium.launch({channel:process.env.PLAYWRIGHT_CHANNEL||'chrome',headless:true});
 const errors=[],mutations=[];let page;
 const observe=p=>{p.on('pageerror',error=>errors.push(error.message));p.on('request',request=>{if(request.url().includes('/api/v1/favorites/')&&request.method()!=='GET')mutations.push(request.method());});};
 try{
  const context=await browser.newContext({locale:'es-ES',viewport:{width:1440,height:1050},reducedMotion:'reduce'});page=await context.newPage();observe(page);
  await page.goto(base+'/calendario?mes=2026-11');await page.locator('.calendar-view').waitFor();
  const catalog=await (await page.request.get(base+'/api/v1/catalog/')).json();
  assert.equal(await page.locator('.calendar-month td[data-selected=true][data-busy=true]').count(),1,'Initial selection is a day with encounters');
  assert.equal(await page.locator('.calendar-day-button[tabindex="0"]').count(),1);
  await day(page,'2026-11-04').click();const multi=page.locator('[data-calendar-event="santiago"]');await multi.waitFor();
  await multi.getByText('Horario por confirmar',{exact:true}).waitFor();assert.equal(await multi.locator('.calendar-day-event-meta > div').count(),3);
  assert.equal(await page.locator('[data-day="2026-11-05"] .calendar-event[href="/evento/santiago"]').count(),1);
  await page.getByRole('button',{name:'Siguiente día con encuentros',exact:true}).click();await page.waitForFunction(()=>document.querySelector('[data-day="2026-11-05"]').dataset.selected==='true');
  await day(page,'2026-11-07').click();const ourense=page.locator('[data-calendar-event="ourense"]');await ourense.waitFor();
  await ourense.locator('.save-button').click();await ourense.locator('.save-button[aria-pressed=true]').waitFor();
  await page.reload();await day(page,'2026-11-07').click();await ourense.locator('.save-button[aria-pressed=true]').waitFor();
  await page.getByRole('button',{name:'Mes siguiente',exact:true}).click();await month(page,'2026-12');await page.getByRole('heading',{name:'No hay encuentros este mes'}).waitFor();
  await page.getByRole('button',{name:'Ir a un mes con encuentros'}).click();await month(page,'2026-11');await page.locator('.calendar-day-event').first().waitFor();
  await day(page,'2026-11-30').focus();await page.keyboard.press('ArrowRight');await month(page,'2026-12');
  await page.waitForFunction(()=>document.querySelector('[data-day="2026-12-01"] .calendar-day-button')===document.activeElement);
  await page.goBack();await month(page,'2026-11');await page.goForward();await month(page,'2026-12');
  for(const [value,cells] of [['2027-02',28],['2026-10',35],['2026-11',42]]){
   await goToMonth(page,value);await month(page,value);assert.equal(await page.locator('.calendar-month td').count(),cells);
  }
  await searchFor(page,'Buscar eventos','no-matching-events');await page.getByRole('heading',{name:'No hay encuentros este mes'}).waitFor();
  await page.locator('.collection-clear').click();await page.locator('.calendar-day-event').first().waitFor();
  await goToMonth(page,'2026-10');await month(page,'2026-10');await day(page,'2026-10-22').click();await images(page);
  await page.screenshot({path:path.join(out,'calendar-desktop-light.png'),fullPage:true});
  for(const width of [1440,1120,1100,1024,901,900,768,640,390,320]){
   await page.setViewportSize({width,height:1000});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`Calendar overflow at ${width}px`);
   const cells=page.locator('.calendar-month td');assert.equal(await cells.count(),35);
   if(width>640){const overflow=await cells.evaluateAll(nodes=>nodes.some(cell=>{const list=cell.querySelector('.calendar-cell-events');return list&&list.getBoundingClientRect().bottom>cell.getBoundingClientRect().bottom+1;}));assert.equal(overflow,false,`Cell events fit at ${width}px`);}
  }
  await page.setViewportSize({width:1440,height:1050});await page.getByRole('button',{name:'Activar modo oscuro'}).click();await images(page);
  await page.screenshot({path:path.join(out,'calendar-desktop-dark.png'),fullPage:true});
  await page.setViewportSize({width:390,height:950});await page.locator('.language-button').click();await page.getByRole('heading',{level:2,name:/outubro de 2026/i}).waitFor();
  await page.getByRole('link',{name:'Ver día seleccionado',exact:true}).click();assert.equal(new URL(page.url()).hash,'#calendar-day-panel');
  await page.locator('[data-calendar-event="hackathon"] .calendar-day-event-meta').getByText('Fin por confirmar',{exact:true}).waitFor();
  assert(await page.locator('.calendar-mobile-marks img:visible').count());
  await images(page);await page.screenshot({path:path.join(out,'calendar-mobile-dark-gl.png'),fullPage:true});
  await page.getByRole('link',{name:'Volver ao mes'}).click();assert.equal(new URL(page.url()).hash,'#calendar-month-grid');

  const dense=await browser.newContext({locale:'es-ES',viewport:{width:1440,height:1050},reducedMotion:'reduce'});
  const fixture=[...catalog.events.filter(event=>event.id!=='santiago').slice(0,4).map((event,index)=>({...event,start:`2026-11-07T${10+index}:00:00+01:00`,end:`2026-11-07T${11+index}:00:00+01:00`,statusNote:index===0?'Hora de finalización por confirmar':''})),
   catalog.events.find(event=>event.id==='santiago'),
   {...catalog.events[0],id:'calendar-boundary',start:'2026-11-08T22:00:00+01:00',end:'2026-11-09T00:00:00+01:00',statusNote:''}];
  await dense.route('**/api/v1/catalog/',route=>route.fulfill({json:{...catalog,events:fixture}}));
  const crowded=await dense.newPage();observe(crowded);await crowded.goto(base+'/calendario?mes=2026-11');await day(crowded,'2026-11-07').click();
  const busy=crowded.locator('[data-day="2026-11-07"]');assert.equal(await busy.locator('.calendar-day-count').innerText(),'4');assert.equal(await busy.locator('.calendar-event').count(),1);
  await busy.getByRole('button',{name:'+3 más',exact:true}).click();assert.equal(await crowded.locator('[data-calendar-event]').count(),4);
  const first=crowded.locator('[data-calendar-event]').first();assert.match(await first.locator('.calendar-day-event-meta dd').first().innerText(),/10:00\s+Fin por confirmar/);
  assert.equal(await crowded.locator('[data-day="2026-11-08"] .calendar-event[href="/evento/calendar-boundary"]').count(),1);
  assert.equal(await crowded.locator('[data-day="2026-11-09"] .calendar-event[href="/evento/calendar-boundary"]').count(),0,'Midnight end is exclusive');
  const scroll=crowded.locator('.calendar-day-events');assert(await scroll.evaluate(node=>node.scrollHeight>node.clientHeight),'Dense day has a scrollable desktop inspector');
  await crowded.locator('[data-calendar-event]').last().getByRole('link',{name:'Ver ficha',exact:true}).scrollIntoViewIfNeeded();
  await images(crowded);await crowded.screenshot({path:path.join(out,'calendar-dense-day.png'),fullPage:true});
  await crowded.setViewportSize({width:320,height:900});assert(await crowded.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  assert.equal(await crowded.locator('.calendar-mobile-marks small').first().innerText(),'+3');
  assert.equal(await scroll.evaluate(node=>getComputedStyle(node).overflowY),'visible');
  await crowded.screenshot({path:path.join(out,'calendar-mobile-dense-320.png'),fullPage:true});await dense.close();
  assert.deepEqual(errors,[]);assert.deepEqual(mutations,[],'Anonymous calendar saves stay local');
  fs.writeFileSync(path.join(out,'checks.json'),JSON.stringify({status:'passed',checks:['useful initial day','4/5/6-week months','multi-day event','uncertain schedule','save/reload','empty-month recovery','keyboard and month history','search reset','320-1440px','GL/ES','light/dark','mobile community marks','mobile jump links','dense day scrolling','midnight exclusive end','local saves only'],errors},null,2));
  console.log('PASS calendar: monthly grid, day inspector, density, keyboard, history, local saves and responsive GL/ES themes.');
 }catch(error){if(page)await page.screenshot({path:path.join(out,'failure.png'),fullPage:true}).catch(()=>{});throw error;}
 finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
