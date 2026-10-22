// Screenshoty do README: node scripts/readme-shots.mjs [baseUrl] [ADMIN_TOKEN]
import puppeteer from 'puppeteer-core';

const base = process.argv[2] || 'http://localhost:3000';
const token = process.argv[3] || process.env.ADMIN_TOKEN;
const CHROME = process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const browser = await puppeteer.launch({ executablePath: CHROME, headless: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const mobile = { width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 2 };

async function fresh(viewport) {
  const page = await (await browser.createBrowserContext()).newPage();
  await page.setViewport(viewport);
  await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
  return page;
}

for (const [v, file] of [['twin', 'mobile-a'], ['fees', 'mobile-b']]) {
  const p = await fresh(mobile);
  await p.goto(`${base}/?ad=${v}`, { waitUntil: 'networkidle0' });
  await p.evaluate(() => document.fonts.ready);
  await p.screenshot({ path: `screenshots/${file}.png` });
}

const p = await fresh(mobile);
await p.goto(`${base}/?ad=twin`, { waitUntil: 'networkidle0' });
await p.$eval('[data-hero] [data-cta]', (b) => b.click());
await sleep(500);
await p.type('#email-sheet', `readme${Date.now()}@example.com`);
await p.$eval('[data-form="sheet"] button[type="submit"]', (b) => b.click());
await p.waitForSelector('[data-q]');
await p.$eval('[data-q="2-10k"]', (b) => b.click());
await sleep(600);
await p.screenshot({ path: 'screenshots/sheet-call.png' });

const d = await fresh({ width: 1440, height: 1000, deviceScaleFactor: 1 });
await d.goto(`${base}/?ad=twin`, { waitUntil: 'networkidle0' });
await d.evaluate(() => document.fonts.ready);
await d.screenshot({ path: 'screenshots/desktop-a.png' });
if (token) {
  await d.goto(`${base}/admin/login`, { waitUntil: 'networkidle0' });
  await d.type('#token', token);
  await Promise.all([d.waitForNavigation({ waitUntil: 'networkidle0' }), d.click('button')]);
  await d.screenshot({ path: 'screenshots/admin.png' });
}
await browser.close();
console.log('✓ screenshots/');
