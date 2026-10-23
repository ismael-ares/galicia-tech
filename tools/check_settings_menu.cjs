// Real local sessions, menu keyboard behavior and browser preferences. No catalog mutations.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const base=process.env.APP_URL||'http://127.0.0.1:8088';
const out=path.resolve(__dirname,'../output/settings-menu');
fs.mkdirSync(out,{recursive:true});
const menu=page=>page.getByRole('menu');
const trigger=page=>page.locator('.settings-trigger');
async function open(page){await trigger(page).click();await menu(page).waitFor();}
async function closed(page){await menu(page).waitFor({state:'detached'});assert.equal(await trigger(page).getAttribute('aria-expanded'),'false');}
async function fit(page){
 for(const width of [1440,1024,900,768,390,320]){
  await page.setViewportSize({width,height:900});
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`Page fits ${width}px`);
  const box=await menu(page).boundingBox();
  assert(box.x>=0&&box.x+box.width<=width,`Menu fits ${width}px`);
 }
}
async function login(page,name){
 await page.goto(base+'/login');
 await page.getByLabel('Usuario o correo electrónico',{exact:true}).fill(name);
 await page.getByLabel('Contraseña',{exact:true}).fill(name);
 await page.getByRole('button',{name:'Entrar',exact:true}).click();
 await page.waitForURL('**/cuenta');
}
(async()=>{
 const browser=await chromium.launch({channel:process.env.PLAYWRIGHT_CHANNEL||'chrome',headless:true});
 const errors=[];let page;
 try{
  const guest=await browser.newContext({locale:'es-ES',viewport:{width:1440,height:1000},reducedMotion:'reduce'});
  page=await guest.newPage();page.on('pageerror',error=>errors.push(error.message));
  const flags=await(await page.request.get(base+'/api/v1/session/')).json();
  assert(flags.usernameLoginEnabled&&!flags.requireAdminMfa,'Use the explicit local profile');
  await page.goto(base);await page.locator('.agenda-page').waitFor();await trigger(page).waitFor();
  assert.equal(await page.locator('.header-actions .account-button').count(),0);
  await open(page);
  assert.equal(await menu(page).getByRole('menuitem',{name:/Administración/}).count(),0);
  assert.equal(await menu(page).getByRole('menuitem',{name:'Crear cuenta',exact:true}).count(),flags.registrationEnabled?1:0);
  assert(await menu(page).getByRole('menuitem',{name:/Tu cuenta/}).evaluate(el=>el===document.activeElement));
  await page.screenshot({path:path.join(out,'visitor-desktop-light.png')});
  await page.keyboard.press('End');
  assert(await menu(page).getByRole('menuitem').last().evaluate(el=>el===document.activeElement));
  await page.keyboard.press('ArrowDown');
  assert(await menu(page).getByRole('menuitem').first().evaluate(el=>el===document.activeElement));
  await page.keyboard.press('ArrowUp');
  assert(await menu(page).getByRole('menuitem').last().evaluate(el=>el===document.activeElement));
  await page.keyboard.press('Escape');await closed(page);
  assert(await trigger(page).evaluate(el=>el===document.activeElement));
  await trigger(page).press('ArrowUp');await menu(page).waitFor();
  assert(await menu(page).getByRole('menuitem').last().evaluate(el=>el===document.activeElement));
  await page.keyboard.press('Home');await page.keyboard.press('ArrowDown');await page.keyboard.press('Space');
  await page.waitForURL('**/preferencias');await closed(page);
  await page.getByRole('heading',{name:'Preferencias.',exact:true}).waitFor();
  await open(page);assert.equal(await menu(page).getByRole('menuitem',{name:/Preferencias/}).getAttribute('aria-current'),'page');
  await page.getByRole('heading',{name:'Preferencias.',exact:true}).click();await closed(page);
  await open(page);await page.keyboard.press('Tab');await closed(page);
  await page.getByRole('radio',{name:'Oscuro',exact:true}).check();
  await page.getByRole('radio',{name:/Galego/}).check();
  await page.reload();await page.locator('.preferences-page').waitFor();
  assert.equal(await page.title(),'Galicia Tech · Preferencias');
  assert.equal(await page.locator('html').getAttribute('data-theme'),'dark');
  assert.equal(await page.locator('html').getAttribute('lang'),'gl');
  await open(page);await menu(page).getByRole('menuitem',{name:/A túa conta/}).waitFor();
  await fit(page);await page.screenshot({path:path.join(out,'visitor-mobile-dark-gl.png')});
  await page.keyboard.press('Escape');
  await page.setViewportSize({width:1440,height:1000});
  await page.screenshot({path:path.join(out,'preferences-desktop-dark-gl.png')});
  await page.getByRole('radio',{name:/Castellano/}).check();await page.getByRole('radio',{name:'Claro',exact:true}).check();
  await page.setViewportSize({width:390,height:950});await page.screenshot({path:path.join(out,'preferences-mobile-light.png'),fullPage:true});
  await open(page);await menu(page).getByRole('menuitem',{name:/Tu cuenta/}).click();
  await page.waitForURL('**/cuenta');await page.locator('.event-portal').waitFor();await closed(page);
  await guest.close();
  for(const name of ['user','admin']){
   const context=await browser.newContext({locale:'es-ES',viewport:{width:1440,height:1000},reducedMotion:'reduce'});
   page=await context.newPage();page.on('pageerror',error=>errors.push(error.message));
   await login(page,name);await open(page);
   assert.equal(await menu(page).getByRole('menuitem',{name:/Iniciar sesión|Crear cuenta/}).count(),0);
   assert.equal(await menu(page).getByRole('menuitem',{name:/Administración/}).count(),name==='admin'?1:0);
   assert(await page.locator('.settings-identity').innerText());
   if(name==='admin'){
    await menu(page).getByRole('menuitem',{name:/Administración/}).click();await page.waitForURL('**/admin');
    await page.locator('.admin-tabs').waitFor();await closed(page);await open(page);
    assert.equal(await menu(page).getByRole('menuitem',{name:/Administración/}).getAttribute('aria-current'),'page');
    await page.screenshot({path:path.join(out,'administrator-desktop-light.png')});
   }
   await menu(page).getByRole('menuitem',{name:'Cerrar sesión',exact:true}).click();
   await page.waitForURL(base+'/');await closed(page);
   assert.equal((await(await page.request.get(base+'/api/v1/session/')).json()).user,null);
   await open(page);await menu(page).getByRole('menuitem',{name:'Iniciar sesión',exact:true}).waitFor();
   await context.close();
  }
  assert.deepEqual(errors,[]);
  fs.writeFileSync(path.join(out,'checks.json'),JSON.stringify({status:'passed',checks:['real guest/user/admin sessions','conditional administration and auth actions','menu focus, arrows, Home/End and wrap','Escape restores focus','Tab and outside dismissal','route changes close menu','independent anonymous preferences','preferences survive reload','real logout from portal and administration','320–1440px','GL/ES','light/dark','no catalog mutations'],errors},null,2));
  console.log('PASS settings menu: real sessions, role-aware links, keyboard, preferences and responsive GL/ES.');
 }catch(error){if(page&&!page.isClosed())await page.screenshot({path:path.join(out,'failure.png')}).catch(()=>{});throw error;}
 finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
