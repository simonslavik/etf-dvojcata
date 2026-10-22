import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { EVENTS, isVariant } from '@etfd/shared';
import { z } from 'zod';
import { clip } from '../common/http.js';
import { ZodPipe } from '../common/zod.pipe.js';
import { TrackingService } from './tracking.service.js';

// Jen události, které smí poslat prohlížeč – lead, kvalifikaci, předání… zapisuje výhradně server
const TrackBody = z.object({
  event: z.enum(EVENTS),
  sid: z.string().min(1).max(64),
  variant: z.string().optional(),
  utm_source: z.string().nullish(), utm_campaign: z.string().nullish(), utm_content: z.string().nullish(), device: z.string().nullish(),
  props: z.record(z.string(), z.unknown()).nullish(),
  t: z.number().nullish(),
});

@Controller('track')
export class TrackingController {
  constructor(private readonly tracking: TrackingService) {}

  /** Prohlížeč posílá text/plain (sendBeacon = „simple request“) – ZodPipe ho rozparsuje */
  @Post()
  @HttpCode(200)
  @Throttle({ default: { limit: 600, ttl: 600_000 } }) // běžná relace pošle desítky událostí, ne stovky
  async track(@Body(new ZodPipe(TrackBody)) b: z.infer<typeof TrackBody>) {
    const props = b.props && JSON.stringify(b.props).length <= 400 ? b.props : null;
    await this.tracking.record({
      sid: b.sid, event: b.event, variant: isVariant(b.variant) ? b.variant : 'twin',
      utmSource: clip(b.utm_source, 60), utmCampaign: clip(b.utm_campaign, 60), utmContent: clip(b.utm_content, 60), device: clip(b.device, 10),
      props, tMs: b.t != null ? Math.round(b.t) : null,
    });
    return { ok: true };
  }
}
