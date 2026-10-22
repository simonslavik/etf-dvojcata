import { z } from 'zod';
import { getDb } from '@/lib/db';
import { MONTHLY_BANDS, type MonthlyBand } from '@etfd/shared';
import { qualify } from '@/lib/server/pipeline';
import { allowedOrigin, json, readJson } from '@/lib/server/http';

const Body = z.object({ token: z.string().min(10).max(64), band: z.enum(Object.keys(MONTHLY_BANDS) as [MonthlyBand, ...MonthlyBand[]]) });

export async function POST(req: Request) {
  if (!allowedOrigin(req)) return json(403, { error: 'origin' });
  const parsed = Body.safeParse(await readJson(req).catch(() => ({})));
  if (!parsed.success) return json(400, { error: 'invalid' });
  const ok = await qualify(await getDb(), parsed.data.token, parsed.data.band);
  return json(ok ? 200 : 404, { ok });
}
