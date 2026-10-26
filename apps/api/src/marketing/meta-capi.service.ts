import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash } from 'node:crypto';
import type { Env } from '../config/env.js';
import type { Lead } from '../db/schema.js';

/** Kontext požadavku z prohlížeče – posílá se jen v daném okamžiku, neukládá se */
export interface RequestContext {
  ip?: string;
  userAgent?: string;
}

type MetaEvent = 'Lead' | 'QualifiedLead';

const sha256 = (s: string) => createHash('sha256').update(s.trim().toLowerCase()).digest('hex');

/**
 * Meta Conversions API: lead a kvalifikovaný lead ze serveru zpět do Mety, aby kampaň optimalizovala
 * na skutečné (a kvalitní) leady, ne na kliky. E-mail jde jen jako SHA-256, IP a prohlížeč jen v okamžiku
 * požadavku. Bez META_PIXEL_ID a META_CAPI_TOKEN je vypnuté. Chyba Mety nikdy nezastaví lead.
 */
@Injectable()
export class MetaCapiService {
  private readonly log = new Logger('MetaCapi');

  constructor(private readonly config: ConfigService<Env, true>) {}

  get enabled() {
    return Boolean(this.config.get('META_PIXEL_ID', { infer: true }) && this.config.get('META_CAPI_TOKEN', { infer: true }));
  }

  async send(event: MetaEvent, lead: Lead, ctx: RequestContext = {}) {
    if (!this.enabled) return 'disabled';
    const site = this.config.get('SITE_URL', { infer: true });
    const body = {
      data: [
        {
          event_name: event,
          event_time: Math.floor(Date.now() / 1000),
          // stejné ID by poslal i pixel v prohlížeči → Meta událost nezapočítá dvakrát
          event_id: `${event === 'Lead' ? 'lead' : 'qualified'}_${lead.id}`,
          action_source: 'website',
          event_source_url: site,
          user_data: {
            em: [sha256(lead.email)],
            external_id: [sha256(lead.id)],
            ...(lead.fbc ? { fbc: lead.fbc } : {}),
            ...(ctx.ip ? { client_ip_address: ctx.ip } : {}),
            ...(ctx.userAgent ? { client_user_agent: ctx.userAgent } : {}),
          },
          custom_data: {
            lead_event_source: 'etf-dvojcata',
            variant: lead.variant,
            ...(lead.utmContent ? { content_name: lead.utmContent } : {}),
            ...(lead.monthlyBand ? { monthly_band: lead.monthlyBand } : {}),
          },
        },
      ],
      ...(this.config.get('META_TEST_EVENT_CODE', { infer: true })
        ? { test_event_code: this.config.get('META_TEST_EVENT_CODE', { infer: true }) }
        : {}),
      // token v těle, ne v URL – nedostane se do logů proxy
      access_token: this.config.get('META_CAPI_TOKEN', { infer: true }),
    };
    const url = `https://graph.facebook.com/${this.config.get('META_GRAPH_VERSION', { infer: true })}/${this.config.get('META_PIXEL_ID', { infer: true })}/events`;
    let status: string;
    try {
      const r = await fetch(url, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(4000),
      });
      status = r.ok ? 'sent' : `failed_${r.status}`;
    } catch (e) {
      status = `failed_${(e as Error).name}`;
    }
    this.log.log(JSON.stringify({ k: 'meta_capi', event, lead: lead.id, status }));
    return status;
  }
}
