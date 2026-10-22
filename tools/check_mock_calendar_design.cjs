const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const playwrightPath=process.env.PLAYWRIGHT_MODULE||'playwright';
const {chromium}=require(playwrightPath);
const {expect}=require(playwrightPath+'/test');
const base=process.env.MOCK_URL||'http://127.0.0.1:8874';
const out=path.resolve(__dirname,'../output/next-mock');
(async()=>{
 const browser=await chromium.launch({channel:process.env.PLAYWRIGHT_CHANNEL||'chrome',headless:true});
 const page=await browser.newPage({locale:'es-ES',viewport:{width:1440,height:1120},reducedMotion:'reduce'});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 try{
  await page.goto(base+'/?vista=calendario&mes=2026-10#events-heading');
  const headerLogos=page.locator('.mini-avatars img');await expect(headerLogos).toHaveCount(3);
  await expect.poll(()=>headerLogos.evaluateAll(imgs=>imgs.every(i=>i.complete&&i.naturalWidth>0))).toBe(true);
  await page.locator('[data-day="2026-10-22"] .calendar-day-button').click();
  await expect(page.locator('[data-calendar-event]')).toHaveCount(3);
  await expect(page.locator('.calendar-event-summary')).toHaveCount(3);
  const heights=await page.locator('.calendar-month tbody tr').evaluateAll(rows=>rows.map(row=>row.getBoundingClientRect().height));
  assert(Math.max(...heights)-Math.min(...heights)<2,'Busy days must not stretch one week: '+heights);
  await expect(page.locator('[data-day="2026-10-22"] .calendar-more')).toHaveText('+2 más');
  await page.locator('.calendar-day-panel-toolbar button').last().click();
  await expect(page.locator('[data-calendar-event="hacktoberfest"]')).toBeVisible();
  await page.locator('.calendar-jump-days button').filter({hasText:'22'}).click();
  await expect(page.locator('[data-calendar-event]')).toHaveCount(3);
  await page.locator('.calendar-view').screenshot({path:path.join(out,'calendar-redesign-light.png')});
  await page.getByRole('button',{name:'Activar modo oscuro'}).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme','dark');
  await page.locator('.calendar-view').screenshot({path:path.join(out,'calendar-redesign-dark.png')});
  for(const width of [320,390,640,641,768,1100,1440]){
   await page.setViewportSize({width,height:1000});
   assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Calendar overflow '+width);
  }
  await page.setViewportSize({width:390,height:1000});
  await expect(page.locator('.calendar-cell-events').first()).toBeHidden();
  await page.locator('.calendar-view').screenshot({path:path.join(out,'calendar-redesign-mobile-dark.png')});
  await page.getByRole('button',{name:'Activar modo claro'}).click();
  await page.locator('.calendar-view').screenshot({path:path.join(out,'calendar-redesign-mobile.png')});
  await page.locator('.language-button').click();
  await expect(page.locator('#calendar-month-title')).toContainText('outubro');
  await expect(page.locator('.calendar-jump-days')).toHaveAccessibleName('Días con encontros');
  await page.locator('.language-button').click();
  await page.goto(base+'/cuenta');await page.getByRole('button',{name:/Administrador Cuenta/}).click();
  await page.goto(base+'/admin/fuentes');
  await expect(page.locator('.source-logo img')).toHaveCount(13);
  await expect.poll(()=>page.locator('.source-logo img').evaluateAll(imgs=>imgs.every(i=>i.complete&&i.naturalWidth>0))).toBe(true);
  const identities=await page.locator('.source-table-row').evaluateAll(rows=>rows.map(row=>({name:row.querySelector('.source-name a').textContent,logo:row.querySelector('.source-logo img').getAttribute('src')})));
  for(const source of identities){
   if(source.name.includes('WordPress'))assert(source.logo.endsWith('/wordpress.png'),source.name);
   if(source.name.includes('Python'))assert(source.logo.endsWith('/python.png'),source.name);
   if(source.name.includes('GDG'))assert(source.logo.endsWith('/gdg.png'),source.name);
   if(source.name.includes('JUG'))assert(source.logo.endsWith('/corunajug.png'),source.name);
  }
  await page.setViewportSize({width:1440,height:1120});
  await page.screenshot({path:path.join(out,'sources-redesign.png'),fullPage:true});
  await page.getByRole('button',{name:'Activar modo oscuro'}).click();
  await expect.poll(()=>page.locator('.source-logo img').evaluateAll(imgs=>imgs.every(i=>i.complete&&i.naturalWidth>0))).toBe(true);
  await page.screenshot({path:path.join(out,'sources-redesign-dark.png'),fullPage:true});
  await page.setViewportSize({width:320,height:900});
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Sources overflow');
  assert.deepEqual(errors,[]);
  fs.writeFileSync(path.join(out,'calendar-redesign-checks.json'),JSON.stringify({status:'passed',weekHeights:heights,sourceLogos:identities,errors,widths:[320,390,640,641,768,1100,1440],scope:'Local mock, real cached logos; no backend or collection'},null,2));
  console.log('PASS calendar design: stable weeks, date shortcuts, rich day details, official logos (13 sources + heading), light/dark, GL/ES, responsive 320–1440, no JS errors.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
