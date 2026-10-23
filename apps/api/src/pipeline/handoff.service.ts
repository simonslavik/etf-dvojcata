import { createHmac } from 'node:crypto';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { and, eq, isNull, sql } from 'drizzle-orm';
import { maskEmail } from '../common/http.js';
import type { Env } from '../config/env.js';
import { InjectDb, type Db } from '../db/db.js';
import { leads, type Lead } from '../db/schema.js';
import { TrackingService } from '../tracking/tracking.service.js';
import { leadSid, ScoringService } from './scoring.service.js';

/**
 * Předání: lead s telefonem a výslovným souhlasem odejde webhookem do CRM / call centra (HANDOFF_WEBHOOK_URL).
 * Bez webhooku zůstane ve frontě „čeká na předání“ a v adminu ho jde předat ručně.
 */
@Injectable()
export class HandoffService {
  private readonly log = new Logger('Handoff');

  constructor(
    @InjectDb() private readonly db: Db,
    private readonly config: ConfigService<Env, true>,
    private readonly tracking: TrackingService,
    private readonly scoring: ScoringService,
  ) {}

  async handoff(lead: Lead, { manual = false } = {}) {
    const url = this.config.get('HANDOFF_WEBHOOK_URL', { infer: true });
    const secret = this.config.get('HANDOFF_WEBHOOK_SECRET', { infer: true });
    let status: string;
    if (manual) status = 'manual';
    else if (!url) status = 'pending_no_webhook';
    else {
      try {
        const body = JSON.stringify({
          type: 'lead.handoff',
          idempotency_key: lead.id, // CRM může odmítnout duplicitu při opakovaném pokusu
          lead: {
            id: lead.id,
            email: lead.email,
            phone: lead.phone,
            created_at: lead.createdAt,
            score: lead.score,
            score_reasons: lead.scoreReasons,
            monthly_band: lead.monthlyBand,
            interest: lead.interest,
            calc_monthly: lead.calcMonthly,
            source: {
              variant: lead.variant,
              utm_source: lead.utmSource,
              utm_campaign: lead.utmCampaign,
              utm_content: lead.utmContent,
              device: lead.device,
            },
            consent: lead.callConsentText,
          },
        });
        // Podpis: CRM spočítá HMAC-SHA256(secret, `${timestamp}.${body}`) a odmítne staré časy (replay)
        const timestamp = String(Math.floor(Date.now() / 1000));
        const signature = secret
          ? {
              'x-webhook-timestamp': timestamp,
              'x-webhook-signature': `sha256=${createHmac('sha256', secret).update(`${timestamp}.${body}`).digest('hex')}`,
            }
          : {};
        const r = await fetch(url, {
          method: 'POST',
          headers: { 'content-type': 'application/json', ...signature },
          body,
          signal: AbortSignal.timeout(5000),
        });
        status = r.ok ? 'sent' : `failed_${r.status}`;
      } catch (e) {
        status = `failed_${(e as Error).name}`;
      }
    }
    const delivered = status === 'sent' || status === 'manual';
    await this.db
      .update(leads)
      .set({ handoffStatus: status, ...(delivered ? { handedOverAt: new Date() } : {}) })
      .where(eq(leads.id, lead.id));
    if (delivered) await this.tracking.record({ sid: leadSid(lead), event: 'handoff', variant: lead.variant, props: { status } });
    this.log.log(JSON.stringify({ k: 'handoff', lead: maskEmail(lead.email), status }));
    return this.scoring.rescore(lead.id);
  }

  /** Volá denní plánovač: zopakuje neúspěšná předání (webhook nedostupný, timeout) */
  async retryFailed(limit = 20) {
    const failed = await this.db
      .select()
      .from(leads)
      .where(
        and(
          eq(leads.wantsCall, true),
          isNull(leads.handedOverAt),
          isNull(leads.unsubscribedAt),
          sql`${leads.handoffStatus} like 'failed_%'`,
        ),
      )
      .limit(limit);
    for (const l of failed) await this.handoff(l);
    return failed.length;
  }
}
