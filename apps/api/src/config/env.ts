import { z } from 'zod';

/** Proměnné prostředí validované při startu – chybná konfigurace = pád hned, ne až u prvního leadu */
export const EnvSchema = z
  .object({
    // výchozí production: bez NODE_ENV zůstanou admin, cron i kontrola Originu zavřené (otevírá je jen explicitní development)
    NODE_ENV: z.enum(['development', 'production', 'test']).default('production'),
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
  })
  .superRefine((env, ctx) => {
    // Veřejné nasazení (https) nesmí běžet s demo hodnotami z docker-compose ani s webhookem bez podpisu
    if (env.NODE_ENV !== 'production' || !env.SITE_URL.startsWith('https://')) return;
    for (const key of ['ADMIN_TOKEN', 'CRON_SECRET'] as const) {
      const v = env[key];
      if (v && v.length < 24)
        ctx.addIssue({ code: 'custom', path: [key], message: 'na veřejném webu aspoň 24 znaků (openssl rand -hex 16)' });
    }
    if (env.HANDOFF_WEBHOOK_URL && (!env.HANDOFF_WEBHOOK_URL.startsWith('https://') || !env.HANDOFF_WEBHOOK_SECRET))
      ctx.addIssue({ code: 'custom', path: ['HANDOFF_WEBHOOK_URL'], message: 'webhook musí být https a mít HANDOFF_WEBHOOK_SECRET' });
  });
export type Env = z.infer<typeof EnvSchema>;

/** Prázdné řetězce z docker compose (`VAR: ${VAR:-}`) bereme jako nenastavené */
export const validateEnv = (raw: Record<string, unknown>) =>
  EnvSchema.parse(Object.fromEntries(Object.entries(raw).filter(([, v]) => v !== '')));
