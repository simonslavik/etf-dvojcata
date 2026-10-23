import { Injectable } from '@nestjs/common';
import type { Variant } from '@etfd/shared';
import { InjectDb, type Db } from '../db/db.js';
import { events } from '../db/schema.js';

interface EventInput {
  sid: string; event: string; variant: Variant;
  utmSource?: string | null; utmCampaign?: string | null; utmContent?: string | null; device?: string | null;
  props?: Record<string, unknown> | null; tMs?: number | null;
}

/** Každá událost z prohlížeče i serveru – z nich se skládá lievik a cesta jedné relace */
@Injectable()
export class TrackingService {
  constructor(@InjectDb() private readonly db: Db) {}

  async record(e: EventInput) {
    await this.db.insert(events).values({ ...e, props: e.props ?? null, tMs: e.tMs ?? null });
  }
}
