/* Raster exports: NODE_PATH must resolve Playwright; Python needs Pillow for ICO. */
const { chromium } = require('playwright');
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..', 'mock');
const assets = path.join(root, 'assets', 'brand');
const svgURL = file => 'data:image/svg+xml;base64,' + fs.readFileSync(path.join(root, file)).toString('base64');

(async () => {
  fs.mkdirSync(assets, { recursive: true });
  const browser = await chromium.launch({
    headless: true,
    ...(process.env.BRAND_CHROMIUM_PATH ? { executablePath: process.env.BRAND_CHROMIUM_PATH } : {}),
  });
  try {
    const page = await browser.newPage({ deviceScaleFactor: 1 });
    const jobs = [
      ['favicon-16.png', 16, 'galicia-tech-symbol-compact.svg'],
      ['favicon-32.png', 32, 'galicia-tech-symbol-compact.svg'],
      ['favicon-48.png', 48, 'galicia-tech-symbol-compact.svg'],
      ['app-icon-192.png', 192, 'galicia-tech-symbol.svg'],
      ['app-icon-512.png', 512, 'galicia-tech-symbol.svg'],
      ['app-icon-maskable-512.png', 512, 'assets/brand/app-icon-maskable.svg'],
      ['apple-touch-icon.png', 180, 'assets/brand/app-icon-maskable.svg'],
    ];
    for (const [name, size, source] of jobs) {
      await page.setViewportSize({ width: size, height: size });
      await page.setContent(`<style>html,body{margin:0;width:100%;height:100%;background:transparent}img{display:block;width:100%;height:100%}</style><img src="${svgURL(source)}" alt="Galicia Tech">`);
      await page.locator('img').evaluate(image => image.decode());
      await page.screenshot({ path: path.join(assets, name), omitBackground: true });
    }
    await page.setViewportSize({ width: 1200, height: 630 });
    await page.setContent(`<style>body{margin:0;width:1200px;height:630px;display:flex;align-items:center;justify-content:center;flex-direction:column;background:#edf4f2;color:#20332f;font-family:system-ui}img{width:858px;height:180px}p{margin:46px 0 0;font-size:34px;letter-spacing:-.6px;color:#526b5c}</style><img src="${svgURL('galicia-tech-logo.svg')}" alt="Galicia Tech"><p>Eventos tech en Galicia</p>`);
    await page.locator('img').evaluate(image => image.decode());
    await page.screenshot({ path: path.join(assets, 'social.png') });
  } finally {
    await browser.close();
  }
  execFileSync(process.env.BRAND_PYTHON || 'python3', [
    '-c', 'from PIL import Image; import sys; Image.open(sys.argv[1]).save(sys.argv[2], format="ICO", sizes=[(16,16),(32,32),(48,48)])',
    path.join(assets, 'favicon-48.png'), path.join(root, 'favicon.ico'),
  ]);
  console.log('7 PNG icons, 1 sharing image and multi-size ICO exported.');
})().catch(error => { console.error(error); process.exitCode = 1; });
