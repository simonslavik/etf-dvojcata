// Vyrenderuje reklamy ads/ad-*.html do PNG 1080×1350 (Meta feed 4:5) a ads/og.html do public/og.png.
import puppeteer from 'puppeteer-core';
import { readdirSync } from 'node:fs';
import { resolve } from 'node:path';

const CHROME = process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const dir = resolve(import.meta.dirname, '../ads');
const browser = await puppeteer.launch({ executablePath: CHROME, headless: true });
const page = await browser.newPage();
await page.setViewport({ width: 1080, height: 1350, deviceScaleFactor: 1 });
for (const f of readdirSync(dir).filter((f) => /^(ad-.*|og)\.html$/.test(f))) {
  const isOg = f === 'og.html';
  await page.setViewport(isOg ? { width: 1200, height: 630 } : { width: 1080, height: 1350 });
  await page.goto(`file://${dir}/${f}`, { waitUntil: 'load', timeout: 30000 });
  await page.evaluate(() => document.fonts.ready);
  // OG obrázek jde rovnou do public/ (náhled odkazu při sdílení)
  const out = isOg ? resolve(dir, '../public/og.png') : `${dir}/${f.replace('.html', '.png')}`;
  await page.screenshot({ path: out });
  console.log('✓', out);
}
await browser.close();
