import { MINUTE_MS } from '@etfd/shared';

/**
 * Limity na IP pro jednotlivé endpointy (@nestjs/throttler, in-memory – API běží jako jeden proces).
 * Mobilní operátoři sdílejí IP (CGNAT), proto limity pro formuláře nejsou příliš přísné.
 */
export const LIMITS = {
  global: { limit: 300, ttl: MINUTE_MS },
  track: { limit: 600, ttl: 10 * MINUTE_MS },
  lead: { limit: 20, ttl: 10 * MINUTE_MS },
  call: { limit: 10, ttl: 10 * MINUTE_MS },
  login: { limit: 10, ttl: 15 * MINUTE_MS },
} as const;
