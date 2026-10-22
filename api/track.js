import { readJson, send, clip } from './_lib/http.js';
import { countEvent } from './_lib/store.js';

export const EVENTS = new Set([
  'page_view', 'scroll', 'finder_select', 'isin_copy', 'calc_change', 'cta_click',
  'form_view', 'form_start', 'form_error', 'form_submit', 'lead_ok', 'qualify', 'report_open', 'report_view', 'faq_open', 'sticky_view',
]);
const VARIANTS = new Set(['twin', 'fees']);

export default async function handler(req, res) {
  if (req.method !== 'POST') return send(res, 405, { error: 'method' });
  try {
    const b = await readJson(req);
    if (!EVENTS.has(b.event)) return send(res, 400, { error: 'event' });
    const variant = VARIANTS.has(b.variant) ? b.variant : 'twin';
    const sid = clip(b.sid, 64) || 'anon';
    await countEvent(variant, b.event, sid);
    // Surový log do Vercel Logs (bez osobních údajů) – lze dohledat celou cestu jedné relace
    const props = clip(JSON.stringify(b.props ?? {}), 300);
    const t = Number.isFinite(b.t) ? Math.round(b.t) : null;
    console.log(JSON.stringify({ k: 'ev', e: b.event, v: variant, sid, src: clip(b.utm_source, 40), ct: clip(b.utm_content, 40), d: clip(b.device, 10), t, p: props }));
    return send(res, 200, { ok: true });
  } catch (e) {
    const status = e.status || e.statusCode || 500;
    if (status >= 500) console.error('track error', e.message);
    return send(res, status, { error: 'server' });
  }
}
