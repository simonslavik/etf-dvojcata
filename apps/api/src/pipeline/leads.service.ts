import { Injectable, Logger } from '@nestjs/common';
import type { MonthlyBand, Variant } from '@etfd/shared';
import { and, eq, sql } from 'drizzle-orm';
import { randomBytes } from 'node:crypto';
import { InjectDb, type Db } from '../db/db.js';
import { emailJobs, leads } from '../db/schema.js';
import { SequenceService } from '../email/sequence.service.js';
import { TrackingService } from '../tracking/tracking.service.js';
import { HandoffService, mask } from './handoff.service.js';
import { leadSid, ScoringService } from './scoring.service.js';

export interface LeadInput {
  email: string; sid: string | null; variant: Variant; source: string | null;
  utmSource: string | null; utmCampaign: string | null; utmContent: string | null; device: string | null;
  interest: string | null; calcMonthly: number | null; consentText: string | null;
}

/** Návštěva → Lead → Kvalifikace → Předání → Péče. Každá změna končí přepočtem skóre (ScoringService). */
@Injectable()
export class LeadsService {
  private readonly log = new Logger('Leads');

  constructor(
    @InjectDb() private readonly db: Db,
    private readonly tracking: TrackingService,
    private readonly scoring: ScoringService,
    private readonly handoffs: HandoffService,
    private readonly sequence: SequenceService,
  ) {}

  async capture(input: LeadInput) {
    const [row] = await this.db.insert(leads)
      .values({ ...input, token: randomBytes(18).toString('base64url') })
      // Opakované odeslání stejného e-mailu: první kontext (created, zdroj, varianta) zůstává
      .onConflictDoUpdate({ target: leads.email, set: { updatedAt: sql`now()`, sid: sql`coalesce(${leads.sid}, excluded.sid)` } })
      .returning({ id: leads.id, token: leads.token, inserted: sql<boolean>`(xmax = 0)` });
    const isNew = Boolean(row.inserted);

    await this.tracking.record({ sid: input.sid || `lead:${row.id}`, event: 'lead_ok', variant: input.variant, utmSource: input.utmSource, utmCampaign: input.utmCampaign, utmContent: input.utmContent, device: input.device, props: { source: input.source, isNew } });

    let emailSent = false;
    if (isNew) {
      await this.sequence.schedule(row.id);
      emailSent = await this.sequence.sendJob(row.id, 'd0_report');
    }
    await this.scoring.rescore(row.id);
    this.log.log(JSON.stringify({ k: 'lead', email: mask(input.email), variant: input.variant, source: input.source, isNew, mail: emailSent }));
    // Token (kvalifikace, telefon, odhlášení) dostane jen ten, kdo lead právě založil – ne kdokoli, kdo zná cizí e-mail
    return { emailSent, token: isNew ? row.token : null };
  }

  byToken = async (token: string) => (await this.db.select().from(leads).where(eq(leads.token, token)))[0] ?? null;

  async qualify(token: string, band: MonthlyBand) {
    const lead = await this.byToken(token);
    if (!lead) return false;
    await this.db.update(leads).set({ monthlyBand: band }).where(eq(leads.id, lead.id));
    await this.tracking.record({ sid: leadSid(lead), event: 'qualify', variant: lead.variant as Variant, props: { band } });
    await this.scoring.rescore(lead.id);
    return true;
  }

  async requestCall(token: string, phone: string, consentText: string) {
    const lead = await this.byToken(token);
    if (!lead || lead.unsubscribedAt) return null;
    await this.db.update(leads).set({ wantsCall: true, phone, callConsentText: consentText }).where(eq(leads.id, lead.id));
    await this.tracking.record({ sid: leadSid(lead), event: 'call_request', variant: lead.variant as Variant });
    const updated = await this.scoring.rescore(lead.id);
    // Už předaný lead (dvojí odeslání, /help z e-mailu) se do CRM neposílá znovu – jen se aktualizuje telefon
    if (!updated || lead.handedOverAt) return updated;
    return this.handoffs.handoff(updated);
  }

  async recordEmailClick(token: string, step: string) {
    const lead = await this.byToken(token);
    if (!lead) return;
    await this.tracking.record({ sid: leadSid(lead), event: 'email_click', variant: lead.variant as Variant, utmSource: 'email', utmContent: step.slice(0, 20) });
    await this.scoring.rescore(lead.id);
  }

  async unsubscribe(token: string) {
    const lead = await this.byToken(token);
    if (!lead) return false;
    if (!lead.unsubscribedAt) {
      await this.db.update(leads).set({ unsubscribedAt: new Date() }).where(eq(leads.id, lead.id));
      await this.db.update(emailJobs).set({ status: 'cancelled' }).where(and(eq(emailJobs.leadId, lead.id), eq(emailJobs.status, 'scheduled')));
      await this.tracking.record({ sid: leadSid(lead), event: 'unsubscribe', variant: lead.variant as Variant });
      await this.scoring.rescore(lead.id);
    }
    return true;
  }
}
