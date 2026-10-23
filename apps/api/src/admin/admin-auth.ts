import { createHmac } from 'node:crypto';
import { DAY_MS } from '@etfd/shared';
import { safeEqual } from '../common/http.js';

/*
 * Jediný sdílený ADMIN_TOKEN. Cookie (ADMIN_COOKIE z @etfd/shared) nese jen expiraci a HMAC z tokenu –
 * token sám v prohlížeči neleží a platnost hlídá server, ne jen maxAge v prohlížeči. Změna tokenu odhlásí všechny.
 */
export const ADMIN_SESSION_MS = 14 * DAY_MS;

const sign = (token: string, exp: number) => createHmac('sha256', token).update(`etfd-admin-v2.${exp}`).digest('base64url');

export const issueAdminCookie = (token: string, now = Date.now()) => {
  const exp = now + ADMIN_SESSION_MS;
  return `${exp}.${sign(token, exp)}`;
};

export function verifyAdminCookie(cookie: string, token: string, now = Date.now()) {
  const [expRaw = '', sig = ''] = cookie.split('.');
  const exp = Number(expRaw);
  // podpis se ověří vždy (konstantní čas), expirace až potom
  return safeEqual(sig, sign(token, exp)) && Number.isSafeInteger(exp) && exp > now;
}
