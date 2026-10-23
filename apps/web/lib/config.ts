/** Kde běží NestJS API – používá ho rewrite v next.config.ts (při buildu) i server-side volání adminu */
export const API_URL = process.env.API_URL || 'http://localhost:4000';
