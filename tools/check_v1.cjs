const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const {execFileSync}=require('node:child_process');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const docker=process.env.DOCKER_BIN||'docker';
const base=process.env.APP_URL||'http://127.0.0.1:8088';
const root=path.resolve(__dirname,'..');
const out=path.join(root,'output','v1');fs.mkdirSync(out,{recursive:true});
function manage(code,input){return execFileSync(docker,['compose','exec','-T','backend','python','manage.py','shell','-c',code],{cwd:root,input:input?JSON.stringify(input):undefined,encoding:'utf8',stdio:['pipe','pipe','pipe']});}
function totp(secret){const alphabet='ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';let bits='';for(const char of secret)bits+=alphabet.indexOf(char.toUpperCase()).toString(2).padStart(5,'0');const bytes=[];for(let i=0;i+8<=bits.length;i+=8)bytes.push(parseInt(bits.slice(i,i+8),2));const counter=Buffer.alloc(8);counter.writeBigUInt64BE(BigInt(Math.floor(Date.now()/30000)));const digest=crypto.createHmac('sha1',Buffer.from(bytes)).update(counter).digest();const offset=digest[19]&15;return ((digest.readUInt32BE(offset)&0x7fffffff)%1e6).toString().padStart(6,'0');}
(async()=>{
 const browser=await chromium.launch({channel:process.env.PLAYWRIGHT_CHANNEL||'chrome',headless:true});
 const suffix=crypto.randomUUID().slice(0,8);const email='qa-'+suffix+'@example.org';const password=crypto.randomBytes(24).toString('base64url');
 const errors=[];let userCreated=false;
 try{
  manage("from core.models import User; assert not User.objects.filter(is_superuser=True).exists(), 'Use an isolated QA deployment, never an owner-managed database'");
  const page=await browser.newPage({locale:'es-ES',viewport:{width:1440,height:1050},reducedMotion:'reduce'});page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base);await page.locator('.desktop-nav').waitFor();
  assert.equal(await page.locator('.desktop-nav').getByRole('link',{name:'Agenda',exact:true}).getAttribute('aria-current'),'page');
  assert.equal(await page.locator('.event-view-switch').count(),0);
  assert.equal((await page.request.get(base+'/api/v1/admin/sources/')).status(),401);
  // Test sample import is explicit and leaves a visible sample banner.
  execFileSync(docker,['compose','exec','-T','backend','python','manage.py','import_sample'],{cwd:root,stdio:'pipe'});
  await page.reload();await page.locator('.meet-card').first().waitFor();assert.equal(await page.locator('.meet-card').count(),8);
  await page.locator('.preview-bar').getByText('Datos de muestra',{exact:false}).waitFor();
  await page.evaluate(()=>localStorage.setItem('galicia-tech-next-demo-v1',JSON.stringify({role:'admin'})));
  await page.goto(base+'/admin/fuentes');await page.getByRole('heading',{name:'Área de administración'}).waitFor();assert.equal(await page.locator('.source-table-row').count(),0);
  manage("import json,sys; from core.models import User; from allauth.account.models import EmailAddress; d=json.loads(sys.stdin.read()); u=User.objects.create_user(d['email'],email=d['email'],password=d['password'],is_staff=True); EmailAddress.objects.create(user=u,email=u.email,verified=True,primary=True)",{email,password});userCreated=true;
  await page.goto(base+'/login');await page.getByLabel('Correo electrónico').fill(email);await page.getByLabel('Contraseña',{exact:true}).fill(password);await page.getByRole('button',{name:'Entrar',exact:true}).click();await page.waitForURL('**/cuenta');
  await page.getByRole('button',{name:'Configurar verificación en dos pasos'}).click();await page.getByLabel('Confirma tu contraseña').fill(password);await page.getByRole('button',{name:'Continuar',exact:true}).click();await page.locator('.mfa-enrollment code').waitFor();
  const secret=await page.locator('.mfa-enrollment code').innerText();
  await page.locator('.mfa-enrollment img').waitFor();
  await page.getByLabel('Código de verificación').fill(totp(secret));await page.getByRole('button',{name:'Activar',exact:true}).click();
  await page.getByText('Verificación en dos pasos activada.',{exact:true}).waitFor();
  await page.locator('.recovery-codes pre').waitFor();assert((await page.locator('.recovery-codes pre').innerText()).length>20);
  await page.goto(base+'/admin/fuentes');await page.locator('.source-table-row').first().waitFor();assert.equal(await page.locator('.source-logo img').count(),13);
  await page.getByRole('button',{name:'Pausar GDG Ourense',exact:true}).click();await page.getByRole('button',{name:'Activar GDG Ourense',exact:true}).waitFor();await page.reload();await page.getByRole('button',{name:'Activar GDG Ourense',exact:true}).waitFor();await page.getByRole('button',{name:'Activar GDG Ourense',exact:true}).click();
  manage("from core.models import ReviewCase,Event; from core.services import render_event; c=ReviewCase.objects.get(pk='end-time',event__is_sample=True); c.status='pending'; c.value=''; c.note=''; c.version+=1; c.save(); render_event(c.event)");
  await page.goto(base+'/admin/revision');const review=page.locator('#end-time');await review.locator('select').selectOption('19:00');await review.getByRole('button',{name:'Confirmar dato'}).click();await review.waitFor({state:'detached'});
  await page.goto(base+'/evento/hackathon');await page.getByRole('heading',{name:/Hackathon ETSE/}).waitFor();
  const catalogue=await (await page.request.get(base+'/api/v1/catalog/')).json();assert(catalogue.events.find(e=>e.id==='hackathon').end.includes('19:00:00'));
  await page.goto(base);await page.locator('.meet-card').first().getByRole('button',{name:/^Guardar:/}).click();await page.getByRole('status').getByText('Encuentro guardado.',{exact:true}).waitFor();
  await page.goto(base+'/guardados');await page.locator('.meet-card').first().waitFor();assert.equal(await page.locator('.meet-card').count(),1);await page.reload();await page.locator('.meet-card').first().waitFor();
  await page.goto(base+'/calendario?mes=2026-11');await page.locator('.calendar-view').waitFor();await page.locator('[data-day="2026-11-04"] .calendar-day-button').click();await page.locator('[data-calendar-event="santiago"]').waitFor();
  await page.locator('.calendar-view').screenshot({path:path.join(out,'calendar-light.png')});
  await page.getByRole('button',{name:'Activar modo oscuro'}).click();await page.locator('.language-button').click();assert.equal(await page.locator('html').getAttribute('lang'),'gl');
  await page.setViewportSize({width:390,height:900});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await page.locator('.calendar-view').screenshot({path:path.join(out,'calendar-mobile-dark.png')});
  await page.locator('.language-button').click();await page.goto(base+'/cuenta');await page.getByRole('button',{name:'Cerrar sesión'}).click();await page.getByRole('link',{name:'Iniciar sesión',exact:true}).waitFor();
  assert.equal((await page.request.get(base+'/api/v1/admin/sources/')).status(),401);
  await page.goto(base+'/login');await page.getByLabel('Correo electrónico').fill(email);await page.getByLabel('Contraseña',{exact:true}).fill(password);await page.getByRole('button',{name:'Entrar',exact:true}).click();await page.getByRole('heading',{name:'Verificación en dos pasos'}).waitFor();assert.equal((await page.request.get(base+'/api/v1/admin/sources/')).status(),401);
  await page.getByLabel('Código de verificación').fill(totp(secret));await page.getByRole('button',{name:'Verificar',exact:true}).click();await page.waitForURL('**/cuenta');
  assert.equal((await page.request.get(base+'/api/v1/admin/sources/')).status(),200);
  assert.deepEqual(errors,[]);
  fs.writeFileSync(path.join(out,'browser-checks.json'),JSON.stringify({status:'passed',checks:['default agenda','server authorization','mock role ignored','password login','TOTP QR setup','recovery codes','TOTP login challenge','favorites persistence','source persistence','review persistence','calendar','GL/ES','light/dark','mobile','logout'],errors},null,2));
  console.log('PASS v0.1 browser: real sessions, TOTP, permissions, favorites, sources, review, calendar, languages and themes.');
 }finally{
  if(userCreated)manage("from core.models import User,AuditLog,ReviewCase; from core.services import render_event; import sys,json; u=User.objects.get(email=json.loads(sys.stdin.read())['email']); AuditLog.objects.filter(actor=u).delete(); u.delete(); c=ReviewCase.objects.get(pk='end-time',event__is_sample=True); c.status='pending'; c.value=''; c.note=''; c.version+=1; c.save(); render_event(c.event)",{email});
  await browser.close();
 }
})().catch(error=>{console.error(error);process.exitCode=1});
