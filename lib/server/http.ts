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
export const siteUrl = () => (process.env.SITE_URL || 'http://localhost:3000').replace(/\/$/, '');

/** Formulář smí odesílat jen náš web (když je SITE_URL nastavená); Vercel preview domény povolíme mimo produkci. */
export function allowedOrigin(req: Request) {
  const origin = req.headers.get('origin');
  if (!origin || !process.env.SITE_URL) return true;
  try {
    const h = new URL(origin).host;
    return h === new URL(process.env.SITE_URL).host || (process.env.VERCEL_ENV !== 'production' && h.endsWith('.vercel.app'));
  } catch {
    return false;
  }
}
