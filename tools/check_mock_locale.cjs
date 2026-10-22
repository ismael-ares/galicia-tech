const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const ts=require('../mock-next/node_modules/typescript');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const base=process.env.MOCK_URL||'http://127.0.0.1:8874';
const out=path.resolve(__dirname,'../output/next-mock');
const compiled=ts.transpileModule(fs.readFileSync(path.resolve(__dirname,'../mock-next/lib/locale.ts'),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText;
const localeModule={exports:{}};
new Function('module','exports',compiled)(localeModule,localeModule.exports);
const {resolveLocale}=localeModule.exports;
for(const [saved,header,expected] of [
 [null,'es-ES,es;q=0.9,en;q=0.8','es'],
 [null,'gl-ES,es;q=0.8','gl'],
 [null,'en-US,es-MX;q=0.7','es'],
 [null,'en-US,en;q=0.9','gl'],
 [null,'','gl'],
 [null,'es;q=0.2,gl;q=0.9','gl'],
 [null,'es;q=0,gl;q=0.7','gl'],
 ['es','gl-ES','es'],['gl','es-ES','gl'],['invalid','es-ES','es']
])assert.equal(resolveLocale(saved,header),expected,JSON.stringify({saved,header}));

(async()=>{
 const browser=await chromium.launch({channel:'chrome',headless:true});
 const errors=[];
 try{
  for(const [locale,expected] of [['es-ES','es'],['gl-ES','gl'],['en-US','gl']]){
   const context=await browser.newContext({locale,viewport:{width:1440,height:1000},reducedMotion:'reduce'});
   const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
   const response=await page.goto(base);const html=await response.text();
   assert(html.includes('<html lang="'+expected+'"'),'SSR language '+locale);
   assert.equal(await page.locator('html').getAttribute('lang'),expected);
   assert.match(await page.locator('h1').innerText(),expected==='gl'?/Axenda tech/:/Agenda tech/);
   assert.equal((await page.locator('.language-code').innerText()).toLowerCase(),expected);
   await context.close();
  }
  const context=await browser.newContext({locale:'es-ES',viewport:{width:1440,height:1000},reducedMotion:'reduce'});
  const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base);await page.getByRole('textbox',{name:'Buscar eventos'}).fill('DevFest');
  const save=page.locator('.meet-card').first().locator('.save-button');await save.click();
  await page.getByRole('button',{name:'Activar modo oscuro'}).click();
  await page.waitForFunction(()=>document.documentElement.dataset.theme==='dark');
  await page.getByRole('button',{name:'Cambiar a galego'}).click();
  assert.equal(await page.locator('html').getAttribute('lang'),'gl');
  assert.equal(await page.getByRole('textbox',{name:'Buscar eventos'}).inputValue(),'DevFest');
  assert.equal(await page.locator('.meet-card').first().locator('.save-button').getAttribute('aria-pressed'),'true');
  assert.equal(await page.locator('html').getAttribute('data-theme'),'dark');
  assert.equal(await page.locator('#events-heading').innerText().then(s=>s.startsWith('Todos os encontros')),true);
  const cookie=(await context.cookies()).find(c=>c.name==='galicia-tech-locale');assert.equal(cookie.value,'gl');
  assert.match(await page.locator('.group-weekday').first().innerText(),/mércores|xoves|venres|sábado|domingo|luns|martes/i);
  await page.reload();assert.equal(await page.locator('html').getAttribute('lang'),'gl');
  const content=JSON.parse(fs.readFileSync(path.resolve(__dirname,'../mock-next/lib/sample.json'),'utf8'));
  const translated=require('../mock-next/lib/messages/events-gl.json');
  await page.locator('[data-motion-item="flutter"] .meet-title').click();await page.waitForURL('**/evento/flutter');
  assert.equal(await page.locator('h1').innerText(),translated[content.events.find(e=>e.id==='flutter').title]);
  assert.equal(await page.locator('.detail-description p').first().innerText(),translated[content.events.find(e=>e.id==='flutter').description[0]]);
  assert.equal(await page.getByRole('heading',{name:'Información do encontro'}).count(),1);
  await page.goto(base+'/cuenta');await page.locator('.role-options button').last().click();
  for(const [route,heading] of [['/admin','Resumo'],['/admin/fuentes','Fontes'],['/admin/revision','Revisión'],['/admin/ajustes','Configuración'],['/portadas','20 modelos'],['/login','Inicia sesión']]){
   await page.goto(base+route);assert.match(await page.locator('h1').innerText(),new RegExp(heading));assert.equal(await page.locator('html').getAttribute('lang'),'gl');
  }
  await page.goto(base+'/admin/fuentes');await page.getByRole('textbox',{name:'Buscar fontes'}).fill('nonexistent');await page.getByRole('button',{name:'Limpar filtros'}).click();assert.equal(await page.locator('.source-table-row').count(),13);
  await page.goto(base);await page.locator('.language-button').focus();await page.keyboard.press('Enter');assert.equal(await page.locator('html').getAttribute('lang'),'es');await page.reload();assert.equal(await page.locator('html').getAttribute('lang'),'es');
  for(const language of ['es','gl']){
   if(await page.locator('html').getAttribute('lang')!==language)await page.locator('.language-button').click();
   for(const width of [320,390,768,1440]){
    await page.setViewportSize({width,height:1000});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'overflow '+language+' '+width);
    await page.locator('.site-header').screenshot({path:path.join(out,'idioma-cabecera-'+language+'-'+width+'.png')});
   }
  }
  assert.deepEqual(errors,[]);
  await context.close();
  console.log('PASS locales: navegador, fallback galego, cookie, SSR, alternancia, fechas, navegación, contenido original, filtros, guardados, tema, panel y móvil.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
