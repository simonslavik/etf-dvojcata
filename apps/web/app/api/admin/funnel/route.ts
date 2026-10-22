import { getDb } from '@/lib/db';
import { funnel, stageCounts } from '@/lib/server/stats';
import { json } from '@/lib/server/http';

/** Lievik a fáze jako JSON (monitoring, E2E test). Chráněno proxy.ts. */
export async function GET(req: Request) {
  const days = Math.min(Number(new URL(req.url).searchParams.get('d')) || 30, 365);
  const db = await getDb();
  const since = new Date(Date.now() - days * 86_400_000);
  return json(200, { funnel: await funnel(db, since), stages: await stageCounts(db, since), generated: new Date().toISOString() });
}
