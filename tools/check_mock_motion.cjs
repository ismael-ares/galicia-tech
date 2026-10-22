const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const base=process.env.MOCK_URL||'http://127.0.0.1:8874';
const output=path.resolve(__dirname,'../output/next-mock');
(async()=>{
 const browser=await chromium.launch({headless:true,channel:process.env.PLAYWRIGHT_CHANNEL||'chrome'});
 const evidence=[];
 try{
  const page=await browser.newPage({viewport:{width:1440,height:1000},colorScheme:'light',locale:'es-ES'});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>{
   window.motionChecks={calls:0,finished:0};
   if(document.startViewTransition){const original=document.startViewTransition.bind(document);document.startViewTransition=(callback)=>{window.motionChecks.calls++;const transition=original(callback);transition.finished.catch(()=>{}).finally(()=>window.motionChecks.finished++);return transition;};}
  });
  await page.goto(base);await page.locator('.event-row').first().waitFor();
  await page.getByRole('button',{name:'Animar la vieira'}).click();await page.waitForTimeout(740);
  assert(await page.locator('.brand-symbol').evaluate(e=>e.classList.contains('shell-play')),'Las nervaduras no deben terminar prematuramente la animación del logo');
  await page.waitForFunction(()=>!document.querySelector('.brand-symbol').classList.contains('shell-play'));
  await page.getByRole('button',{name:'Filtros',exact:true}).click();await page.waitForFunction(()=>document.querySelector('#extra-filters').clientHeight>10);
  assert.equal(await page.locator('#extra-filters .motion-disclosure-clip').evaluate(e=>e.inert),false);
  await page.getByRole('button',{name:'Filtros',exact:true}).click();assert.equal(await page.locator('#extra-filters .motion-disclosure-clip').evaluate(e=>e.inert),true);
  await page.waitForFunction(()=>document.querySelector('#extra-filters').clientHeight<1);
  await page.getByRole('button',{name:'Activar modo oscuro'}).click();await page.waitForFunction(()=>document.documentElement.dataset.theme==='dark');
  await page.waitForFunction(()=>!document.documentElement.classList.contains('theme-changing'));
  assert((await page.evaluate(()=>window.motionChecks.calls))>0,'Cambio de tema sin transición nativa en navegador compatible');
  await page.evaluate(()=>{const button=document.querySelector('[aria-label="Activar modo claro"]');button.click();button.click();button.click();});
  await page.waitForFunction(()=>document.documentElement.dataset.theme==='light'&&!document.documentElement.classList.contains('theme-changing'));
  assert.equal(await page.evaluate(()=>localStorage.getItem('galicia-tech-theme')),'light');
  await page.locator('.event-row').first().getByRole('button',{name:/^Guardar:/}).click();assert.equal(await page.locator('.event-row').first().getByRole('button',{name:/^Quitar de guardados:/}).getAttribute('aria-pressed'),'true');
  await page.getByRole('textbox',{name:'Buscar eventos'}).fill('extreme');assert.equal(await page.locator('.event-row').count(),1);await page.waitForTimeout(400);
  await page.getByRole('textbox',{name:'Buscar eventos'}).fill('');await page.waitForTimeout(420);
  await page.getByRole('link',{name:/^Interfaces líquidas:/}).last().click();await page.waitForURL('**/evento/flutter');
  assert.equal(await page.locator('.route-stage').evaluate(e=>getComputedStyle(e).animationName),'page-enter');
  evidence.push({mode:'normal',nativeThemeTransitions:await page.evaluate(()=>window.motionChecks.calls),checks:['logo completo','disclosure accesible','tema animado','clics rápidos','guardado','filtros','entrada de página']});
  await page.emulateMedia({reducedMotion:'reduce'});await page.goto(base);await page.locator('.event-row').first().waitFor();
  const before=await page.evaluate(()=>window.motionChecks.calls);
  await page.getByRole('button',{name:'Activar modo oscuro'}).click();assert.equal(await page.locator('html').getAttribute('data-theme'),'dark');assert.equal(await page.evaluate(()=>window.motionChecks.calls),before);
  await page.getByRole('button',{name:'Animar la vieira'}).click();assert.equal(await page.locator('.brand-symbol').evaluate(e=>getComputedStyle(e).animationName),'none');
  await page.getByRole('textbox',{name:'Buscar eventos'}).fill('extreme');assert.equal(await page.evaluate(()=>document.querySelector('#event-list').getAnimations({subtree:true}).filter(a=>a.playState==='running').length),0);
  await page.getByRole('button',{name:'Filtros',exact:true}).click();assert.equal(await page.locator('#extra-filters').evaluate(e=>getComputedStyle(e).transitionDuration),'0s');
  evidence.push({mode:'reduced',checks:['tema inmediato','sin animaciones de logo ni listas','disclosure inmediato']});
  await page.emulateMedia({reducedMotion:'no-preference'});await page.evaluate(()=>{document.startViewTransition=undefined;});
  await page.getByRole('button',{name:'Activar modo claro'}).click();assert.equal(await page.locator('html').getAttribute('data-theme'),'light');
  await page.setViewportSize({width:390,height:844});await page.goto(base);assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  assert.deepEqual(errors,[]);fs.mkdirSync(output,{recursive:true});fs.writeFileSync(path.join(output,'motion-checks.json'),JSON.stringify({status:'passed',evidence,fallback:'sin API nativa',mobile:390,errors,at:new Date().toISOString()},null,2));
  console.log('PASS movimiento: logo, filtros, navegación, guardados, tema, cambios rápidos, reducción de movimiento, fallback y móvil.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
