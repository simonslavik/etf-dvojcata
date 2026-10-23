import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { scheduleFor, type SequenceStep } from '@etfd/shared';
import { and, eq, lte, sql } from 'drizzle-orm';
import type { Env } from '../config/env.js';
import { InjectDb, type Db } from '../db/db.js';
import { RateLimitService } from '../db/rate-limit.service.js';
import { emailJobs, leads } from '../db/schema.js';
import { EmailService } from './email.service.js';

const MAX_ATTEMPTS = 3;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** E-mailová péče: plán kroků D0/D2/D5/D9 a jejich odesílání */
@Injectable()
export class SequenceService {
  private readonly log = new Logger('Sequence');

  constructor(
    @InjectDb() private readonly db: Db,
    private readonly email: EmailService,
    private readonly limits: RateLimitService,
    private readonly config: ConfigService<Env, true>,
  ) {}

  async schedule(leadId: string, created = new Date()) {
    await this.db.insert(emailJobs).values(scheduleFor(created).map((j) => ({ leadId, step: j.step, sendAt: j.sendAt }))).onConflictDoNothing();
  }

  /**
   * Odešle jeden krok. Job se nejdřív atomicky „zabere“ (scheduled → sending), takže ho cron
   * a odeslání formuláře nikdy nepošlou dvakrát; odhlášení se kontroluje až po zabrání.
   */
  async sendJob(leadId: string, step: SequenceStep) {
    const [job] = await this.db.update(emailJobs)
      .set({ status: 'sending', attempts: sql`${emailJobs.attempts} + 1` })
      .where(and(eq(emailJobs.leadId, leadId), eq(emailJobs.step, step), eq(emailJobs.status, 'scheduled')))
      .returning({ attempts: emailJobs.attempts });
    if (!job) return false;
    const setJob = (v: Partial<typeof emailJobs.$inferInsert>) =>
      this.db.update(emailJobs).set(v).where(and(eq(emailJobs.leadId, leadId), eq(emailJobs.step, step)));

    const [lead] = await this.db.select({ email: leads.email, token: leads.token, unsubscribedAt: leads.unsubscribedAt }).from(leads).where(eq(leads.id, leadId));
    if (!lead || lead.unsubscribedAt) {
      await setJob({ status: 'cancelled' });
      return false;
    }

    // Okamžitý přehled (D0) má vlastní denní strop, aby ho nemohla vyčerpat sekvence (a naopak)
    const day = new Date().toISOString().slice(0, 10);
    const [capKey, cap] = step === 'd0_report'
      ? [`mail0:${day}`, this.config.get('DAILY_EMAIL_CAP', { infer: true })]
      : [`mail:${day}`, this.config.get('DAILY_NURTURE_CAP', { infer: true })];
    if (!(await this.limits.within(capKey, cap, 86_400))) {
      await setJob({ status: 'scheduled', attempts: job.attempts - 1, error: 'daily_cap' }); // zkusí další běh cronu
      return false;
    }

    const res = await this.email.send(lead.email, lead.token, step);
    if (res.sent) await setJob({ status: 'sent', sentAt: new Date(), error: null });
    else if (res.reason === 'disabled') await setJob({ status: 'skipped', error: 'disabled' });
    // 429 / 5xx / síť: zkusí to znovu další běh cronu, po MAX_ATTEMPTS pokusech failed
    else await setJob({ status: res.retryable && job.attempts < MAX_ATTEMPTS ? 'scheduled' : 'failed', error: res.reason });
    return res.sent;
  }

  /** Všechny splatné kroky (s odstupem kvůli limitu Resend API ~2 požadavky/s) */
  async runDue(limit = 50, gapMs = 550) {
    const due = await this.db.select({ leadId: emailJobs.leadId, step: emailJobs.step }).from(emailJobs)
      .where(and(eq(emailJobs.status, 'scheduled'), lte(emailJobs.sendAt, new Date())))
      .orderBy(emailJobs.sendAt).limit(limit);
    let sent = 0;
    for (const j of due) {
      if (await this.sendJob(j.leadId, j.step)) sent++;
      if (this.email.enabled) await sleep(gapMs);
    }
    this.log.log(JSON.stringify({ k: 'sequence', due: due.length, sent }));
    return { due: due.length, sent };
  }
}
