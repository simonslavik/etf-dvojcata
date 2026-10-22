// Screenshoty pro vizuální kontrolu: node scripts/shot.mjs [url] [outDir]
import puppeteer from 'puppeteer-core';
import { mkdirSync } from 'node:fs';

const url = process.argv[2] || 'http://localhost:5173/';
const out = process.argv[3] || 'screenshots';
mkdirSync(out, { recursive: true });
const CHROME = process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const browser = await puppeteer.launch({ executablePath: CHROME, headless: true });

const views = [
  { name: 'mobile', width: 390, height: 844, deviceScaleFactor: 1, isMobile: true, hasTouch: true },
  { name: 'desktop', width: 1440, height: 900, deviceScaleFactor: 1 },
];
const tag = new URL(url).search.replace(/[^a-z0-9]/gi, '') || 'default';
for (const v of views) {
  const page = await browser.newPage();
  const errors = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  page.on('pageerror', (e) => errors.push(e.message));
  await page.setViewport(v);
  await page.goto(url, { waitUntil: 'networkidle0' });
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: `${out}/${tag}-${v.name}-fold.png` });
  // celá stránka po úsecích (čitelnější než jeden dlouhý obrázek)
  const total = await page.evaluate(() => document.documentElement.scrollHeight);
  const step = v.isMobile ? 1400 : 1800;
  for (let y = 0, i = 0; y < total; y += step, i++) {
    await page.screenshot({ path: `${out}/${tag}-${v.name}-part${i}.png`, clip: { x: 0, y, width: v.width, height: Math.min(step, total - y) }, captureBeyondViewport: true });
  }
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
  console.log(v.name, { errors, horizontalOverflow: overflow });
  await page.close();
}
await browser.close();
