export async function readJson(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') return safeParse(req.body);
  const chunks = [];
  let size = 0;
  for await (const c of req) {
    size += c.length;
    if (size > 16_000) throw Object.assign(new Error('payload too large'), { status: 413 });
    chunks.push(c);
  }
  return safeParse(Buffer.concat(chunks).toString('utf8'));
}

function safeParse(s) {
  try { return JSON.parse(s || '{}'); } catch { return {}; }
}

export function send(res, status, data) {
  res.statusCode = status;
  res.setHeader('content-type', 'application/json; charset=utf-8');
  res.setHeader('cache-control', 'no-store');
  res.end(JSON.stringify(data));
}

export const clip = (v, n = 80) => (typeof v === 'string' ? v.slice(0, n) : v == null ? null : String(v).slice(0, n));

export const clientIp = (req) => String(req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown').split(',')[0].trim();

/** Kanonická adresa webu pro odkazy v e-mailu – nikdy z hlavičky Host (ta jde podvrhnout). */
export const siteUrl = (req) => (process.env.SITE_URL || `http://${req.headers.host}`).replace(/\/$/, '');

/** Formulář smí odesílat jen náš web (když je SITE_URL nastavená); Vercel preview domény povolíme. */
export function allowedOrigin(req) {
  const origin = req.headers.origin;
  if (!origin || !process.env.SITE_URL) return true;
  try {
    const host = new URL(origin).host;
    return host === new URL(process.env.SITE_URL).host || (process.env.VERCEL_ENV !== 'production' && host.endsWith('.vercel.app'));
  } catch {
    return false;
  }
}
