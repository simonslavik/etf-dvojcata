// E2E: projde celou cestu návštěvníka v obou variantách a ověří, že ji funnel změřil.
// node scripts/e2e.mjs [baseUrl]
import puppeteer from 'puppeteer-core';
import assert from 'node:assert/strict';

const base = process.argv[2] || 'http://localhost:5173';
const CHROME = process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const browser = await puppeteer.launch({ executablePath: CHROME, headless: true });
const stats = async () => (await fetch(`${base}/api/stats`)).json();
const before = await stats();
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function journey({ query, variant }) {
  const ctx = await browser.createBrowserContext(); // čistý localStorage = nový návštěvník
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
  await page.goto(`${base}/${query}`, { waitUntil: 'networkidle0' });

  assert.equal(await page.$eval('body', (b) => b.dataset.variant), variant, 'varianta podle ?ad=');
  const heroHas = await page.$eval('[data-hero-slot]', (s) => (s.querySelector('.finder') ? 'finder' : 'calc'));
  assert.equal(heroHas, variant === 'fees' ? 'calc' : 'finder', 'hero obsahuje správný modul');

  // interakce: klik na SPY → zobrazí se SPYL
  await page.click('[data-ticker="SPY"]');
  assert.match(await page.$eval('[data-twin] .twin__side--eu .twin__ticker', (e) => e.textContent), /SPYL/);
  // kalkulačka
  await page.$eval('[data-in="monthly"]', (i) => { i.value = 5000; i.dispatchEvent(new Event('input', { bubbles: true })); });
  assert.match(await page.$eval('[data-out="saved"]', (e) => e.textContent), /Kč/);

  // CTA → sheet → špatný e-mail → chyba
  await page.click('.hero [data-cta]');
  await page.waitForSelector('dialog[open]');
  await page.type('#email-sheet', 'spatny-email');
  await page.click('[data-form="sheet"] button[type="submit"]');
  assert.equal(await page.$eval('[data-form="sheet"] .lead-form__error', (e) => e.hidden), false, 'chyba se zobrazí');

  // správný e-mail → done krok + odemčení
  await page.$eval('#email-sheet', (i) => { i.value = ''; });
  await page.type('#email-sheet', `test+${variant}${Date.now()}@example.com`);
  await page.click('[data-form="sheet"] button[type="submit"]');
  await page.waitForSelector('[data-sheet-step="done"]:not([hidden])', { timeout: 5000 });
  assert.ok(await page.$('[data-preview].is-unlocked'), 'přehled odemčen');

  // kvalifikace
  await page.click('[data-q="2-10k"]');
  await page.waitForSelector('[data-qualify-thanks]:not([hidden])');
  await sleep(900); // calc_change má debounce 600 ms
  assert.deepEqual(errors, [], 'žádné JS chyby');
  await ctx.close();
}

await journey({ query: '?utm_source=facebook&ad=twin', variant: 'twin' });
await journey({ query: '?utm_source=facebook&ad=fees', variant: 'fees' });
await sleep(500);

const after = await stats();
for (const v of ['twin', 'fees']) {
  for (const e of ['page_view', 'finder_select', 'calc_change', 'cta_click', 'form_view', 'form_start', 'form_submit', 'lead_ok', 'qualify']) {
    assert.ok(after.counts[v][e] > (before.counts[v][e] || 0), `${v}: ${e} se započítal`);
  }
}
console.log('✓ E2E OK – obě varianty, celý funnel změřen');
console.table(Object.fromEntries(after.funnel.map((e) => [e, { twin: after.counts.twin[e], fees: after.counts.fees[e] }])));
await browser.close();
