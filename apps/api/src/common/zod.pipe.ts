import { BadRequestException, type PipeTransform } from '@nestjs/common';
import type { ZodType } from 'zod';

/**
 * Validace vstupu Zod schématem. Text/plain tělo (sendBeacon) se nejdřív parsuje jako JSON.
 * Chyba má jednotný tvar { error, message }: vlastní pravidla ze schématu (refine) nesou svůj kód
 * (cesta pole) a hlášku, jinak se použije obecná hláška pipe.
 */
export class ZodPipe<T> implements PipeTransform<unknown, T> {
  constructor(
    private readonly schema: ZodType<T>,
    private readonly message = 'Neplatný požadavek.',
  ) {}

  transform(value: unknown): T {
    let v = value;
    if (typeof v === 'string' && v.trim().startsWith('{')) {
      try {
        v = JSON.parse(v);
      } catch {
        v = {};
      }
    }
    const r = this.schema.safeParse(v ?? {});
    if (r.success) return r.data;
    const custom = r.error.issues.find((i) => i.code === 'custom');
    throw new BadRequestException(
      custom ? { error: String(custom.path[0] ?? 'invalid'), message: custom.message } : { error: 'invalid', message: this.message },
    );
  }
}
