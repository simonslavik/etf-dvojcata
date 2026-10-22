import { BadRequestException, type PipeTransform } from '@nestjs/common';
import type { ZodType } from 'zod';

/** Validace těla požadavku Zod schématem. Text/plain tělo (sendBeacon) se nejdřív parsuje jako JSON. */
export class ZodPipe<T> implements PipeTransform<unknown, T> {
  constructor(private readonly schema: ZodType<T>, private readonly message = 'invalid') {}

  transform(value: unknown): T {
    let v = value;
    if (typeof v === 'string') {
      try { v = JSON.parse(v || '{}'); } catch { v = {}; }
    }
    const r = this.schema.safeParse(v ?? {});
    if (!r.success) throw new BadRequestException({ error: 'invalid', message: this.message });
    return r.data;
  }
}
