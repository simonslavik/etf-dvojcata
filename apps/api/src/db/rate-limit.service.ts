import { Injectable } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import { InjectDb, type Db } from './db.js';

/**
 * Trvalé limity v Postgresu (denní strop e-mailů musí přežít restart). Krátkodobé limity na IP řeší @nestjs/throttler.
 */
@Injectable()
export class RateLimitService {
  constructor(@InjectDb() private readonly db: Db) {}

  /** Fixed-window limit jednou atomickou UPSERT: true = ještě v limitu */
  async within(key: string, limit: number, windowSec: number) {
    const res = await this.db.execute<{ n: number }>(sql`
      insert into rate_limits (key, n, reset_at) values (${key}, 1, now() + make_interval(secs => ${windowSec}))
      on conflict (key) do update set
        n = case when rate_limits.reset_at < now() then 1 else rate_limits.n + 1 end,
        reset_at = case when rate_limits.reset_at < now() then now() + make_interval(secs => ${windowSec}) else rate_limits.reset_at end
      returning n`);
    return Number(res.rows[0]?.n) <= limit;
  }
}
