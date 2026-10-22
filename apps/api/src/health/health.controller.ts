import { Controller, Get } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import { InjectDb, type Db } from '../db/db.js';

@Controller('health')
export class HealthController {
  constructor(@InjectDb() private readonly db: Db) {}

  /** Docker healthcheck: API běží a DB odpovídá */
  @Get()
  async health() {
    await this.db.execute(sql`select 1`);
    return { ok: true };
  }
}
