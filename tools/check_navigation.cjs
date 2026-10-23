const {searchFor,openFilters,setFilter,readFilter,goToMonth,currentQuery}=require('./browse_controls.cjs');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const base=process.env.APP_URL||'http://127.0.0.1:8088';
const out=path.resolve(__dirname,'../output/navigation');fs.mkdirSync(out,{recursive:true});
const key='galicia-tech-guest-favorites-v1';
const count=(page,n)=>page.waitForFunction(n=>document.querySelectorAll('.meet-card').length===n,n);
const nav=(page,label,mobile=false)=>page.locator(mobile?'.mobile-nav':'.desktop-nav').getByRole('link',{name:label,exact:true});
const savedLink=(page,mobile=false)=>page.locator(mobile?'.mobile-nav a[href="/guardados"]':'.desktop-nav a[href="/guardados"]');
async function active(page,pathname,mobile=false){
 const current=page.locator((mobile?'.mobile-nav':'.site-header')+' a[aria-current="page"]');
 await current.waitFor();assert.equal(await current.count(),1);assert.equal(new URL(await current.getAttribute('href'),base).pathname,pathname);
}
async function month(page,value){await page.waitForFunction(value=>document.querySelector('.calendar-month-title-button')?.dataset.month===value,value);}
async function dismissToast(page){const button=page.getByRole('button',{name:'Cerrar aviso',exact:true});if(await button.count())await button.click();}
(async()=>{
 const browser=await chromium.launch({channel:process.env.PLAYWRIGHT_CHANNEL||'chrome',headless:true});
 const context=await browser.newContext({locale:'es-ES',viewport:{width:1440,height:1100},reducedMotion:'reduce'});
 const errors=[];let page;
 try{
  page=await context.newPage();page.on('pageerror',error=>errors.push(error.message));
  await page.goto(base);await page.locator('.agenda-page').waitFor();await active(page,'/');
  assert.equal(await page.locator('.desktop-nav a').count(),3);
  assert.equal(await page.locator('.saved-filter-button,.event-view-switch,.header-actions a[href="/guardados"]').count(),0);
  const catalog=await (await page.request.get(base+'/api/v1/catalog/')).json();
  const localDay=value=>new Intl.DateTimeFormat('en-CA',{year:'numeric',month:'2-digit',day:'2-digit',timeZone:'Europe/Madrid'}).format(new Date(value));
  const today=localDay(new Date()),upcomingCount=catalog.events.filter(event=>localDay(event.end&&new Date(event.end)>new Date(event.start)?new Date(event.end).getTime()-1:event.start)>=today).length;await count(page,upcomingCount);
  for(const id of ['santiago','ourense']){await page.locator(`.meet-card[data-motion-item="${id}"] .save-button`).click();await page.locator(`.meet-card[data-motion-item="${id}"] .save-button[aria-pressed=true]`).waitFor();}
  await page.getByRole('group',{name:'Estado de los encuentros'}).getByRole('button',{name:/^Archivo/}).click();await page.locator('.meet-card[data-motion-item="flutter"] .save-button').click();await page.locator('.meet-card[data-motion-item="flutter"] .save-button[aria-pressed=true]').waitFor();
  await savedLink(page).click();await page.waitForURL('**/guardados');await count(page,3);await active(page,'/guardados');
  await page.locator('.saved-page').waitFor();assert.equal(await page.title(),'Galicia Tech · Guardados');
  assert.equal(await page.locator('.agenda-page,.calendar-view,.featured-section,.scope-exit').count(),0);
  await page.getByText('Guardados en este navegador',{exact:true}).waitFor();
  const storage=page.locator('.saved-storage');assert.equal(await storage.getAttribute('open'),null);
  await storage.locator('summary').click();await storage.getByText('No necesitas iniciar sesión. Se eliminan si borras los datos de este sitio.',{exact:true}).waitFor();
  await storage.locator('summary').click();
  // Saved is a destination, not a toggle back to all events.
  await savedLink(page).click();await count(page,3);assert.equal(new URL(page.url()).pathname,'/guardados');
  await searchFor(page,'Buscar en guardados','DevFest');await setFilter(page,'Localidad','Santiago de Compostela');await count(page,1);
  await page.reload();await count(page,1);assert.equal(currentQuery(page),'DevFest');
  await nav(page,'Agenda').click();await page.waitForURL(url=>url.pathname==='/');await count(page,upcomingCount);
  assert.equal(currentQuery(page),'');assert.equal(await readFilter(page,'Localidad'),'');
  await page.goBack();await page.waitForURL(url=>url.pathname==='/guardados');await count(page,1);
  await nav(page,'Calendario').click();await page.waitForURL(url=>url.pathname==='/calendario');await page.locator('.calendar-view').waitFor();await active(page,'/calendario');
  assert.equal(currentQuery(page),'');assert.equal(new URL(page.url()).searchParams.get('guardados'),null);
  await goToMonth(page,'2026-11');await month(page,'2026-11');
  await page.locator('[data-day="2026-11-04"] .calendar-day-button').click();await page.locator('[data-calendar-event="santiago"]').waitFor();
  await page.locator('.calendar-event[href="/evento/ourense"]').first().waitFor();
  await searchFor(page,'Buscar eventos','DevFest');await setFilter(page,'Localidad','Santiago de Compostela');
  await nav(page,'Agenda').click();await page.waitForURL(url=>url.pathname==='/');await count(page,1);
  assert.equal(currentQuery(page),'DevFest');assert.equal(await readFilter(page,'Localidad'),'Santiago de Compostela');
  await nav(page,'Calendario').click();await page.waitForURL(url=>url.pathname==='/calendario');await month(page,'2026-11');
  // The collection never inherits discovery filters or a calendar month.
  await savedLink(page).click();await page.waitForURL('**/guardados');await count(page,3);assert.equal(new URL(page.url()).search,'');
  await page.locator('.meet-card[data-motion-item="santiago"] .save-button').click();await count(page,2);assert.equal(await savedLink(page).locator('small').innerText(),'2');
  await page.reload();await count(page,2);

  // Bookmarks to previous filters resolve to the collection, never a filtered calendar.
  for(const route of ['/?guardados=1&q=Flutter','/calendario?guardados=1&mes=2026-11&q=Flutter','/guardados?vista=calendario&mes=2026-11&q=Flutter','/?vista=calendario&guardados=1&mes=2026-11&q=Flutter']){
   await page.goto(base+route);await page.waitForURL(url=>url.pathname==='/guardados'&&url.searchParams.get('q')==='Flutter');await count(page,1);
   assert.equal(new URL(page.url()).searchParams.has('mes'),false);assert.equal(await page.locator('.calendar-view').count(),0);
  }
  await page.goto(base+'/?vista=calendario&mes=2026-11');await page.waitForURL(url=>url.pathname==='/calendario');await month(page,'2026-11');
  await page.locator('[data-day="2026-11-30"] .calendar-day-button').focus();await page.keyboard.press('ArrowRight');await month(page,'2026-12');
  await page.waitForFunction(()=>document.querySelector('[data-day="2026-12-01"] .calendar-day-button')===document.activeElement);
  await page.goBack();await month(page,'2026-11');await page.goForward();await month(page,'2026-12');
  await page.goto(base+'/calendario?mes=invalid');await page.locator('.calendar-view').waitFor();assert.match(await page.locator('.calendar-month-title-button').getAttribute('data-month'),/^\d{4}-\d{2}$/);
  await page.goto(base+'/guardados');await count(page,2);await dismissToast(page);
  for(const card of await page.locator('.saved-entry').all()){
   assert.equal(await card.locator('.meet-description').count(),1);assert.equal(await card.locator('.meet-fact').count(),3);assert(await card.locator('.meet-tags').count());
   const header=await card.locator('.saved-entry-header').boundingBox(),save=await card.locator('.save-button').boundingBox();
   assert(save.y>=header.y&&save.y+save.height<=header.y+header.height,'Save control belongs to the date header');
  }
  await page.screenshot({path:path.join(out,'saved-collection-light.png'),fullPage:true});
  for(const width of [1440,1120,1024,901,900,768,640,390,320]){
   await page.setViewportSize({width,height:1000});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`Collection overflow at ${width}px`);
   const mobile=width<=900;await active(page,'/guardados',mobile);assert.equal(await page.locator(mobile?'.mobile-nav a':'.desktop-nav a').count(),mobile?4:3);
   assert.equal(await savedLink(page,!mobile).isVisible(),false);
   if(!mobile)for(const link of await page.locator('.desktop-nav a').all()){
    const box=await link.boundingBox();for(const child of await link.locator(':scope > svg,:scope > span,:scope > small').all()){
     const item=await child.boundingBox();assert(item.x>=box.x&&item.x+item.width<=box.x+box.width+1,`Nav content fits at ${width}px`);
    }
   }
  }
  await page.setViewportSize({width:1440,height:1000});await page.getByRole('button',{name:'Activar modo oscuro'}).click();
  await page.screenshot({path:path.join(out,'saved-collection-dark.png'),fullPage:true});
  await page.locator('.language-button').click();await page.getByRole('heading',{name:/^Gardados/}).waitFor();assert.equal(await page.title(),'Galicia Tech · Gardados');
  for(const width of [390,320]){await page.setViewportSize({width,height:900});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`GL header overflow at ${width}px`);}
  await page.setViewportSize({width:390,height:900});await page.screenshot({path:path.join(out,'saved-collection-mobile-dark-gl.png'),fullPage:true});
  await page.evaluate(()=>window.scrollTo(0,600));assert((await savedLink(page,true).boundingBox()).y>=0,'The collection stays accessible while scrolling');
  await nav(page,'Axenda',true).click();await page.waitForURL(url=>url.pathname==='/');await count(page,upcomingCount);await active(page,'/',true);

  // Classification includes an event in progress, and is independent of the sample dates.
  const temporal=await browser.newContext({locale:'es-ES',viewport:{width:1440,height:1000},reducedMotion:'reduce'});
  await temporal.route('**/api/v1/catalog/',route=>route.fulfill({json:{...catalog,events:[
   {...catalog.events.find(e=>e.id==='flutter'),start:'2000-01-01T18:00:00+01:00',end:'2000-01-01T20:00:00+01:00'},
   {...catalog.events.find(e=>e.id==='santiago'),start:'2099-11-04T10:00:00+01:00',end:'2099-11-04T18:00:00+01:00'},
   {...catalog.events.find(e=>e.id==='ourense'),start:'2000-01-02T10:00:00+01:00',end:'2099-11-05T18:00:00+01:00'}
  ]}}));
  const timed=await temporal.newPage();timed.on('pageerror',error=>errors.push(error.message));await timed.goto(base+'/guardados');await timed.locator('.saved-empty').waitFor();
  await timed.evaluate(key=>localStorage.setItem(key,JSON.stringify(['flutter','santiago','ourense'])),key);await timed.reload();await count(timed,3);
  assert.deepEqual(await timed.locator('.saved-group[aria-labelledby="saved-proximos"] .meet-card').evaluateAll(cards=>cards.map(card=>card.dataset.motionItem)),['ourense','santiago']);
  await setFilter(timed,'Periodo de guardados','pasados');await count(timed,1);await timed.locator('.meet-card[data-motion-item="flutter"]').waitFor();
  await setFilter(timed,'Periodo de guardados','proximos');await count(timed,2);await timed.reload();await count(timed,2);
  await timed.goBack();await count(timed,1);await timed.goForward();await count(timed,2);
  await searchFor(timed,'Buscar en guardados','no-existing-event');await timed.getByRole('heading',{name:'No hay coincidencias'}).waitFor();
  await timed.locator('.saved-empty').getByRole('button',{name:'Limpiar filtros',exact:true}).click();await count(timed,3);
  for(const id of ['ourense','santiago','flutter'])await timed.locator(`.meet-card[data-motion-item="${id}"] .save-button`).click();
  await timed.locator('.saved-empty').waitFor();assert.equal(new URL(timed.url()).pathname,'/guardados');assert.equal(await savedLink(timed).locator('small').innerText(),'0');
  await temporal.close();

  const clean=await browser.newContext({locale:'es-ES',viewport:{width:390,height:900},reducedMotion:'reduce'});const fresh=await clean.newPage();fresh.on('pageerror',error=>errors.push(error.message));
  await fresh.goto(base+'/guardados');await fresh.locator('.saved-empty').waitFor();assert.equal(await fresh.locator('.event-filters').count(),0);await active(fresh,'/guardados',true);
  await fresh.getByRole('heading',{name:'Todavía no has guardado eventos'}).waitFor();
  await fresh.locator('.saved-empty').getByRole('link',{name:'Explorar eventos'}).click();await fresh.waitForURL(url=>url.pathname==='/');await count(fresh,upcomingCount);
  await clean.close();assert.deepEqual(errors,[]);
  fs.writeFileSync(path.join(out,'checks.json'),JSON.stringify({status:'passed',checks:['independent saved route','three destinations','no saved toggle','isolated collection filters','shared discovery filters','past/upcoming/in-progress','period and month history','legacy redirects','remove and counters','empty collection and search','calendar keyboard','responsive 320-1440px','GL/ES','light/dark'],errors},null,2));
  console.log('PASS navigation: independent saved collection, isolated filters, periods, history, legacy links and responsive GL/ES UI.');
 }catch(error){if(page)await page.screenshot({path:path.join(out,'failure.png'),fullPage:true}).catch(()=>{});throw error;}
 finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
