import { NextResponse } from 'next/server';

export const clip = (v: unknown, n = 80): string | null =>
  typeof v === 'string' ? v.slice(0, n) : v == null ? null : String(v).slice(0, n);

export const json = (status: number, body: unknown) =>
  NextResponse.json(body, { status, headers: { 'cache-control': 'no-store' } });

/** Tělo do 16 kB; poškozený JSON = prázdný objekt (→ validace vrátí 400, ne 500) */
export async function readJson(req: Request): Promise<Record<string, unknown>> {
  const text = await req.text();
  if (text.length > 16_000) throw Object.assign(new Error('payload too large'), { status: 413 });
  try {
    const v = JSON.parse(text || '{}');
    return v && typeof v === 'object' ? v : {};
  } catch {
    return {};
  }
}

export const clientIp = (req: Request) => (req.headers.get('x-forwarded-for') || 'local').split(',')[0].trim();

/** Kanonická adresa webu pro odkazy v e-mailech – nikdy z hlavičky Host (ta jde podvrhnout) */
export const siteUrl = () =>
  (process.env.SITE_URL || (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : 'http://localhost:3000')).replace(/\/$/, '');

/**
 * Formulář smí odesílat jen náš web. Prohlížeč posílá Origin u každého POST z fetch – chybí jen u skriptů (curl),
 * proto mimo vývoj bez Originu odmítneme (jinak by šlo /api/lead zneužít k rozesílání e-mailů na cizí adresy).
 */
export function allowedOrigin(req: Request) {
  const origin = req.headers.get('origin');
  if (process.env.NODE_ENV === 'development') return true;
  if (!origin) return false;
  try {
    const h = new URL(origin).host;
    return h === new URL(siteUrl()).host || h === new URL(req.url).host || (process.env.VERCEL_ENV !== 'production' && h.endsWith('.vercel.app'));
  } catch {
    return false;
  }
}

/** Cíl přesměrování se rozparsuje stejně jako v prohlížeči a musí zůstat na našem originu (\t, \n, //, \\ → zpět na /) */
export function sameOriginUrl(to: string | null, origin: string) {
  try {
    const u = new URL(to || '/', origin);
    if (u.origin === origin) return u;
  } catch { /* neplatná URL */ }
  return new URL('/', origin);
}
