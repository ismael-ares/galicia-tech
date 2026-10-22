const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const ts=require('../mock-next/node_modules/typescript');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const data=require('../mock-next/lib/sample.json');
const translations=require('../mock-next/lib/messages/events-gl.json');
const base=process.env.MOCK_URL||'http://127.0.0.1:8874';
const out=path.resolve(__dirname,'../output/next-mock');
const mod={exports:{}};
const code=ts.transpileModule(fs.readFileSync(path.resolve(__dirname,'../mock-next/lib/event-content.ts'),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,esModuleInterop:true}}).outputText;
new Function('require','module','exports',code)(p=>require(path.resolve(__dirname,'../mock-next/lib',p)),mod,mod.exports);
const {translateEventText,eventSearchText}=mod.exports;
const original=JSON.stringify(data);
const events=[...data.events,...data.cases.flatMap(c=>c.candidate?[c.candidate]:[])];
let fields=0;
for(const event of events){
 const texts=[event.title,...event.description,event.requirements,event.statusNote,event.cardNote,event.timeLabel,...event.sources.map(s=>s.label),event.registration?.label].filter(Boolean);
 for(const text of texts){assert(Object.hasOwn(translations,text),'Missing event translation: '+text);assert.equal(translateEventText(text,'gl'),translations[text]);assert.equal(translateEventText(text,'es'),text);fields++;}
 assert(eventSearchText(event).includes(event.title));assert(eventSearchText(event).includes(translations[event.title]));
}
assert.equal(translateEventText('Contenido modificado por el organizador','gl'),'Contenido modificado por el organizador','Do not reuse stale translations');
assert.equal(JSON.stringify(data),original);

(async()=>{
 const browser=await chromium.launch({channel:'chrome',headless:true});const errors=[];
 try{
  const page=await browser.newPage({locale:'gl-ES',viewport:{width:1440,height:1050},reducedMotion:'reduce'});
  page.on('pageerror',e=>errors.push(e.message));
  page.on('console',m=>{if(m.type()==='error'&&/hydration|minified react|server rendered/i.test(m.text()))errors.push(m.text());});
  const visit=route=>page.goto(base+route);
  await visit('/');await page.locator('.meet-card').first().waitFor();
  for(const event of data.events){const card=page.locator('[data-motion-item="'+event.id+'"]');assert.equal(await card.locator('h3').innerText(),translations[event.title]);assert.equal(await card.locator('.meet-description').textContent(),translations[event.description[0]]);}
  await page.getByRole('textbox',{name:'Buscar eventos'}).fill('enxeñaría');assert.equal(await page.locator('.meet-card').count(),1);assert.match(await page.locator('.meet-card h3').innerText(),/Enxeñaría extrema/);
  await page.locator('.language-button').click();assert.equal(await page.locator('.meet-card h3').innerText(),'Extreme AI engineering');
  await page.getByRole('textbox',{name:'Buscar eventos'}).fill('engineering');await page.locator('.language-button').click();assert.equal(await page.locator('.meet-card').count(),1);
  await page.locator('.meet-card .save-button').click();await page.locator('.meet-card .meet-title').click();await page.waitForURL('**/evento/extreme-ai-engineering');
  const extreme=data.events.find(e=>e.id==='extreme-ai-engineering');
  assert.equal(await page.locator('h1').innerText(),translations[extreme.title]);
  assert.deepEqual(await page.locator('.detail-description p').allTextContents(),extreme.description.map(p=>translations[p]));
  assert.equal(await page.locator('.detail-section').first().locator('p').innerText(),translations[extreme.requirements]);
  assert.equal(await page.locator('.source-links a').first().getAttribute('href'),extreme.sources[0].url);
  assert.match(await page.locator('.source-links a').nth(1).innerText(),/Ficha do organizador/);
  assert.equal(await page.locator('.detail-save .save-button').getAttribute('aria-pressed'),'true');
  await page.locator('.language-button').click();assert.equal(await page.locator('h1').innerText(),extreme.title);assert.deepEqual(await page.locator('.detail-description p').allTextContents(),extreme.description);
  await page.locator('.language-button').click();
  await visit('/?vista=calendario&mes=2026-10');await page.locator('[data-day="2026-10-22"] .calendar-day-button').click();assert.equal(await page.locator('[data-calendar-event="extreme-ai-engineering"] h4').innerText(),translations[extreme.title]);
  assert.match(await page.locator('[data-day="2026-10-22"] .calendar-event').first().innerText(),/Ideas que transforman/);
  await visit('/portadas');const example=page.locator('.cover-example').filter({has:page.locator('.poster-bottom strong',{hasText:translations[extreme.title]})}).first();assert.equal(await example.locator('.poster-bottom strong').innerText(),translations[extreme.title]);assert.match(await example.locator('figcaption').innerText(),/Enxeñaría extrema/);
  await visit('/cuenta');await page.locator('.role-options button').last().click();await visit('/admin/revision');
  // Identify by the reviewed event, independent of the case ID used by the sample.
  const hackathonCase=data.cases.find(c=>c.eventId==='hackathon');const editor=page.locator('.review-card').filter({has:page.locator('h2',{hasText:hackathonCase.title})});
  await editor.locator('select').selectOption('19:00');await editor.getByRole('button',{name:'Confirmar dato'}).click();
  await visit('/evento/hackathon');assert.equal(await page.locator('.detail-description p').count(),2);assert(!await page.locator('.detail-description').innerText().then(s=>s.includes('Aviso de horario')));assert.equal(await page.locator('.inline-note.warning').count(),0);assert.match(await page.locator('.event-sidebar').innerText(),/12:00–19:00/);assert.match(await page.locator('.detail-description').innerText(),/estudantes da USC/);
  await visit('/');await page.locator('[data-motion-item="wordpress-vigo-octubre"]').scrollIntoViewIfNeeded();await page.locator('.encounter-group').nth(1).screenshot({path:path.join(out,'eventos-galego-desktop.png')});
  await page.setViewportSize({width:320,height:1000});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await page.locator('[data-motion-item="wordpress-vigo-octubre"]').screenshot({path:path.join(out,'evento-galego-mobile.png')});
  assert.deepEqual(errors,[]);assert.equal(JSON.stringify(data),original);
  console.log('PASS event content: '+fields+' translated fields, original data, bilingual search, agenda/calendar/detail/covers, sources, saved events, review updates, locale switching and mobile.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
