import { z } from 'zod';

/** Proměnné prostředí validované při startu – chybná konfigurace = pád hned, ne až u prvního leadu */
export const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().default(4000),
  DATABASE_URL: z.string().url(),
  /** Veřejná adresa webu (odkazy v e-mailech, kontrola Origin, secure cookie) */
  SITE_URL: z.string().url().default('http://localhost:3000'),
  ADMIN_TOKEN: z.string().min(8).optional(),
  CRON_SECRET: z.string().min(8).optional(),
  CRON_SCHEDULE: z.string().default('0 7 * * *'),
  RESEND_API_KEY: z.string().optional(),
  RESEND_FROM: z.string().optional(),
  DAILY_EMAIL_CAP: z.coerce.number().int().positive().default(300),
  DAILY_NURTURE_CAP: z.coerce.number().int().positive().default(300),
  HANDOFF_WEBHOOK_URL: z.string().url().optional(),
  HANDOFF_WEBHOOK_SECRET: z.string().optional(),
  /** Vercel nastavuje VERCEL=1 – serverless: migrace běží při buildu a denní běh spouští Vercel Cron */
  VERCEL: z.string().optional(),
});
export type Env = z.infer<typeof EnvSchema>;

/** Prázdné řetězce z docker compose (`VAR: ${VAR:-}`) bereme jako nenastavené */
export const validateEnv = (raw: Record<string, unknown>) =>
  EnvSchema.parse(Object.fromEntries(Object.entries(raw).filter(([, v]) => v !== '')));
