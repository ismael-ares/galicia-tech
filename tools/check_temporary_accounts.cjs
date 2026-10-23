// Local profile only: registers its own QA account and restarts this project's backend/worker.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const {execFileSync} = require('node:child_process');
const {chromium} = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const root = path.resolve(__dirname, '..');
const out = path.join(root, 'output/temporary-accounts');
const base = process.env.APP_URL || 'http://127.0.0.1:8088';
const docker = process.env.DOCKER_BIN || 'docker';
const email = `qa-lifecycle-${crypto.randomUUID()}@example.org`;
const password = crypto.randomBytes(24).toString('base64url');
fs.mkdirSync(out, {recursive: true});
function compose(...args) {
  return execFileSync(docker, ['compose', ...args], {cwd: root, encoding: 'utf8', timeout: 60000, stdio: ['pipe', 'pipe', 'pipe']});
}
function manage(code, data) {
  return execFileSync(docker, ['compose', 'exec', '-T', 'backend', 'python', 'manage.py', 'shell', '-c', code],
    {cwd: root, input: JSON.stringify(data), encoding: 'utf8', timeout: 30000, stdio: ['pipe', 'pipe', 'pipe']});
}
async function session(page) { return (await page.request.get(base + '/api/v1/session/')).json(); }
async function login(page, name, secret) {
  await page.goto(base + '/login');
  await page.getByLabel('Usuario o correo electrónico', {exact: true}).fill(name);
  await page.getByLabel('Contraseña', {exact: true}).fill(secret);
  await page.getByRole('button', {name: 'Entrar', exact: true}).click();
  await page.waitForURL('**/cuenta');
  return session(page);
}
async function waitForBackend(page) {
  const deadline = Date.now() + 60000;
  while (Date.now() < deadline) {
    try { if ((await page.request.get(base + '/api/v1/health/', {timeout: 3000})).ok()) return; } catch {}
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  throw new Error('Backend did not become healthy after restart');
}
(async () => {
  const browser = await chromium.launch({channel: process.env.PLAYWRIGHT_CHANNEL || 'chrome', headless: true});
  try {
    const options = {locale: 'es-ES', reducedMotion: 'reduce'};
    const context = await browser.newContext(options), page = await context.newPage();
    const flags = await session(page);
    assert(flags.usernameLoginEnabled && flags.registrationEnabled, 'Explicit local registration profile required');
    const catalog = await (await page.request.get(base + '/api/v1/catalog/')).json();
    const eventId = catalog.events[0]?.id;
    assert(eventId, 'A local sample event is required');
    await page.goto(base + '/registro');
    await page.getByLabel('Correo electrónico', {exact: true}).fill(email);
    await page.getByLabel('Contraseña', {exact: true}).fill(password);
    await page.getByLabel('Repite la contraseña', {exact: true}).fill(password);
    await page.getByRole('button', {name: 'Crear cuenta', exact: true}).click();
    await page.waitForURL('**/cuenta');
    const created = await session(page);
    assert.equal(created.user.email, email);
    assert.equal((await page.request.put(base + '/api/v1/favorites/' + eventId + '/', {headers: {'X-CSRFToken': created.csrfToken}})).status(), 204);
    await page.getByRole('button', {name: 'Cerrar sesión', exact: true}).click();
    const relogged = await login(page, email, password);
    assert.equal(relogged.user.id, created.user.id, 'Logging out does not delete the account');
    assert(relogged.favorites.includes(eventId));
    const sessionKey = (await context.cookies()).find(cookie => cookie.name === 'galicia_session').value;
    manage("import json,sys; from core.models import User,Favorite; from django.contrib.sessions.models import Session; d=json.loads(sys.stdin.read()); u=User.objects.get(email=d['email']); assert u.is_ephemeral; assert Favorite.objects.filter(user=u).exists(); assert Session.objects.filter(session_key=d['session']).exists()", {email, session: sessionKey});

    const adminContext = await browser.newContext(options), admin = await adminContext.newPage();
    const readerContext = await browser.newContext(options), reader = await readerContext.newPage();
    const fixedAdmin = await login(admin, 'admin', 'admin'), fixedReader = await login(reader, 'user', 'user');
    assert.equal(fixedAdmin.user.role, 'admin');
    assert.equal(fixedReader.user.role, 'user');
    compose('restart', 'worker');
    assert.equal((await session(page)).user.id, created.user.id, 'Worker restart must not reset accounts');
    compose('restart', 'backend');
    await waitForBackend(page);
    manage("import json,sys; from core.models import User; from django.contrib.sessions.models import Session; from allauth.account.models import EmailAddress; d=json.loads(sys.stdin.read()); assert not User.objects.filter(email=d['email']).exists(); assert not EmailAddress.objects.filter(email=d['email']).exists(); assert not Session.objects.filter(session_key=d['session']).exists()", {email, session: sessionKey});
    const removed = await session(page);
    assert.equal(removed.user, null);
    assert.deepEqual(removed.favorites, []);
    const rejected = await page.request.post(base + '/_allauth/browser/v1/auth/login', {data: {email, password}, headers: {'X-CSRFToken': removed.csrfToken}});
    assert.equal(rejected.status(), 400, 'Deleted credentials must no longer authenticate');
    for (const [fixedPage, before] of [[admin, fixedAdmin], [reader, fixedReader]]) {
      const after = await session(fixedPage);
      assert.deepEqual(after.user, before.user, 'Fixed identity and authenticated session survive restart');
      assert.deepEqual(after.favorites.sort(), before.favorites.sort());
    }
    const preserved = await (await page.request.get(base + '/api/v1/catalog/')).json();
    for (const key of ['events', 'sources', 'covers', 'translations', 'sample']) assert.deepEqual(preserved[key], catalog[key], key + ' must be preserved');
    fs.writeFileSync(path.join(out, 'checks.json'), JSON.stringify({status: 'passed', checks: ['real web registration marked temporary', 'logout/login preserves account', 'temporary favorites', 'worker restart preserves temporary account', 'backend restart deletes temporary account and session', 'deleted credentials rejected', 'fixed accounts, sessions and favorites preserved', 'catalog preserved']}, null, 2));
    console.log('PASS temporary accounts: real signup, logout/login, worker/backend restarts, deletion and preservation.');
  } finally {
    await browser.close();
    manage("import json,sys; from core.models import User; User.objects.filter(email=json.loads(sys.stdin.read())['email'],is_ephemeral=True,is_staff=False,is_superuser=False).delete()", {email});
  }
})().catch(error => {console.error(error); process.exitCode = 1;});
