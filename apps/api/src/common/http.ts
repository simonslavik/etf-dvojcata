export const clip = (v: unknown, n = 80): string | null =>
  typeof v === 'string' ? v.slice(0, n) : v == null ? null : String(v).slice(0, n);

/** Cíl přesměrování se rozparsuje stejně jako v prohlížeči a musí zůstat na našem originu (\t, \n, //, \\ → zpět na /) */
export function sameOriginUrl(to: string | null | undefined, origin: string) {
  try {
    const u = new URL(to || '/', origin);
    if (u.origin === origin) return u;
  } catch { /* neplatná URL */ }
  return new URL('/', origin);
}

/** Excel spouští buňky začínající =, +, -, @ jako vzorec; čisté číslo (telefon +420…) necháme */
export function csvCell(v: unknown) {
  let s = v == null ? '' : v instanceof Date ? v.toISOString() : String(v);
  if (/^[=+\-@\t\r]/.test(s) && !/^[+-]?[\d\s]+$/.test(s)) s = `'${s}`;
  return `"${s.replace(/"/g, '""')}"`;
}

export function timingSafeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}
