// Starts the already-built local mock independently of the terminal session.
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const { spawn } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const app = path.join(root, 'mock-next');
const standalone = path.join(app, '.next', 'standalone');
const output = path.join(root, 'output', 'next-mock');
const url = 'http://127.0.0.1:8874/';

function responds() {
 return new Promise(resolve => {
  const request = http.get(url, response => {
   response.resume();
   resolve(response.statusCode === 200);
  });
  request.setTimeout(1500, () => request.destroy());
  request.on('error', () => resolve(false));
 });
}

(async () => {
 if (await responds()) { console.log('Preview already running: ' + url); return; }
 if (!fs.existsSync(path.join(app, '.next', 'BUILD_ID'))) throw Error('Build the mock before starting its preview.');
 fs.mkdirSync(output, { recursive: true });
 // Next standalone deliberately excludes these assets from its build output.
 fs.cpSync(path.join(app, 'public'), path.join(standalone, 'public'), { recursive: true });
 fs.cpSync(path.join(app, '.next', 'static'), path.join(standalone, '.next', 'static'), { recursive: true });
 const stdout = fs.openSync(path.join(output, 'preview.stdout.log'), 'a');
 const stderr = fs.openSync(path.join(output, 'preview.stderr.log'), 'a');
 const child = spawn(process.execPath, [path.join(standalone, 'server.js')], {
  cwd: standalone, detached: true, windowsHide: true,
  stdio: ['ignore', stdout, stderr],
  env: { ...process.env, PORT: '8874', HOSTNAME: '127.0.0.1' },
 });
 child.on('error', error => { console.error(error); process.exitCode = 1; });
 child.unref();
 fs.closeSync(stdout); fs.closeSync(stderr);
 for (let attempt = 0; attempt < 15; attempt++) {
  if (await responds()) { console.log('Preview ready: ' + url + ' (PID ' + child.pid + ')'); return; }
  await new Promise(resolve => setTimeout(resolve, 1000));
 }
 throw Error('Preview did not respond. Inspect output/next-mock/preview.stderr.log.');
})().catch(error => { console.error(error.message); process.exitCode = 1; });
