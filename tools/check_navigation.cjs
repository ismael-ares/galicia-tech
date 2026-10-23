const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const base=process.env.APP_URL||'http://127.0.0.1:8088';
const out=path.resolve(__dirname,'../output/navigation');fs.mkdirSync(out,{recursive:true});
const count=(page,n)=>page.waitForFunction(n=>document.querySelectorAll('.meet-card').length===n,n);
const nav=(page,label,mobile=false)=>page.locator(mobile?'.mobile-nav':'.desktop-nav').getByRole('link',{name:label,exact:true});
const scope=page=>page.locator('.saved-filter-button');
async function active(page,path,mobile=false){
 const links=page.locator((mobile?'.mobile-nav':'.desktop-nav')+' [aria-current="page"]');
 await links.waitFor();assert.equal(await links.count(),1);assert.equal(new URL(await links.getAttribute('href'),base).pathname,path);
}
async function month(page,value){await page.waitForFunction(value=>new URL(location.href).searchParams.get('mes')===value,value);}
async function savedScope(page,value){await page.locator(`.saved-filter-button[aria-pressed="${value}"]`).waitFor();assert.equal(new URL(page.url()).searchParams.get('guardados'),value?'1':null);}
(async()=>{
 const browser=await chromium.launch({channel:process.env.PLAYWRIGHT_CHANNEL||'chrome',headless:true});
 const context=await browser.newContext({locale:'es-ES',viewport:{width:1440,height:1100},reducedMotion:'reduce'});
 const errors=[];let page;
 try{
  page=await context.newPage();page.on('pageerror',error=>errors.push(error.message));
  await page.goto(base);await page.locator('.agenda-page').waitFor();await active(page,'/');
  assert.equal(await page.locator('.desktop-nav a').count(),2);
  assert.equal(await page.locator('.desktop-nav a[href^="/guardados"]').count(),0);
  assert.equal(await page.locator('.event-view-switch').count(),0);
  const catalog=await (await page.request.get(base+'/api/v1/catalog/')).json();await count(page,catalog.events.length);
  for(const id of ['flutter','santiago']){await page.locator(`.meet-card[data-motion-item="${id}"] .save-button`).click();await page.locator(`.meet-card[data-motion-item="${id}"] .save-button[aria-pressed=true]`).waitFor();}
  await scope(page).click();await savedScope(page,true);await count(page,2);await active(page,'/');
  assert.equal(new URL(page.url()).pathname,'/');await page.getByRole('heading',{name:'Tus guardados.',exact:true}).waitFor();
  assert.equal(await page.locator('.featured-section').count(),0);await page.locator('.scope-exit').waitFor();
  if(await page.getByRole('button',{name:'Cerrar aviso',exact:true}).count())await page.getByRole('button',{name:'Cerrar aviso',exact:true}).click();
  await page.screenshot({path:path.join(out,'saved-agenda-light.png'),fullPage:true});
  await nav(page,'Calendario').click();await page.waitForURL(url=>url.pathname==='/calendario');await page.locator('.calendar-view').waitFor();await active(page,'/calendario');await savedScope(page,true);
  assert.equal(await page.title(),'Galicia Tech · Guardados · Calendario');assert.equal(await page.locator('.calendar-scope,.collection-calendar-link').count(),0);
  await page.getByLabel('Ir a un mes').fill('2026-11');await month(page,'2026-11');
  await page.locator('[data-day="2026-11-04"] .calendar-day-button').click();await page.locator('[data-calendar-event="santiago"]').waitFor();
  assert.equal(await page.locator('.calendar-event[href="/evento/ourense"]').count(),0);
  await scope(page).click();await savedScope(page,false);await active(page,'/calendario');await month(page,'2026-11');await page.locator('.calendar-event[href="/evento/ourense"]').first().waitFor();
  assert.equal(await page.locator('h1').innerText(),'Calendario.');
  await scope(page).click();await savedScope(page,true);await page.getByRole('link',{name:'Ver todos los eventos',exact:true}).click();await savedScope(page,false);await active(page,'/calendario');await month(page,'2026-11');
  await scope(page).click();await savedScope(page,true);
  await page.getByRole('button',{name:'Mes siguiente',exact:true}).click();await month(page,'2026-12');await page.locator('.calendar-saved-month-empty').waitFor();
  await page.goBack();await month(page,'2026-11');await savedScope(page,true);
  await page.goForward();await month(page,'2026-12');await page.getByRole('button',{name:'Ir a un mes con guardados',exact:true}).click();await month(page,'2026-11');

  // Scope and content filters survive view changes, reload, and browser history.
  await page.getByLabel('Buscar eventos').fill('DevFest');await page.getByLabel('Localidad').selectOption('Santiago de Compostela');
  await nav(page,'Agenda').click();await page.waitForURL(url=>url.pathname==='/');await count(page,1);await savedScope(page,true);
  assert.equal(await page.getByLabel('Buscar eventos').inputValue(),'DevFest');assert.equal(await page.getByLabel('Localidad').inputValue(),'Santiago de Compostela');
  await page.reload();await count(page,1);assert.equal(await page.title(),'Galicia Tech · Guardados · Agenda');
  await nav(page,'Calendario').click();await page.waitForURL(url=>url.pathname==='/calendario');await month(page,'2026-11');await savedScope(page,true);
  assert.equal(await page.getByLabel('Buscar eventos').inputValue(),'DevFest');assert.equal(await page.getByLabel('Localidad').inputValue(),'Santiago de Compostela');
  await page.getByRole('button',{name:'Limpiar filtros',exact:true}).click();assert.equal(await page.getByLabel('Buscar eventos').inputValue(),'');
  await page.locator('[data-day="2026-11-30"] .calendar-day-button').focus();await page.keyboard.press('ArrowRight');await month(page,'2026-12');
  await page.waitForFunction(()=>document.querySelector('[data-day="2026-12-01"] .calendar-day-button')===document.activeElement);
  await page.getByRole('button',{name:'Ir a un mes con guardados',exact:true}).click();await month(page,'2026-11');
  await page.locator('[data-day="2026-11-04"] .calendar-day-button').click();await page.locator('[data-calendar-event="santiago"] .save-button').click();await page.locator('[data-calendar-event="santiago"]').waitFor({state:'detached'});
  await savedScope(page,true);assert.equal(await scope(page).locator('small').innerText(),'1');
  await page.getByRole('button',{name:'Mostrar todos los eventos',exact:true}).click();await savedScope(page,false);await page.locator('[data-calendar-event="santiago"]').waitFor();
  await page.locator('[data-calendar-event="santiago"] .save-button').click();await page.locator('[data-calendar-event="santiago"] .save-button[aria-pressed=true]').waitFor();

  // Bookmarks to previous saved pages preserve the collection and the intended view.
  await page.goto(base+'/guardados?mes=2026-11&q=DevFest');await page.waitForURL(url=>url.pathname==='/'&&url.searchParams.get('guardados')==='1');await count(page,1);assert.equal(new URL(page.url()).searchParams.get('q'),'DevFest');
  await page.goto(base+'/guardados?vista=calendario&mes=2026-11');await page.waitForURL(url=>url.pathname==='/calendario'&&url.searchParams.get('guardados')==='1');await month(page,'2026-11');
  await page.goto(base+'/?vista=calendario&mes=2026-11&guardados=1');await page.waitForURL(url=>url.pathname==='/calendario'&&url.searchParams.get('guardados')==='1');await month(page,'2026-11');
  await page.goto(base+'/calendario?mes=invalid');await page.locator('.calendar-view').waitFor();assert.match(await page.locator('input[type=month]').inputValue(),/^\d{4}-\d{2}$/);
  await page.goto(base+'/calendario?guardados=1&mes=2026-11');await page.locator('[data-day="2026-11-04"] .calendar-day-button').click();await page.locator('[data-calendar-event="santiago"]').waitFor();
  await page.screenshot({path:path.join(out,'saved-calendar-light.png'),fullPage:true});
  for(const width of [1440,1120,1024,901,900,768,640,390,320]){
   await page.setViewportSize({width,height:1000});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`Calendar overflow at ${width}px`);
   const items=page.locator(width<=900?'.mobile-nav a':'.desktop-nav a');assert.equal(await items.count(),width<=900?3:2);await active(page,'/calendario',width<=900);
   const button=await scope(page).boundingBox(),account=await page.locator('.header-actions .account-button').boundingBox();assert(button&&account&&button.x+button.width<=account.x,'Header controls must not overlap');
  }
  await page.setViewportSize({width:390,height:900});await page.getByRole('button',{name:'Activar modo oscuro'}).click();await page.locator('.language-button').click();
  await page.getByRole('heading',{name:'Os teus gardados.',exact:true}).waitFor();assert.equal(await page.title(),'Galicia Tech · Gardados · Calendario');
  for(const width of [390,320]){await page.setViewportSize({width,height:900});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`GL header overflow at ${width}px`);}
  await page.setViewportSize({width:390,height:900});
  await page.screenshot({path:path.join(out,'saved-calendar-mobile-dark-gl.png'),fullPage:true});
  await page.evaluate(()=>window.scrollTo(0,600));assert((await scope(page).boundingBox()).y>=0,'The collection filter stays visible while scrolling');
  await nav(page,'Axenda',true).click();await page.waitForURL(url=>url.pathname==='/');await count(page,2);await savedScope(page,true);await active(page,'/',true);
  assert.equal(await page.title(),'Galicia Tech · Gardados · Axenda');await page.screenshot({path:path.join(out,'saved-agenda-mobile-dark-gl.png'),fullPage:true});
  await scope(page).click();await savedScope(page,false);await count(page,catalog.events.length);await page.locator('.featured-section').waitFor();

  const freshContext=await browser.newContext({locale:'es-ES',viewport:{width:390,height:900},reducedMotion:'reduce'});const fresh=await freshContext.newPage();
  await fresh.goto(base+'/calendario?mes=2026-11');await fresh.locator('.calendar-view').waitFor();await scope(fresh).click();await savedScope(fresh,true);await fresh.locator('.calendar-saved-empty').waitFor();
  await fresh.getByRole('link',{name:'Ver todos los eventos',exact:true}).click();await savedScope(fresh,false);assert.equal(new URL(fresh.url()).pathname,'/calendario');await month(fresh,'2026-11');
  await fresh.goto(base+'/?guardados=1');await fresh.locator('.saved-empty').waitFor();assert.equal(await fresh.locator('.event-filters').count(),0);
  await scope(fresh).click();await savedScope(fresh,false);await count(fresh,catalog.events.length);
  await freshContext.close();assert.deepEqual(errors,[]);
  fs.writeFileSync(path.join(out,'checks.json'),JSON.stringify({status:'passed',checks:['two views','one global saved filter','scope preserved across views','content filters preserved','clear scope in place','month history','keyboard','empty saved month shortcut','save/remove in calendar','legacy redirects','responsive header','sticky mobile filter','GL/ES','light/dark','empty collection'],errors},null,2));
  console.log('PASS navigation: two views and one persistent saved filter, history, old links, empty states and responsive GL/ES UI.');
 }catch(error){if(page)await page.screenshot({path:path.join(out,'failure.png'),fullPage:true}).catch(()=>{});throw error;}
 finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
