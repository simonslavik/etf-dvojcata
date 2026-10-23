import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { EVENTS, isVariant } from '@etfd/shared';
import { z } from 'zod';
import { LIMITS } from '../common/throttle.js';
import { clipped } from '../common/zod.js';
import { ZodPipe } from '../common/zod.pipe.js';
import { TrackingService } from './tracking.service.js';

// Jen události, které smí poslat prohlížeč – lead, kvalifikaci, předání… zapisuje výhradně server
const TrackBody = z.object({
  event: z.enum(EVENTS),
  sid: z.string().min(1).max(64),
  variant: z
    .string()
    .nullish()
    .transform((v) => (isVariant(v) ? v : 'twin')),
  utm_source: clipped(60),
  utm_campaign: clipped(60),
  utm_content: clipped(60),
  device: clipped(10),
  // malé props (ticker, zdroj CTA…) – větší objekt se zahodí, aby tabulka nebobtnala
  props: z
    .record(z.string(), z.unknown())
    .nullish()
    .transform((p) => (p && JSON.stringify(p).length <= 400 ? p : null)),
  t: z
    .number()
    .nullish()
    .transform((t) => (t != null ? Math.round(t) : null)),
});

@Controller('track')
export class TrackingController {
  constructor(private readonly tracking: TrackingService) {}

  /** Prohlížeč posílá text/plain (sendBeacon = „simple request“) – ZodPipe ho rozparsuje */
  @Post()
  @HttpCode(200)
  @Throttle({ default: LIMITS.track }) // běžná relace pošle desítky událostí, ne stovky
  async track(@Body(new ZodPipe(TrackBody)) b: z.infer<typeof TrackBody>) {
    await this.tracking.record({
      sid: b.sid,
      event: b.event,
      variant: b.variant,
      utmSource: b.utm_source,
      utmCampaign: b.utm_campaign,
      utmContent: b.utm_content,
      device: b.device,
      props: b.props,
      tMs: b.t,
    });
    return { ok: true };
  }
}
