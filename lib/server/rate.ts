import { sql } from 'drizzle-orm';
import type { Db } from '@/lib/db';

/** Fixed-window limit v Postgresu (jedna atomická UPSERT): true = ještě v limitu */
export async function withinLimit(db: Db, key: string, limit: number, windowSec: number) {
  const res = await db.execute(sql`
    insert into rate_limits (key, n, reset_at) values (${key}, 1, now() + make_interval(secs => ${windowSec}))
    on conflict (key) do update set
      n = case when rate_limits.reset_at < now() then 1 else rate_limits.n + 1 end,
      reset_at = case when rate_limits.reset_at < now() then now() + make_interval(secs => ${windowSec}) else rate_limits.reset_at end
    returning n`);
  const rows = (Array.isArray(res) ? res : (res as { rows: { n: number }[] }).rows) as { n: number }[];
  return Number(rows[0]?.n) <= limit;
}
