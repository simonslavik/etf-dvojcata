import type { SequenceStep, Stage, Variant } from '@etfd/shared';
import { pgTable, text, integer, boolean, timestamp, jsonb, uuid, bigserial, serial, index, uniqueIndex } from 'drizzle-orm/pg-core';

export type JobStatus = 'scheduled' | 'sending' | 'sent' | 'failed' | 'skipped' | 'cancelled';

/** Každá událost z prohlížeče i serveru – z nich se skládá trychtýř a cesta jedné relace */
export const events = pgTable(
  'events',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    sid: text('sid').notNull(),
    event: text('event').notNull(),
    variant: text('variant').$type<Variant>().notNull(),
    utmSource: text('utm_source'),
    utmCampaign: text('utm_campaign'),
    utmContent: text('utm_content'),
    device: text('device'),
    props: jsonb('props').$type<Record<string, unknown>>(),
    tMs: integer('t_ms'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('events_created_idx').on(t.createdAt), index('events_sid_idx').on(t.sid)],
);

export const leads = pgTable(
  'leads',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    email: text('email').notNull(),
    /** Náhodný token do odkazů v e-mailech (odhlášení, měření kliků) – e-mail se do URL nedává */
    token: text('token').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    sid: text('sid'),
    variant: text('variant').$type<Variant>().notNull(),
    source: text('source'),
    utmSource: text('utm_source'),
    utmCampaign: text('utm_campaign'),
    utmContent: text('utm_content'),
    device: text('device'),
    interest: text('interest'),
    calcMonthly: integer('calc_monthly'),
    consentText: text('consent_text'),
    monthlyBand: text('monthly_band'),
    wantsCall: boolean('wants_call').notNull().default(false),
    phone: text('phone'),
    callConsentText: text('call_consent_text'),
    score: integer('score').notNull().default(0),
    scoreReasons: jsonb('score_reasons').$type<{ label: string; points: number }[]>(),
    stage: text('stage').$type<Stage>().notNull().default('lead'),
    handedOverAt: timestamp('handed_over_at', { withTimezone: true }),
    handoffStatus: text('handoff_status'),
    unsubscribedAt: timestamp('unsubscribed_at', { withTimezone: true }),
  },
  (t) => [uniqueIndex('leads_email_uq').on(t.email), uniqueIndex('leads_token_uq').on(t.token), index('leads_created_idx').on(t.createdAt)],
);

export const emailJobs = pgTable(
  'email_jobs',
  {
    id: serial('id').primaryKey(),
    leadId: uuid('lead_id')
      .notNull()
      .references(() => leads.id, { onDelete: 'cascade' }),
    step: text('step').$type<SequenceStep>().notNull(),
    sendAt: timestamp('send_at', { withTimezone: true }).notNull(),
    sentAt: timestamp('sent_at', { withTimezone: true }),
    status: text('status').$type<JobStatus>().notNull().default('scheduled'),
    attempts: integer('attempts').notNull().default(0),
    error: text('error'),
  },
  (t) => [uniqueIndex('email_jobs_lead_step_uq').on(t.leadId, t.step), index('email_jobs_due_idx').on(t.status, t.sendAt)],
);

/** Útrata za reklamu podle kreativy (utm_content) – zadává se v adminu, z ní náklad na lead */
export const adSpend = pgTable('ad_spend', {
  utmContent: text('utm_content').primaryKey(),
  czk: integer('czk').notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const rateLimits = pgTable('rate_limits', {
  key: text('key').primaryKey(),
  n: integer('n').notNull(),
  resetAt: timestamp('reset_at', { withTimezone: true }).notNull(),
});

export type Lead = typeof leads.$inferSelect;
export type EventRow = typeof events.$inferSelect;
export type EmailJob = typeof emailJobs.$inferSelect;
