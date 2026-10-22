import { Body, Controller, HttpCode, Logger, NotFoundException, Post, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { CALL_CONSENT, consentRecord, isVariant, MONTHLY_BANDS, normalizePhone, type MonthlyBand } from '@etfd/shared';
import { BadRequestException } from '@nestjs/common';
import { z } from 'zod';
import { clip } from '../common/http.js';
import { OriginGuard } from '../common/origin.guard.js';
import { ZodPipe } from '../common/zod.pipe.js';
import { LeadsService } from './leads.service.js';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const LeadBody = z.object({
  email: z.string().trim().toLowerCase().max(120).regex(EMAIL),
  hp_f7: z.string().optional(),
  sid: z.string().max(64).nullish(),
  variant: z.string().nullish(),
  source: z.string().nullish(),
  utm_source: z.string().nullish(), utm_campaign: z.string().nullish(), utm_content: z.string().nullish(), device: z.string().nullish(),
  interest: z.string().nullish(),
  calc_monthly: z.number().int().nonnegative().max(1_000_000).nullish(),
  consent_id: z.string().max(20).nullish(),
});
const QualifyBody = z.object({ token: z.string().min(10).max(64), band: z.enum(Object.keys(MONTHLY_BANDS) as [MonthlyBand, ...MonthlyBand[]]) });
// Klient posílá jen ID verze souhlasu – kanonické znění uloží server (lib consent v @etfd/shared)
const CallBody = z.object({ token: z.string().min(10).max(64), phone: z.string().max(30), consent: z.literal(true), consent_id: z.literal(CALL_CONSENT) });

@Controller()
@UseGuards(OriginGuard)
export class LeadsController {
  private readonly log = new Logger('Leads');

  constructor(private readonly leads: LeadsService) {}

  // Mobilní operátoři sdílejí IP (CGNAT) – limit nesmí být moc přísný
  @Post('lead')
  @HttpCode(200)
  @Throttle({ default: { limit: Number(process.env.LEADS_PER_IP_10MIN) || 20, ttl: 600_000 } })
  async lead(@Body() raw: Record<string, unknown>) {
    // Honeypot (pole s nesmyslným názvem, autofill ho nevyplní): bot dostane OK, nic se neuloží
    if (raw?.hp_f7) return { ok: true, emailSent: false, token: null };
    const b = new ZodPipe(LeadBody, 'Zkontrolujte prosím e-mail.').transform(raw);
    const input = {
      email: b.email, sid: clip(b.sid, 64), variant: isVariant(b.variant) ? b.variant : 'twin' as const, source: clip(b.source, 20),
      utmSource: clip(b.utm_source, 60), utmCampaign: clip(b.utm_campaign, 60), utmContent: clip(b.utm_content, 60), device: clip(b.device, 10),
      interest: clip(b.interest, 20), calcMonthly: b.calc_monthly ?? null, consentText: b.consent_id ? consentRecord(b.consent_id) : null,
    };
    try {
      return { ok: true, ...(await this.leads.capture(input)) };
    } catch (e) {
      // Lead se nesmí ztratit ani při výpadku DB – zůstane aspoň v logu
      this.log.error(JSON.stringify({ k: 'lead_db_error', err: (e as Error).message, lead: input }));
      return { ok: true, emailSent: false, token: null };
    }
  }

  @Post('qualify')
  @HttpCode(200)
  async qualify(@Body(new ZodPipe(QualifyBody)) b: z.infer<typeof QualifyBody>) {
    if (!(await this.leads.qualify(b.token, b.band))) throw new NotFoundException({ ok: false });
    return { ok: true };
  }

  @Post('call')
  @HttpCode(200)
  @Throttle({ default: { limit: 10, ttl: 600_000 } })
  async call(@Body(new ZodPipe(CallBody, 'Potvrďte prosím souhlas s kontaktováním.')) b: z.infer<typeof CallBody>) {
    const phone = normalizePhone(b.phone);
    if (!phone) throw new BadRequestException({ error: 'phone', message: 'Zkontrolujte prosím číslo – 9 číslic, např. 777 123 456.' });
    const lead = await this.leads.requestCall(b.token, phone, consentRecord(b.consent_id)!);
    if (!lead) throw new NotFoundException({ error: 'lead', message: 'Odkaz už neplatí. Zkuste prosím formulář na hlavní stránce.' });
    return { ok: true };
  }
}
