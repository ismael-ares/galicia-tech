const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const root = path.resolve(__dirname, '..');
const out = path.join(root, 'output/next-mock');
fs.mkdirSync(out, { recursive: true });
const base = process.env.MOCK_URL || 'http://127.0.0.1:8874';
(async () => {
 const browser = await chromium.launch({headless:true, channel:process.env.PLAYWRIGHT_CHANNEL || 'chrome'});
 const page = await browser.newPage({viewport:{width:1440,height:1050},colorScheme:'light',locale:'es-ES'});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 try {
  async function visit(route){const response=await page.goto(base+route);assert.equal(response.status(),200,route);await page.waitForTimeout(180);}
  async function noOverflow(){assert(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth),'Desbordamiento horizontal en '+page.url());}
  await visit('/');await page.locator('.event-row').first().waitFor();assert.equal(await page.locator('.event-row').count(),8);await noOverflow();
  await page.screenshot({path:path.join(out,'agenda-claro.png'),fullPage:true});
  const featuredBefore=await page.locator('.featured-card h3').innerText();const heroHeight=(await page.locator('.featured-card').boundingBox()).height;await page.getByRole('button',{name:'Siguiente destacado'}).click();assert.notEqual(await page.locator('.featured-card h3').innerText(),featuredBefore);assert(Math.abs((await page.locator('.featured-card').boundingBox()).height-heroHeight)<0.5,'La altura del destacado cambia al navegar');
  await page.getByRole('button',{name:'¿Por qué estos eventos?'}).click();await page.getByText('todavía no se ha ejecutado un LLM',{exact:false}).waitFor();
  await page.getByRole('textbox',{name:'Buscar eventos'}).fill('EXTREME');assert.equal(await page.locator('.event-row').count(),1);await page.getByRole('textbox',{name:'Buscar eventos'}).fill('no-existe-8765');assert.equal(await page.locator('.event-row').count(),0);await page.getByRole('button',{name:'Limpiar filtros'}).click();
  await page.locator('.event-row').first().getByRole('button',{name:/^Guardar:/}).click();await visit('/guardados');assert.equal(await page.locator('.event-row').count(),1);
  await visit('/evento/santiago');await page.getByRole('heading',{name:'DevFest Santiago de Compostela 2026',exact:true}).waitFor();assert.equal(await page.locator('.source-links a').count(),3);await noOverflow();
  await visit('/admin/fuentes');await page.getByRole('heading',{name:'Área de administración'}).waitFor();assert.equal(await page.locator('.source-table-row').count(),0);
  await visit('/cuenta');await page.getByRole('button',{name:/Administrador Cuenta/}).click();await page.getByRole('link',{name:/Administración Fuentes/}).click();await page.getByRole('heading',{name:'Resumen.'}).waitFor();
  await visit('/admin/fuentes');assert.equal(await page.locator('.source-table-row').count(),13);await page.getByRole('textbox',{name:'Buscar fuentes'}).fill('wordpress');assert.equal(await page.locator('.source-table-row').count(),7);await page.getByRole('textbox',{name:'Buscar fuentes'}).fill('');await page.getByRole('button',{name:'Pausar GDG Ourense',exact:true}).click();await page.getByRole('button',{name:'Activar GDG Ourense',exact:true}).waitFor();await page.reload();await page.getByRole('button',{name:'Activar GDG Ourense',exact:true}).waitFor();await page.getByRole('button',{name:'Activar GDG Ourense',exact:true}).click();await noOverflow();await page.screenshot({path:path.join(out,'fuentes.png'),fullPage:true});
  await visit('/admin/revision');assert.equal(await page.locator('.review-card').count(),2);const card=page.locator('#end-time');await card.locator('select').selectOption('19:00');await card.getByRole('button',{name:'Confirmar dato'}).click();assert.equal(await page.locator('.review-card').count(),1);await page.getByRole('button',{name:'Confirmados',exact:true}).click();assert.equal(await page.locator('.review-card').count(),2);await page.screenshot({path:path.join(out,'revision.png'),fullPage:true});
  await page.locator('#registration').getByRole('button',{name:'Reabrir caso'}).click();await visit('/');assert.equal(await page.locator('.event-row').count(),7);await visit('/admin/revision');await page.locator('#registration').getByRole('button',{name:'Confirmar dato'}).click();await visit('/');assert.equal(await page.locator('.event-row').count(),8);
  await visit('/admin/ajustes');await page.getByLabel('Autoridad de esta sección').selectOption('yaml');await page.locator('fieldset[disabled]').waitFor();await page.getByRole('button',{name:'Guardar en la muestra'}).click();await page.reload();await page.locator('fieldset[disabled]').waitFor();
  await visit('/login');await page.getByRole('button',{name:'Continuar con GitHub'}).click();await page.getByRole('heading',{name:'Estás en la vista de usuario'}).waitFor();await visit('/admin');await page.getByRole('heading',{name:'Área de administración'}).waitFor();
  await visit('/');await page.getByRole('button',{name:'Activar modo oscuro'}).click();await page.waitForFunction(()=>document.documentElement.dataset.theme==='dark');assert.equal(await page.locator('html').getAttribute('data-theme'),'dark');await page.waitForTimeout(300);await page.screenshot({path:path.join(out,'agenda-oscuro.png'),fullPage:true});await page.reload();assert.equal(await page.locator('html').getAttribute('data-theme'),'dark');
  await page.setViewportSize({width:390,height:844});await page.getByRole('button',{name:'Activar modo claro'}).click();await page.waitForTimeout(300);await noOverflow();await page.screenshot({path:path.join(out,'agenda-movil.png'),fullPage:true});await visit('/evento/flutter');await noOverflow();await page.screenshot({path:path.join(out,'evento-movil.png'),fullPage:true});
  await visit('/cuenta');await page.getByRole('button',{name:/Administrador Cuenta/}).click();for(const route of ['/admin','/admin/fuentes','/admin/revision','/admin/ajustes','/login','/demo']){await visit(route);await noOverflow();}
  await page.emulateMedia({reducedMotion:'reduce'});await visit('/');await page.getByRole('button',{name:'Animar la vieira'}).click();const animation=await page.locator('.brand-symbol').evaluate(e=>getComputedStyle(e).animationName);assert.equal(animation,'none');
  assert.deepEqual(errors,[]);fs.writeFileSync(path.join(out,'checks.json'),JSON.stringify({status:'passed',base,scope:'Interfaz local y estado simulado; sin backend ni llamadas LLM',checks:['rutas','filtros y vacíos','carrusel','guardados','fuentes y persistencia','revisión genérica','modo YAML','perfiles simulados','tema persistente','responsive sin overflow','movimiento reducido','sin errores JS'],capturedAt:new Date().toISOString()},null,2));
  console.log('PASS mock Next: rutas, filtros, carrusel, guardados, fuentes, revisión, perfiles, YAML, temas y móvil. Capturas: '+out);
 } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
