// Real local registration and isolated QA favorites; never modifies existing account data.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const {execFileSync} = require('node:child_process');
const {chromium} = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const root = path.resolve(__dirname, '..'), out = path.join(root, 'output/account-redesign');
const base = process.env.APP_URL || 'http://127.0.0.1:8088', docker = process.env.DOCKER_BIN || 'docker';
const email = `qa-account-${crypto.randomUUID()}@example.org`, password = crypto.randomBytes(24).toString('base64url');
fs.mkdirSync(out, {recursive: true});
const localDay = value => new Intl.DateTimeFormat('en-CA', {year: 'numeric', month: '2-digit', day: '2-digit', timeZone: 'Europe/Madrid'}).format(new Date(value));
const ends = event => localDay(event.end && new Date(event.end) > new Date(event.start) ? new Date(event.end).getTime() - 1 : event.start);
const session = async page => (await page.request.get(base + '/api/v1/session/')).json();
async function noOverflow(page, widths) {
  for (const width of widths) {
    await page.setViewportSize({width, height: 1000});
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `No overflow at ${width}px`);
  }
}
async function shot(page, file) { await page.screenshot({path: path.join(out, file), fullPage: true}); }
(async () => {
 const browser = await chromium.launch({channel: process.env.PLAYWRIGHT_CHANNEL || 'chrome', headless: true});
 const errors = [];
 try {
  const context = await browser.newContext({locale: 'es-ES', viewport: {width: 1440, height: 1050}, reducedMotion: 'reduce'});
  const page = await context.newPage();page.on('pageerror', error => errors.push(error.message));
  await page.goto(base);await page.locator('.account-button').click();await page.waitForURL('**/cuenta');
  await page.locator('.personal-welcome').waitFor();assert.equal(await page.title(), 'Galicia Tech · Mi cuenta');
  assert.equal(await page.getByRole('link', {name: 'Crear cuenta', exact: true}).getAttribute('href'), '/registro');
  assert.equal(await page.getByText(/verificación en dos pasos/i).count(), 0);
  assert.equal(await page.locator('.admin-entry').count(), 0);
  await shot(page, 'guest-desktop-light.png');await noOverflow(page, [1280, 900, 768, 700, 390, 320]);
  await page.getByRole('radio', {name: 'Oscuro', exact: true}).check();
  assert.equal(await page.locator('html').getAttribute('data-theme'), 'dark');
  await page.getByRole('radio', {name: /Galego/}).check();
  assert.equal(await page.locator('html').getAttribute('lang'), 'gl');assert.equal(await page.title(), 'Galicia Tech · A miña conta');
  await page.reload();await page.locator('.personal-welcome').waitFor();
  assert(await page.getByRole('radio', {name: 'Escuro', exact: true}).isChecked());assert(await page.getByRole('radio', {name: /Galego/}).isChecked());
  await page.setViewportSize({width: 390, height: 1000});await shot(page, 'guest-mobile-dark-gl.png');
  await page.getByRole('radio', {name: /Castellano/}).check();await page.getByRole('radio', {name: 'Claro', exact: true}).check();
  await page.setViewportSize({width: 1440, height: 1050});
  const catalog = await (await page.request.get(base + '/api/v1/catalog/')).json(), today = localDay(Date.now());
  const future = catalog.events.filter(event => ends(event) >= today).sort((a,b) => new Date(a.start) - new Date(b.start));
  const past = catalog.events.filter(event => ends(event) < today).sort((a,b) => new Date(b.start) - new Date(a.start));
  assert(future.length >= 2 && past.length, 'QA requires upcoming and past sample events');
  const ids = [future[0].id, future[1].id, past[0].id];
  await page.evaluate(ids => localStorage.setItem('galicia-tech-guest-favorites-v1', JSON.stringify(ids)), ids);
  await page.reload();await page.locator('.personal-event').first().waitFor();
  await page.getByRole('link', {name: 'Crear cuenta', exact: true}).click();await page.waitForURL('**/registro');
  await page.getByLabel('Correo electrónico', {exact: true}).fill(email);await page.getByLabel('Contraseña', {exact: true}).fill(password);await page.getByLabel('Repite la contraseña', {exact: true}).fill(password);await page.getByRole('button', {name: 'Crear cuenta', exact: true}).click();await page.waitForURL('**/cuenta');
  await page.locator('.personal-identity').waitFor();assert.equal((await session(page)).user.role, 'user');
  assert.equal(await page.locator('.personal-event').count(), 0, 'No automatic import');
  assert.equal(await page.locator('.admin-entry').count(), 0);assert.equal(await page.getByText(/verificación en dos pasos/i).count(), 0);
  await shot(page, 'account-empty-light.png');
  await page.getByRole('button', {name: 'Añadir guardados del navegador', exact: true}).click();
  await page.locator('.personal-import').waitFor({state: 'detached'});assert.deepEqual((await session(page)).favorites.sort(), [...ids].sort());
  assert.equal(await page.locator('.personal-stats dd').nth(0).innerText(), '03');assert.equal(await page.locator('.personal-stats dd').nth(1).innerText(), '02');
  assert.deepEqual(await page.locator('.personal-event').evaluateAll(elements => elements.map(element => element.dataset.accountEvent)), future.slice(0, 2).map(event => event.id));
  await shot(page, 'account-desktop-light.png');
  await page.locator('.personal-event-featured').click();await page.waitForURL('**/evento/' + future[0].id);await page.goto(base + '/cuenta');
  await page.getByRole('link', {name: 'Ver todos', exact: true}).click();await page.waitForURL('**/guardados');await page.goto(base + '/cuenta');
  await page.getByRole('radio', {name: 'Oscuro', exact: true}).check();await shot(page, 'account-desktop-dark.png');
  await page.getByRole('radio', {name: /Galego/}).check();await noOverflow(page, [1280, 900, 768, 700, 390, 320]);
  await page.setViewportSize({width: 390, height: 1000});await shot(page, 'account-mobile-dark-gl.png');
  await page.getByRole('radio', {name: /Castellano/}).check();
  await page.route('**/api/v1/catalog/', route => route.fulfill({json: {...catalog, events: [past[0]]}}));
  await page.reload();await page.getByRole('heading', {name: 'De tu archivo', exact: true}).waitFor();assert.equal(await page.locator('.personal-stats dd').nth(1).innerText(), '00');await page.locator('.personal-event-past').waitFor();
  await page.unroute('**/api/v1/catalog/');await page.goto(base + '/admin/acceso');await page.getByRole('heading', {name: 'Área de administración', exact: true}).waitFor();assert.equal(await page.locator('.mfa-enrollment').count(), 0);
  await page.goto(base + '/cuenta');await page.getByRole('button', {name: 'Cerrar sesión', exact: true}).click();await page.locator('.personal-welcome').waitFor();assert.equal((await session(page)).user, null);
  assert.deepEqual(await page.evaluate(() => JSON.parse(localStorage.getItem('galicia-tech-guest-favorites-v1'))), ids);
  const anonymous = await session(page);await page.route('**/api/v1/session/', route => route.fulfill({json: {...anonymous, registrationEnabled: false}}));await page.reload();await page.locator('.personal-welcome').waitFor();assert.equal(await page.locator('a[href="/registro"]').count(), 0);await page.unroute('**/api/v1/session/');await context.close();

  const adminContext = await browser.newContext({locale: 'es-ES', viewport: {width: 1440, height: 1050}, reducedMotion: 'reduce'}), admin = await adminContext.newPage();admin.on('pageerror', error => errors.push(error.message));
  await admin.goto(base + '/login');await admin.getByLabel('Usuario o correo electrónico', {exact: true}).fill('admin');await admin.getByLabel('Contraseña', {exact: true}).fill('admin');await admin.getByRole('button', {name: 'Entrar', exact: true}).click();await admin.waitForURL('**/cuenta');
  await admin.locator('.admin-entry').waitFor();assert.equal(await admin.getByText(/verificación en dos pasos/i).count(), 0);await shot(admin, 'account-admin-light.png');await admin.locator('.admin-entry').click();await admin.waitForURL('**/admin');assert.equal((await admin.request.get(base + '/api/v1/admin/sources/')).status(), 200);
  const adminSession = await session(admin);await admin.route('**/api/v1/session/', route => route.fulfill({json: {...adminSession, requireAdminMfa: true}}));await admin.reload();await admin.getByRole('link', {name: 'Configurar acceso', exact: true}).click();await admin.waitForURL('**/admin/acceso');await admin.getByRole('button', {name: 'Configurar verificación en dos pasos', exact: true}).waitFor();await adminContext.close();
  assert.deepEqual(errors, []);
  fs.writeFileSync(path.join(out, 'checks.json'), JSON.stringify({status: 'passed', checks: ['guest account entry and signup', 'real registration', 'no personal MFA panel', 'local collection preserved', 'explicit favorites import', 'upcoming/archive separation', 'event and collection links', 'working theme/language preferences and reload', '320–1440px', 'GL/ES light/dark', 'logout', 'closed registration', 'admin permissions and conditional access setup'], errors}, null, 2));
  console.log('PASS account: real signup, favorites, preferences, role-specific access, responsive layout and GL/ES themes.');
 } catch (error) {
  for (const context of browser.contexts()) for (const page of context.pages()) if (!page.isClosed()) await page.screenshot({path: path.join(out, 'failure.png'), fullPage: true}).catch(() => {});
  throw error;
 } finally {
  await browser.close();
  execFileSync(docker, ['compose', 'exec', '-T', 'backend', 'python', 'manage.py', 'shell', '-c', "import json,sys; from core.models import User; User.objects.filter(email=json.loads(sys.stdin.read())['email'],is_staff=False,is_superuser=False).delete()"], {cwd: root, input: JSON.stringify({email}), encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe']});
 }
})().catch(error => {console.error(error);process.exitCode = 1;});
