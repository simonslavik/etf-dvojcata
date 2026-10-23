import { Body, Controller, HttpCode, Logger, NotFoundException, Post, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { CALL_CONSENT, consentRecord, EMAIL_RE, isVariant, MONTHLY_BANDS, normalizePhone, type MonthlyBand } from '@etfd/shared';
import { z } from 'zod';
import { OriginGuard } from '../common/origin.guard.js';
import { LIMITS } from '../common/throttle.js';
import { clipped } from '../common/zod.js';
import { ZodPipe } from '../common/zod.pipe.js';
import { LeadsService, type LeadInput } from './leads.service.js';

/** Honeypot: pole s nesmyslným názvem, které autofill nevyplní – bot dostane OK, nic se neuloží */
const Honeypot = z.object({ hp_f7: z.string().min(1) }).transform(() => ({ honeypot: true as const }));

const RealLead = z
  .object({
    email: z.string().trim().toLowerCase().max(120).regex(EMAIL_RE),
    sid: clipped(64),
    variant: z
      .string()
      .nullish()
      .transform((v) => (isVariant(v) ? v : 'twin')),
    source: clipped(20),
    utm_source: clipped(60),
    utm_campaign: clipped(60),
    utm_content: clipped(60),
    device: clipped(10),
    interest: clipped(20),
    calc_monthly: z.number().int().nonnegative().max(1_000_000).nullish(),
    // klient posílá jen ID verze souhlasu – kanonické znění uloží server
    consent_id: z.string().max(20).nullish(),
  })
  .transform((b): LeadInput => ({
    email: b.email,
    sid: b.sid,
    variant: b.variant,
    source: b.source,
    utmSource: b.utm_source,
    utmCampaign: b.utm_campaign,
    utmContent: b.utm_content,
    device: b.device,
    interest: b.interest,
    calcMonthly: b.calc_monthly ?? null,
    consentText: b.consent_id ? consentRecord(b.consent_id) : null,
  }));

const LeadBody = z.union([Honeypot, RealLead]);
const QualifyBody = z.object({
  token: z.string().min(10).max(64),
  band: z.enum(Object.keys(MONTHLY_BANDS) as [MonthlyBand, ...MonthlyBand[]]),
});
const CallBody = z.object({
  token: z.string().min(10).max(64),
  phone: z
    .string()
    .max(30)
    .transform(normalizePhone)
    .refine((p): p is string => p !== null, { message: 'Zkontrolujte prosím číslo – 9 číslic, např. 777 123 456.' }),
  consent: z.literal(true),
  consent_id: z.literal(CALL_CONSENT),
});

@Controller()
@UseGuards(OriginGuard)
export class LeadsController {
  private readonly log = new Logger('Leads');

  constructor(private readonly leads: LeadsService) {}

  @Post('lead')
  @HttpCode(200)
  @Throttle({ default: LIMITS.lead })
  async lead(@Body(new ZodPipe(LeadBody, 'Zkontrolujte prosím e-mail.')) b: z.infer<typeof LeadBody>) {
    if ('honeypot' in b) return { ok: true, emailSent: false, token: null };
    try {
      return { ok: true, ...(await this.leads.capture(b)) };
    } catch (e) {
      // Záměrně ok: true – návštěvník už má přehled odemčený na stránce a lead se nesmí ztratit: zůstane v logu
      this.log.error(JSON.stringify({ k: 'lead_db_error', err: (e as Error).message, lead: b }));
      return { ok: true, emailSent: false, token: null };
    }
  }

  @Post('qualify')
  @HttpCode(200)
  async qualify(@Body(new ZodPipe(QualifyBody)) b: z.infer<typeof QualifyBody>) {
    if (!(await this.leads.qualify(b.token, b.band))) throw new NotFoundException({ error: 'lead' });
    return { ok: true };
  }

  @Post('call')
  @HttpCode(200)
  @Throttle({ default: LIMITS.call })
  async call(@Body(new ZodPipe(CallBody, 'Potvrďte prosím souhlas s kontaktováním.')) b: z.infer<typeof CallBody>) {
    const lead = await this.leads.requestCall(b.token, b.phone, consentRecord(b.consent_id)!);
    if (!lead) throw new NotFoundException({ error: 'lead', message: 'Odkaz už neplatí. Zkuste prosím formulář na hlavní stránce.' });
    return { ok: true };
  }
}
