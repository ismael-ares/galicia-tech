// Run against the local sample deployment. Creates and removes its own normal user.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const {execFileSync}=require('node:child_process');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const docker=process.env.DOCKER_BIN||'docker';
const base=process.env.APP_URL||'http://127.0.0.1:8088';
const root=path.resolve(__dirname,'..');
const out=path.join(root,'output','guest-favorites');fs.mkdirSync(out,{recursive:true});
const key='galicia-tech-guest-favorites-v1';
const options={channel:process.env.PLAYWRIGHT_CHANNEL||'chrome',headless:true,locale:'es-ES',viewport:{width:1440,height:1000},reducedMotion:'reduce'};
function manage(code,input){return execFileSync(docker,['compose','exec','-T','backend','python','manage.py','shell','-c',code],{cwd:root,input:JSON.stringify(input),encoding:'utf8',stdio:['pipe','pipe','pipe']});}
const card=(page,id)=>page.locator(`.meet-card[data-motion-item="${id}"]`);
const saved=(page,id,value)=>card(page,id).locator(`.save-button[aria-pressed="${value}"]`).waitFor();
const count=(page,n)=>page.waitForFunction(n=>document.querySelectorAll('.meet-card').length===n,n);
async function stored(page){return page.evaluate(key=>JSON.parse(localStorage.getItem(key)||'[]'),key);}
async function guest(page){assert.equal((await (await page.request.get(base+'/api/v1/session/')).json()).user,null);}

(async()=>{
 const profile=fs.mkdtempSync(path.join(out,'profile-'));
 const email='qa-guest-'+crypto.randomUUID()+'@example.org';
 const password=crypto.randomBytes(24).toString('base64url');
 let context,browser,created=false;const errors=[],mutations=[];
 function observe(page){page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(r.url().includes('/api/v1/favorites/')&&r.method()!=='GET')mutations.push(r.method()+' '+new URL(r.url()).pathname);});}
 try{
  context=await chromium.launchPersistentContext(profile,options);
  let page=await context.newPage();observe(page);
  await page.goto(base);await card(page,'santiago').waitFor();await guest(page);
  await card(page,'santiago').locator('.save-button').click();await saved(page,'santiago',true);
  assert.deepEqual(await stored(page),['santiago']);
  await page.goto(base+'/guardados');await count(page,1);
  await page.getByText('Guardados en este navegador',{exact:true}).waitFor();
  await page.reload();await card(page,'santiago').waitFor();await guest(page);
  // Chrome's actual persistent profile survives closing and restarting the browser.
  await context.close();context=await chromium.launchPersistentContext(profile,options);
  page=await context.newPage();observe(page);
  await page.goto(base+'/guardados');await card(page,'santiago').waitFor();await guest(page);
  assert.deepEqual(await stored(page),['santiago']);

  const tab=await context.newPage();observe(tab);await tab.goto(base);await saved(tab,'ourense',false);
  await tab.locator('.meet-card[data-motion-item="ourense"] .save-button').click();await saved(tab,'ourense',true);
  await card(page,'ourense').waitFor();await count(page,2);
  // A stale tab must read the latest list when toggling another event.
  await card(page,'santiago').locator('.save-button').click();await card(page,'santiago').waitFor({state:'detached'});
  await saved(tab,'santiago',false);assert.deepEqual(await stored(page),['ourense']);
  await page.goto(base+'/evento/ourense');await page.locator('.detail-save .save-button[aria-pressed="true"]').waitFor();
  await page.locator('.detail-save .save-button').click();await page.locator('.detail-save .save-button[aria-pressed="false"]').waitFor();
  await saved(tab,'ourense',false);await tab.close();
  await page.locator('.detail-save .save-button').click();await page.locator('.detail-save .save-button[aria-pressed="true"]').waitFor();
  await page.goto(base+'/guardados?vista=calendario&mes=2026-11');await page.locator('.calendar-view').waitFor();
  await page.locator('[data-day="2026-11-07"] .calendar-day-button').click();
  await page.locator('[data-calendar-event="ourense"]').waitFor();
  assert.deepEqual(mutations,[],'Visitors must not write favorites to the API');

  // Malformed/invalid local data is ignored, without making the catalogue unusable.
  await page.evaluate(key=>localStorage.setItem(key,'{broken'),key);await page.goto(base+'/guardados');
  await page.getByRole('heading',{name:'Todavía no has guardado eventos'}).waitFor();
  await page.evaluate(key=>localStorage.setItem(key,JSON.stringify(['ourense',null,{},'../bad','ourense'])),key);await page.reload();await count(page,1);
  await page.evaluate(key=>localStorage.clear(),key);await page.reload();await page.locator('.empty-state').waitFor();
  await page.goto(base);await card(page,'ourense').locator('.save-button').click();await saved(page,'ourense',true);

  // Login never imports visitor selections automatically; explicit import is additive.
  manage("import json,sys; from core.models import User,Favorite; from allauth.account.models import EmailAddress; d=json.loads(sys.stdin.read()); u=User.objects.create_user(d['email'],email=d['email'],password=d['password']); EmailAddress.objects.create(user=u,email=u.email,verified=True,primary=True); Favorite.objects.create(user=u,event_id='santiago')",{email,password});created=true;
  await page.goto(base+'/login');await page.getByLabel('Correo electrónico').fill(email);await page.getByLabel('Contraseña',{exact:true}).fill(password);await page.getByRole('button',{name:'Entrar',exact:true}).click();await page.waitForURL('**/cuenta');
  await page.goto(base+'/guardados');await count(page,1);await card(page,'santiago').waitFor();
  await page.getByText('Guardados en tu cuenta',{exact:true}).waitFor();
  assert.deepEqual(mutations,[],'Login must not upload local favorites');
  const importButton=page.getByRole('button',{name:/Añadir guardados del navegador/});await importButton.click();
  await count(page,2);await importButton.waitFor({state:'detached'});
  assert.deepEqual(mutations,['POST /api/v1/favorites/import/']);
  assert.deepEqual(await stored(page),['ourense'],'Private account favorites must never be written to local storage');
  await page.reload();await count(page,2);
  await page.goto(base+'/cuenta');await page.getByRole('button',{name:'Cerrar sesión',exact:true}).click();
  await page.getByRole('link',{name:'Iniciar sesión',exact:true}).waitFor();
  await page.goto(base+'/guardados');await count(page,1);await card(page,'ourense').waitFor();await guest(page);
  await page.screenshot({path:path.join(out,'saved-guest-light.png'),fullPage:true});
  await page.getByRole('button',{name:'Activar modo oscuro'}).click();await page.locator('.language-button').click();
  await page.getByText('Gardados neste navegador',{exact:true}).waitFor();
  for(const width of [390,320]){await page.setViewportSize({width,height:900});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`No overflow at ${width}px`);}
  await page.screenshot({path:path.join(out,'saved-guest-mobile-dark-gl.png'),fullPage:true});
  await page.locator('.language-button').click();

  // A browser that denies persistence must show failure and keep its bookmark unset.
  browser=await chromium.launch({channel:options.channel,headless:true});
  const denied=await browser.newContext({locale:'es-ES',reducedMotion:'reduce'});
  await denied.addInitScript(key=>{const original=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){if(k===key)throw new DOMException('Storage disabled','QuotaExceededError');return original.call(this,k,v);};},key);
  const blocked=await denied.newPage();observe(blocked);await blocked.goto(base);await saved(blocked,'santiago',false);
  await card(blocked,'santiago').locator('.save-button').click();await blocked.getByRole('status').getByText('El navegador no permite guardar encuentros en este equipo.',{exact:true}).waitFor();
  await saved(blocked,'santiago',false);assert.deepEqual(await stored(blocked),[]);await denied.close();
  const unavailable=await browser.newContext({locale:'es-ES'});
  await unavailable.addInitScript(()=>Object.defineProperty(window,'localStorage',{get(){throw new DOMException('Storage unavailable','SecurityError');}}));
  const noStorage=await unavailable.newPage();observe(noStorage);await noStorage.goto(base);await card(noStorage,'santiago').waitFor();
  await card(noStorage,'santiago').locator('.save-button').click();await noStorage.getByRole('status').getByText('El navegador no permite guardar encuentros en este equipo.',{exact:true}).waitFor();
  await saved(noStorage,'santiago',false);await unavailable.close();
  const clean=await browser.newContext({locale:'es-ES'});const fresh=await clean.newPage();observe(fresh);await fresh.goto(base+'/guardados');
  await fresh.getByRole('heading',{name:'Todavía no has guardado eventos'}).waitFor();assert.deepEqual(await stored(fresh),[]);await guest(fresh);await clean.close();
  assert.deepEqual(errors,[]);
  fs.writeFileSync(path.join(out,'checks.json'),JSON.stringify({status:'passed',checks:['anonymous save/remove','reload','browser restart','multiple tabs','detail','calendar','no visitor API writes','malformed storage','explicit account import','account separation','logout','GL/ES','light/dark','320/390px','write failure','unavailable storage','isolated browser'],errors},null,2));
  console.log('PASS guest favorites: persistence, browser restart, tabs, explicit account import, privacy, storage failures and responsive GL/ES UI.');
 }finally{
  if(created)manage("import json,sys; from core.models import User; User.objects.filter(email=json.loads(sys.stdin.read())['email']).delete()",{email});
  if(context)await context.close();if(browser)await browser.close();fs.rmSync(profile,{recursive:true,force:true});
 }
})().catch(error=>{console.error(error);process.exitCode=1;});
