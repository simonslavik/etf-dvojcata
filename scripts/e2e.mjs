// E2E: projde celou cestu návštěvníka v obou variantách (mobil) a ověří, že ji změřil lievik i pipeline.
// node scripts/e2e.mjs [baseUrl]   (lokálně bez ADMIN_TOKEN je admin API otevřené)
import puppeteer from 'puppeteer-core';
import assert from 'node:assert/strict';

const base = process.argv[2] || 'http://localhost:3100';
const CHROME = process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const browser = await puppeteer.launch({ executablePath: CHROME, headless: true });
const stats = async () => (await fetch(`${base}/api/admin/funnel?d=1`)).json();
const csv = async () => (await fetch(`${base}/api/admin/export`)).text();
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const before = await stats();

/** React sleduje setter hodnoty – změnu slideru je nutné poslat přes nativní setter */
const setRange = (page, sel, v) => page.$eval(sel, (i, v) => {
  Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(i, String(v));
  i.dispatchEvent(new Event('input', { bubbles: true }));
}, v);

async function journey({ query, variant }) {
  const ctx = await browser.createBrowserContext(); // čistý storage = nový návštěvník
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
  await page.goto(`${base}/${query}`, { waitUntil: 'networkidle0' });

  assert.equal(await page.$eval('main', (m) => m.dataset.variant), variant, 'varianta podle ?ad=');
  assert.equal(await page.$eval('[data-hero] [data-module]', (m) => m.dataset.module), variant === 'fees' ? 'calc' : 'finder', 'hero obsahuje správný nástroj');

  await page.click('[data-ticker="SPY"]');
  await page.waitForFunction(() => document.querySelector('[data-twin-ticker]')?.textContent === 'SPYL');
  const savedBefore = await page.$eval('[data-out="saved"]', (e) => e.textContent);
  await setRange(page, '[data-in="monthly"]', 5000);
  await page.waitForFunction((b) => document.querySelector('[data-out="saved"]').textContent !== b, {}, savedBefore);
  await page.$eval('[data-copy-isin]', (b) => b.click());

  // CTA → sheet → špatný e-mail → chyba → správný e-mail → hotovo
  await page.$eval('[data-hero] [data-cta]', (b) => { b.scrollIntoView({ block: 'center' }); b.click(); });
  await page.waitForSelector('dialog[open] #email-sheet');
  await sleep(450); // animace vysunutí sheetu
  assert.equal(await page.evaluate(() => document.activeElement?.id), 'email-sheet', 'fokus je v poli e-mailu');
  await page.type('#email-sheet', 'spatny-email');
  await page.click('[data-form="sheet"] button[type="submit"]');
  await page.waitForSelector('[data-form="sheet"] [role="alert"]');
  await page.$eval('#email-sheet', (i) => { i.value = ''; });
  const email = `e2e+${variant}${Date.now()}@example.com`;
  await page.type('#email-sheet', email);
  await page.click('[data-form="sheet"] button[type="submit"]');
  await page.waitForSelector('[data-sheet-step="done"]', { timeout: 8000 });
  await sleep(450);

  // kvalifikace → nabídka hovoru → telefon + souhlas
  await page.click('[data-q="2-10k"]');
  await page.waitForSelector('[data-call-offer] #call-phone');
  await page.type('#call-phone', '777 123 456');
  await page.click('[data-form="call"] button[type="submit"]');
  await page.waitForSelector('[data-form="call"] [role="alert"]'); // bez souhlasu neprojde
  await page.click('[data-form="call"] input[name="consent"]');
  await page.click('[data-form="call"] button[type="submit"]');
  await page.waitForFunction(() => document.querySelector('[role="status"]')?.textContent.includes('ozveme'));

  // odemčený přehled na stránce
  await page.keyboard.press('Escape');
  assert.ok(await page.$('#report [data-open-report]'), 'přehled odemčen');
  await sleep(900); // calc_change má debounce 600 ms
  assert.deepEqual(errors, [], 'žádné JS chyby');
  await ctx.close();
  return email;
}

const emails = [
  await journey({ query: '?utm_source=meta&ad=twin&utm_content=ad_a', variant: 'twin' }),
  await journey({ query: '?utm_source=meta&ad=fees&utm_content=ad_b', variant: 'fees' }),
];
await sleep(500);

const after = await stats();
for (const v of ['twin', 'fees']) {
  for (const step of ['visit', 'interact', 'cta', 'form_view', 'form_start', 'lead', 'qualify']) {
    assert.ok(after.funnel[v][step] > before.funnel[v][step], `${v}: krok ${step} se započítal`);
  }
}
const rows = (await csv()).split('\n');
for (const e of emails) {
  const row = rows.find((r) => r.includes(e));
  assert.ok(row, `lead ${e} je v exportu`);
  assert.match(row, /"qualified"|"handed_over"/, 'lead je kvalifikovaný');
  assert.match(row, /"\+420777123456"/, 'telefon uložen normalizovaný');
}
console.log('✓ E2E OK – obě varianty, celý lievik a pipeline (lead → kvalifikace → žádost o hovor)');
console.table(Object.fromEntries(Object.keys(after.funnel.all).map((k) => [k, { twin: after.funnel.twin[k], fees: after.funnel.fees[k] }])));
await browser.close();
