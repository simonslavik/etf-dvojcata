/* Admin: jediný sdílený ADMIN_TOKEN. V cookie je jen HMAC z tokenu (token sám v prohlížeči neleží). Web Crypto → běží v proxy i v route handlerech. */
export const ADMIN_COOKIE = 'etfd_admin';

async function hmac(key: string, msg: string) {
  const k = await crypto.subtle.importKey('raw', new TextEncoder().encode(key), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', k, new TextEncoder().encode(msg));
  return Buffer.from(sig).toString('base64url');
}

export const adminCookieValue = (token: string) => hmac(token, 'etfd-admin-v1');

/** Bez ADMIN_TOKEN otevřeno jen v `next dev`; preview, self-hosting i produkce zavřené (fail closed) */
export async function isAdmin(cookie: string | undefined) {
  const token = process.env.ADMIN_TOKEN;
  if (!token) return process.env.NODE_ENV === 'development';
  if (!cookie) return false;
  const expected = await adminCookieValue(token);
  return timingSafeEqual(cookie, expected);
}

export function timingSafeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}
