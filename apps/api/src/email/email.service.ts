import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SEQUENCE, type SequenceStep } from '@etfd/shared';
import type { Env } from '../config/env.js';
import { createTemplates } from './templates.js';

export interface SendResult { sent: boolean; reason: string | null; retryable: boolean }

/** Odesílání přes Resend REST API. Bez RESEND_API_KEY se nic neodešle (job = skipped). */
@Injectable()
export class EmailService {
  private readonly t: ReturnType<typeof createTemplates>;
  private readonly site: string;

  constructor(private readonly config: ConfigService<Env, true>) {
    this.site = config.get('SITE_URL', { infer: true }).replace(/\/$/, '');
    this.t = createTemplates(this.site);
  }

  get enabled() {
    return Boolean(this.config.get('RESEND_API_KEY', { infer: true }) && this.config.get('RESEND_FROM', { infer: true }));
  }

  subject = (step: SequenceStep) => SEQUENCE.find((s) => s.step === step)!.subject;
  preview = (step: SequenceStep, token = 'preview') => this.t.layout(token, this.t.templates[step](token));

  async send(to: string, token: string, step: SequenceStep): Promise<SendResult> {
    if (!this.enabled) return { sent: false, reason: 'disabled', retryable: false };
    const unsub = `${this.site}/api/unsubscribe?t=${encodeURIComponent(token)}`;
    try {
      const r = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { authorization: `Bearer ${this.config.get('RESEND_API_KEY', { infer: true })}`, 'content-type': 'application/json' },
        body: JSON.stringify({
          from: this.config.get('RESEND_FROM', { infer: true }),
          to,
          subject: this.subject(step),
          html: this.preview(step, token),
          // One-click odhlášení (RFC 8058) – Gmail/Yahoo ho u hromadných odesílatelů vyžadují
          headers: { 'List-Unsubscribe': `<${unsub}>`, 'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click' },
        }),
        signal: AbortSignal.timeout(8000), // pomalý Resend nesmí zdržet odpověď formuláře
      });
      return { sent: r.ok, reason: r.ok ? null : `resend ${r.status}`, retryable: r.status === 429 || r.status >= 500 };
    } catch (e) {
      return { sent: false, reason: (e as Error).name === 'TimeoutError' ? 'timeout' : (e as Error).message, retryable: true };
    }
  }
}
