// Simulace návštěvnosti přes skutečné API (jen pro lokální vývoj a screenshoty dashboardu).
// node scripts/simulate.mjs [baseUrl] [počet relací]   – e-maily jsou @example.com
const base = process.argv[2] || 'http://localhost:3000';
const sessions = Number(process.argv[3]) || 400;
if (!/^http:\/\/(localhost|127\.0\.0\.1|web)(:\d+)?/.test(base))
  throw new Error('Simulace běží jen proti lokálnímu serveru nebo Docker službě „web“ – do produkce data nepatří.');

const rnd = Math.random;
const pick = (a) => a[Math.floor(rnd() * a.length)];
const post = (path, body, ip) =>
  fetch(base + path, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-forwarded-for': ip, origin: process.env.SIM_ORIGIN || base },
    body: JSON.stringify(body),
  }).then((r) => r.json());

// Předpoklady z README (odhad konverze) – A víc leadů, B kvalitnější leady
const P = {
  twin: { interact: 0.55, cta: 0.42, start: 0.8, submit: 0.62, qualify: 0.55, rich: 0.35, call: 0.12 },
  fees: { interact: 0.5, cta: 0.36, start: 0.78, submit: 0.58, qualify: 0.62, rich: 0.55, call: 0.2 },
};

let leads = 0;
for (let i = 0; i < sessions; i++) {
  const variant = rnd() < 0.5 ? 'twin' : 'fees';
  const ctx = {
    sid: `sim-${Date.now()}-${i}`,
    variant,
    utm_source: rnd() < 0.9 ? 'meta' : 'direct',
    utm_campaign: 'etf_twins',
    utm_content: variant === 'twin' ? 'ad_a' : 'ad_b',
    device: rnd() < 0.85 ? 'mobile' : 'desktop',
  };
  const ip = `10.0.${i % 250}.${(i * 7) % 250}`;
  const ev = (event, props = {}) => post('/api/track', { ...ctx, event, props }, ip);
  const p = P[variant];
  await ev('page_view');
  if (rnd() > p.interact) continue;
  await ev(variant === 'twin' ? 'finder_select' : 'calc_change', { ticker: pick(['SPY', 'VT', 'VTI', 'SCHD']) });
  if (rnd() < 0.3) await ev('isin_copy');
  if (rnd() > p.cta) continue;
  await ev('cta_click', { source: pick(['finder', 'calc', 'header']) });
  await ev('form_view', { form: 'sheet' });
  if (rnd() > p.start) continue;
  await ev('form_start', { form: 'sheet' });
  if (rnd() > p.submit) continue;
  await ev('form_submit', { form: 'sheet' });
  const res = await post(
    '/api/lead',
    {
      ...ctx,
      email: `sim${i}-${Date.now() % 100000}@example.com`,
      source: 'sheet',
      interest: pick(['VOO', 'SPY', 'VT']),
      consent_id: 'email_v1',
    },
    ip,
  );
  if (!res.ok) throw new Error(`/api/lead odmítl lead: ${JSON.stringify(res)}`);
  leads++;
  if (!res.token || rnd() > p.qualify) continue;
  const band = rnd() < p.rich ? pick(['2-10k', 'gt10k']) : pick(['0', 'lt2k']);
  await post('/api/qualify', { token: res.token, band }, ip);
  if (rnd() < p.call)
    await post('/api/call', { token: res.token, phone: `777${String(100000 + i).slice(-6)}`, consent: true, consent_id: 'call_v1' }, ip);
}
console.log(`✓ ${sessions} relací, ${leads} leadů`);
