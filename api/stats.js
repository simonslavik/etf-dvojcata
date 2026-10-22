import { send } from './_lib/http.js';
import { uniqueCounts, leadCount, mode } from './_lib/store.js';
import { emailEnabled } from './_lib/email.js';

export const FUNNEL = ['page_view', 'finder_select', 'calc_change', 'cta_click', 'form_view', 'form_start', 'form_submit', 'lead_ok', 'qualify'];

export default async function handler(req, res) {
  const token = process.env.STATS_TOKEN;
  // V produkci bez tokenu zavřeno (fail closed); token chodí v hlavičce, ne v URL
  if (!token && process.env.VERCEL_ENV === 'production') return send(res, 401, { error: 'STATS_TOKEN není nastavený' });
  if (token && req.headers['x-stats-token'] !== token) return send(res, 401, { error: 'token' });
  try {
    const counts = await uniqueCounts(['all', 'twin', 'fees'], FUNNEL);
    return send(res, 200, { mode, emailEnabled, funnel: FUNNEL, counts, leads: await leadCount(), generated: new Date().toISOString() });
  } catch (e) {
    return send(res, 500, { error: e.message });
  }
}
