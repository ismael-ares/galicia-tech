const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const base=process.env.APP_URL||'http://127.0.0.1:8088';
const out=path.resolve(__dirname,'../output/navigation');fs.mkdirSync(out,{recursive:true});
const storageKey='galicia-tech-guest-favorites-v1';
const count=(page,n)=>page.waitForFunction(n=>document.querySelectorAll('.meet-card').length===n,n);
async function active(page,href,nav='.desktop-nav'){
 await page.locator(`${nav} a[href="${href}"][aria-current="page"]`).waitFor();
 assert.equal(await page.locator(`${nav} [aria-current="page"]`).count(),1);
}
(async()=>{
 const browser=await chromium.launch({channel:process.env.PLAYWRIGHT_CHANNEL||'chrome',headless:true});
 const context=await browser.newContext({locale:'es-ES',viewport:{width:1440,height:1100},reducedMotion:'reduce'});
 const errors=[];
 try{
  const page=await context.newPage();page.on('pageerror',error=>errors.push(error.message));
  await page.goto(base);await page.locator('.agenda-page').waitFor();await active(page,'/');
  assert.equal(await page.locator('.event-view-switch').count(),0);assert.equal(await page.locator('.desktop-nav a').count(),3);
  const catalog=await (await page.request.get(base+'/api/v1/catalog/')).json();
  const day=value=>new Intl.DateTimeFormat('en-CA',{year:'numeric',month:'2-digit',day:'2-digit',timeZone:'Europe/Madrid'}).format(new Date(value));
  const today=day(new Date());
  const ids=['flutter','santiago'];const savedEvents=catalog.events.filter(e=>ids.includes(e.id));assert.equal(savedEvents.length,2,'Load the local event sample first');
  const future=savedEvents.filter(e=>day(e.end||e.start)>=today).length;
  await count(page,catalog.events.length);
  await page.locator('.desktop-nav a[href="/calendario"]').click();await page.waitForURL('**/calendario');await page.locator('.calendar-view').waitFor();await active(page,'/calendario');
  assert.equal(await page.title(),'Galicia Tech · Calendario');
  assert.equal(await page.locator('.featured-section').count(),0);
  assert.equal(await page.getByRole('group',{name:'Eventos del calendario'}).getByRole('button',{name:'Todos los eventos',exact:true}).getAttribute('aria-pressed'),'true');
  await page.goto(base+'/calendario?mes=2026-11');await page.locator('#calendar-month-title').getByText('noviembre de 2026',{exact:true}).waitFor();
  await page.getByRole('button',{name:'Mes siguiente',exact:true}).click();await page.waitForURL('**/calendario?mes=2026-12');
  await page.goBack();await page.waitForURL('**/calendario?mes=2026-11');
  await page.goForward();await page.waitForURL('**/calendario?mes=2026-12');
  await page.goBack();await page.waitForURL('**/calendario?mes=2026-11');await page.getByRole('button',{name:'Mes anterior',exact:true}).click();await page.waitForURL('**/calendario?mes=2026-10');
  await page.goBack();await page.waitForURL('**/calendario?mes=2026-11');
  await page.getByLabel('Buscar eventos').fill('DevFest');await page.getByLabel('Localidad').selectOption('Ourense');
  await page.reload();await page.locator('.calendar-view').waitFor();assert.equal(await page.getByLabel('Buscar eventos').inputValue(),'DevFest');assert.equal(await page.getByLabel('Localidad').inputValue(),'Ourense');
  await page.locator('[data-day="2026-11-07"] .calendar-day-button').click();await page.locator('[data-calendar-event="ourense"]').waitFor();assert.equal(await page.locator('.calendar-event[href="/evento/santiago"]').count(),0);
  await page.getByRole('button',{name:'Limpiar filtros',exact:true}).click();await page.locator('.calendar-event[href="/evento/santiago"]').first().waitFor();
  await page.locator('[data-day="2026-11-30"] .calendar-day-button').focus();await page.keyboard.press('ArrowRight');await page.waitForURL('**/calendario?mes=2026-12');assert.equal(await page.locator('[data-day="2026-12-01"] .calendar-day-button').evaluate(el=>el===document.activeElement),true);

  await page.evaluate(({storageKey,ids})=>localStorage.setItem(storageKey,JSON.stringify(ids)),{storageKey,ids});
  await page.locator('.desktop-nav a[href="/guardados"]').click();await page.waitForURL('**/guardados');await page.reload();await count(page,2);await active(page,'/guardados');
  await page.getByRole('group',{name:'Filtrar guardados'}).getByRole('button',{name:/Por venir/}).click();await count(page,future);
  if(future){await page.getByLabel('Buscar eventos').fill('nothing-matches-this-search');await page.getByRole('heading',{name:'No hay coincidencias',exact:true}).waitFor();await page.getByLabel('Buscar eventos').fill('');await count(page,future);}
  await page.getByRole('group',{name:'Filtrar guardados'}).getByRole('button',{name:/Pasados/}).click();await count(page,2-future);
  await page.getByRole('group',{name:'Filtrar guardados'}).getByRole('button',{name:/Todos/}).click();await count(page,2);
  await page.screenshot({path:path.join(out,'saved-desktop-light.png'),fullPage:true});
  await page.getByRole('link',{name:/Ver en calendario/}).click();await page.locator('.calendar-view').waitFor();await active(page,'/calendario');
  assert.equal(new URL(page.url()).searchParams.get('guardados'),'1');
  await page.goto(base+'/calendario?guardados=1&mes=2026-11');await page.locator('[data-day="2026-11-04"] .calendar-day-button').click();await page.locator('[data-calendar-event="santiago"]').waitFor();
  await page.locator('[data-calendar-event="santiago"] .save-button').click();await page.locator('[data-calendar-event="santiago"]').waitFor({state:'detached'});
  assert.deepEqual(await page.evaluate(storageKey=>JSON.parse(localStorage.getItem(storageKey)),storageKey),['flutter']);
  await page.getByRole('button',{name:'Todos los eventos',exact:true}).click();assert.equal(new URL(page.url()).searchParams.get('guardados'),null);
  await page.locator('[data-calendar-event="santiago"]').waitFor();
  await page.getByRole('button',{name:'Solo guardados',exact:false}).click();await page.locator('[data-calendar-event="santiago"]').waitFor({state:'detached'});
  await page.goBack();await page.getByRole('button',{name:'Todos los eventos',exact:true}).waitFor();assert.equal(new URL(page.url()).searchParams.get('guardados'),null);

  await page.goto(base+'/?vista=calendario&mes=2026-11');await page.waitForURL('**/calendario?mes=2026-11');await active(page,'/calendario');
  await page.goto(base+'/guardados?vista=calendario&mes=2026-11');await page.waitForURL('**/calendario?mes=2026-11&guardados=1');await active(page,'/calendario');
  await page.goto(base+'/calendario?mes=invalid');await page.locator('.calendar-view').waitFor();assert.equal(await page.locator('input[type=month]').inputValue(),today.slice(0,7));
  await page.goto(base+'/calendario?mes=2026-11');await page.locator('[data-day="2026-11-04"] .calendar-day-button').click();await page.locator('[data-calendar-event="santiago"]').waitFor();
  await page.screenshot({path:path.join(out,'calendar-desktop-light.png'),fullPage:true});
  for(const width of [1440,1024,901,900,768,640,390,320]){
   await page.setViewportSize({width,height:1000});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`Calendar overflow at ${width}px`);
   if(width<=900){assert(await page.locator('.mobile-nav').isVisible());await active(page,'/calendario','.mobile-nav');assert.equal(await page.locator('.mobile-nav a').count(),4);}
   else assert(await page.locator('.desktop-nav').isVisible());
  }
  await page.setViewportSize({width:390,height:900});await page.getByRole('button',{name:'Activar modo oscuro'}).click();await page.locator('.language-button').click();
  assert.equal(await page.locator('html').getAttribute('lang'),'gl');assert.equal(await page.title(),'Galicia Tech · Calendario');
  await page.locator('.mobile-nav a[href="/calendario"]').getByText('Calendario',{exact:true}).waitFor();
  await page.screenshot({path:path.join(out,'calendar-mobile-dark-gl.png'),fullPage:true});
  await page.locator('.mobile-nav a[href="/guardados"]').click();await count(page,1);await active(page,'/guardados','.mobile-nav');
  assert.equal(await page.title(),'Galicia Tech · Gardados');
  for(const width of [390,320]){await page.setViewportSize({width,height:900});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`Saved overflow at ${width}px`);}
  await page.screenshot({path:path.join(out,'saved-mobile-dark-gl.png'),fullPage:true});
  await page.locator('.mobile-nav a[href="/"]').click();await count(page,catalog.events.length);await active(page,'/','.mobile-nav');assert.equal(await page.title(),'Galicia Tech · Axenda');
  const freshContext=await browser.newContext({locale:'es-ES',viewport:{width:390,height:900},reducedMotion:'reduce'});const fresh=await freshContext.newPage();
  await fresh.goto(base+'/calendario?guardados=1&mes=2026-11');await fresh.locator('.calendar-saved-empty').waitFor();
  await fresh.getByRole('button',{name:'Todos los eventos',exact:true}).click();await fresh.locator('.calendar-event[href="/evento/santiago"]').first().waitFor({state:'attached'});await fresh.locator('.calendar-saved-empty').waitFor({state:'detached'});
  await fresh.goto(base+'/guardados');await fresh.locator('.collection-empty').waitFor();assert.equal(await fresh.locator('.event-filters').count(),0);
  await freshContext.close();assert.deepEqual(errors,[]);
  fs.writeFileSync(path.join(out,'checks.json'),JSON.stringify({status:'passed',checks:['three destinations','active links','dedicated calendar route','URL month/filters and reload','Back/Forward','keyboard month boundary','saved upcoming/past','saved calendar link','calendar bookmark removal','saved-only scope','legacy links','invalid month','desktop/tablet/mobile','light/dark','GL/ES','empty states'],errors},null,2));
  console.log('PASS navigation: dedicated calendar, saved collection, filters/history, keyboard, old links and responsive GL/ES UI.');
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
