import { MINUTE_MS } from '@etfd/shared';

/**
 * Limity na IP pro jednotlivé endpointy (@nestjs/throttler, in-memory: v Dockeru jeden proces, na Vercelu orientačně na instanci).
 * IP bere Express z X-Forwarded-For (trust proxy) – Vercel ho přepisuje skutečnou adresou klienta; při vlastním hostingu ho musí nastavit reverse proxy.
 * Mobilní operátoři sdílejí IP (CGNAT), proto limity pro formuláře nejsou příliš přísné.
 */
export const LIMITS = {
  global: { limit: 300, ttl: MINUTE_MS },
  track: { limit: 600, ttl: 10 * MINUTE_MS },
  lead: { limit: 20, ttl: 10 * MINUTE_MS },
  call: { limit: 10, ttl: 10 * MINUTE_MS },
  login: { limit: 10, ttl: 15 * MINUTE_MS },
  /** Trvalý (Postgres) denní strop leadů na IP – mimo throttler, platí i napříč instancemi na Vercelu */
  leadPerDay: { limit: 50, ttl: 24 * 60 * MINUTE_MS },
} as const;
