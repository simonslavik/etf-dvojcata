import { createHmac } from 'node:crypto';

/* Jediný sdílený ADMIN_TOKEN. V cookie (ADMIN_COOKIE z @etfd/shared) je jen HMAC z tokenu – token sám v prohlížeči neleží. */
export const adminCookieValue = (token: string) => createHmac('sha256', token).update('etfd-admin-v1').digest('base64url');
