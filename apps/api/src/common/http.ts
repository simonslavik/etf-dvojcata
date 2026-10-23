import { createHash, timingSafeEqual } from 'node:crypto';

/**
 * Porovnání tajemství v konstantním čase. Obě strany se nejdřív zahashují, takže
 * různá délka vstupu neprozradí nic ani dřívějším návratem.
 */
export function safeEqual(a: string, b: string) {
  const digest = (s: string) => createHash('sha256').update(s).digest();
  return timingSafeEqual(digest(a), digest(b));
}

/** E-mail do logů: j***@example.com */
export const maskEmail = (e: string) => e.replace(/^(.).*(@.*)$/, '$1***$2');

/** Cíl přesměrování se rozparsuje stejně jako v prohlížeči a musí zůstat na našem originu (\t, \n, //, \\ → zpět na /) */
export function sameOriginUrl(to: string | null | undefined, origin: string) {
  try {
    const u = new URL(to || '/', origin);
    if (u.origin === origin) return u;
  } catch {
    /* neplatná URL */
  }
  return new URL('/', origin);
}

/** Excel spouští buňky začínající =, +, -, @ jako vzorec; čisté číslo (telefon +420…) necháme */
export function csvCell(v: unknown) {
  let s = v == null ? '' : v instanceof Date ? v.toISOString() : String(v);
  if (/^[=+\-@\t\r]/.test(s) && !/^[+-]?[\d\s]+$/.test(s)) s = `'${s}`;
  return `"${s.replace(/"/g, '""')}"`;
}
