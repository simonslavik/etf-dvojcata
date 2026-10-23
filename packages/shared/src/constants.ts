/* Konstanty sdílené webem a API – jedno místo pro hodnoty, které musí sedět na obou stranách. */
export const DAY_MS = 86_400_000;
export const MINUTE_MS = 60_000;

/** Stejná kontrola e-mailu v prohlížeči i na serveru */
export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Období dashboardu (dny) */
export const ADMIN_PERIODS = [7, 30, 90] as const;
export const DEFAULT_PERIOD = 30;

/** Cookies: admin (HMAC z ADMIN_TOKEN, nastavuje API) a varianta reklamy (nastavuje proxy.ts) */
export const ADMIN_COOKIE = 'etfd_admin';
export const VARIANT_COOKIE = 'etfd_v';

/** Kampaně bez utm_content v tabulce kampaní */
export const NO_UTM = '(bez UTM)';
