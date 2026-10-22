import { createHmac } from 'node:crypto';

/* Jediný sdílený ADMIN_TOKEN. V cookie je jen HMAC z tokenu (token sám v prohlížeči neleží). */
export const ADMIN_COOKIE = 'etfd_admin';
export const adminCookieValue = (token: string) => createHmac('sha256', token).update('etfd-admin-v1').digest('base64url');
