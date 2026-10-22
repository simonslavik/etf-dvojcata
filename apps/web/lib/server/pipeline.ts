/**
 * Lead pipeline: Návštěva → Lead → Kvalifikace → Předání → Péče.
 * Každá změna leadu končí přepočtem skóre a fáze (rescore), aby dashboard i webhook viděly aktuální stav.
 */
import { randomBytes } from 'node:crypto';
import { and, eq, inArray, isNull, lte, sql } from 'drizzle-orm';
import type { Db } from '@/lib/db';
import { emailJobs, events, leads, type Lead } from '@/lib/db/schema';
import { scoreLead, stageFor, SIGNAL_POINTS, type MonthlyBand } from '@etfd/shared';
import { scheduleFor, type SequenceStep } from '@etfd/shared';
import type { Variant } from '@etfd/shared';
import { sendSequenceEmail } from './email';
import { withinLimit } from './rate';

// Okamžitý přehled (D0) má vlastní denní strop, aby ho nemohla vyčerpat sekvence (a naopak)
const DAILY_EMAIL_CAP = Number(process.env.DAILY_EMAIL_CAP) || 300;
const DAILY_NURTURE_CAP = Number(process.env.DAILY_NURTURE_CAP) || 300;
const MAX_ATTEMPTS = 3;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
export const mask = (e: string) => e.replace(/^(.).*(@.*)$/, '$1***$2');
/** Relace leadu pro události mimo prohlížeč (klik v e-mailu, předání) */
const leadSid = (l: Pick<Lead, 'id' | 'sid'>) => l.sid || `lead:${l.id}`;

export interface EventInput {
  sid: string; event: string; variant: Variant;
  utmSource?: string | null; utmCampaign?: string | null; utmContent?: string | null; device?: string | null;
  props?: Record<string, unknown> | null; tMs?: number | null;
}

export async function recordEvent(db: Db, e: EventInput) {
  await db.insert(events).values({ ...e, props: e.props ?? null, tMs: e.tMs ?? null });
}

/* ---------- Lead ---------- */

export interface LeadInput {
  email: string; sid: string | null; variant: Variant; source: string | null;
  utmSource: string | null; utmCampaign: string | null; utmContent: string | null; device: string | null;
  interest: string | null; calcMonthly: number | null; consentText: string | null;
}

export async function captureLead(db: Db, input: LeadInput) {
  const [row] = await db.insert(leads)
    .values({ ...input, token: randomBytes(18).toString('base64url') })
    // Opakované odeslání stejného e-mailu: první kontext (created, zdroj, varianta) zůstává
    .onConflictDoUpdate({ target: leads.email, set: { updatedAt: sql`now()`, sid: sql`coalesce(${leads.sid}, excluded.sid)` } })
    .returning({ id: leads.id, token: leads.token, inserted: sql<boolean>`(xmax = 0)` });
  const isNew = Boolean(row.inserted);

  await recordEvent(db, { sid: input.sid || `lead:${row.id}`, event: 'lead_ok', variant: input.variant, utmSource: input.utmSource, utmCampaign: input.utmCampaign, utmContent: input.utmContent, device: input.device, props: { source: input.source, isNew } });

  let emailSent = false;
  if (isNew) {
    const now = new Date();
    await db.insert(emailJobs).values(scheduleFor(now).map((j) => ({ leadId: row.id, step: j.step, sendAt: j.sendAt }))).onConflictDoNothing();
    emailSent = await sendJob(db, row.id, 'd0_report');
  }
  await rescore(db, row.id);
  // Token (odhlášení, kvalifikace) dostane jen ten, kdo lead právě založil – ne kdokoli, kdo zná cizí e-mail
  return { id: row.id, isNew, emailSent, token: isNew ? row.token : null };
}

export async function rescore(db: Db, leadId: string) {
  const [lead] = await db.select().from(leads).where(eq(leads.id, leadId));
  if (!lead) return null;
  const signalRows = await db.selectDistinct({ event: events.event }).from(events)
    .where(and(inArray(events.sid, [leadSid(lead), `lead:${lead.id}`]), inArray(events.event, Object.keys(SIGNAL_POINTS))));
  const { score, reasons } = scoreLead({ monthlyBand: lead.monthlyBand, wantsCall: lead.wantsCall, signals: signalRows.map((r) => r.event) });
  const stage = stageFor({ score, handedOver: Boolean(lead.handedOverAt), unsubscribed: Boolean(lead.unsubscribedAt) });
  await db.update(leads).set({ score, scoreReasons: reasons, stage, updatedAt: new Date() }).where(eq(leads.id, leadId));
  return { ...lead, score, scoreReasons: reasons, stage };
}

export const leadByToken = async (db: Db, token: string) =>
  (await db.select().from(leads).where(eq(leads.token, token)))[0] ?? null;

/* ---------- Kvalifikace ---------- */

export async function qualify(db: Db, token: string, band: MonthlyBand) {
  const lead = await leadByToken(db, token);
  if (!lead) return false;
  await db.update(leads).set({ monthlyBand: band }).where(eq(leads.id, lead.id));
  await recordEvent(db, { sid: leadSid(lead), event: 'qualify', variant: lead.variant as Variant, props: { band } });
  await rescore(db, lead.id);
  return true;
}

/* ---------- Předání (telefon + výslovný souhlas) ---------- */

export async function requestCall(db: Db, token: string, phone: string, consentText: string) {
  const lead = await leadByToken(db, token);
  if (!lead || lead.unsubscribedAt) return null;
  await db.update(leads).set({ wantsCall: true, phone, callConsentText: consentText }).where(eq(leads.id, lead.id));
  await recordEvent(db, { sid: leadSid(lead), event: 'call_request', variant: lead.variant as Variant });
  const updated = await rescore(db, lead.id);
  // Už předaný lead (dvojí odeslání, /help z e-mailu) se do CRM neposílá znovu – jen se aktualizuje telefon
  if (!updated || lead.handedOverAt) return updated;
  return handoff(db, updated);
}

/**
 * Odešle lead webhookem do CRM / call centra (HANDOFF_WEBHOOK_URL). Bez webhooku zůstane ve frontě
 * „čeká na předání“ a v adminu ho jde předat ručně.
 */
export async function handoff(db: Db, lead: Lead, { manual = false } = {}) {
  const url = process.env.HANDOFF_WEBHOOK_URL;
  let status: string;
  if (manual) status = 'manual';
  else if (!url) status = 'pending_no_webhook';
  else {
    try {
      const r = await fetch(url, {
        method: 'POST',
        headers: { 'content-type': 'application/json', ...(process.env.HANDOFF_WEBHOOK_SECRET ? { 'x-webhook-secret': process.env.HANDOFF_WEBHOOK_SECRET } : {}) },
        body: JSON.stringify({
          type: 'lead.handoff',
          idempotency_key: lead.id, // CRM může odmítnout duplicitu při opakovaném pokusu
          lead: {
            id: lead.id, email: lead.email, phone: lead.phone, created_at: lead.createdAt,
            score: lead.score, score_reasons: lead.scoreReasons, monthly_band: lead.monthlyBand,
            interest: lead.interest, calc_monthly: lead.calcMonthly,
            source: { variant: lead.variant, utm_source: lead.utmSource, utm_campaign: lead.utmCampaign, utm_content: lead.utmContent, device: lead.device },
            consent: lead.callConsentText,
          },
        }),
        signal: AbortSignal.timeout(5000),
      });
      status = r.ok ? 'sent' : `failed_${r.status}`;
    } catch (e) {
      status = `failed_${(e as Error).name}`;
    }
  }
  const delivered = status === 'sent' || status === 'manual';
  await db.update(leads).set({ handoffStatus: status, ...(delivered ? { handedOverAt: new Date() } : {}) }).where(eq(leads.id, lead.id));
  if (delivered) await recordEvent(db, { sid: leadSid(lead), event: 'handoff', variant: lead.variant as Variant, props: { status } });
  console.log(JSON.stringify({ k: 'handoff', lead: mask(lead.email), status }));
  return rescore(db, lead.id);
}

/* ---------- Péče: e-mailová sekvence ---------- */

/**
 * Odešle jeden krok sekvence. Job se nejdřív atomicky „zabere“ (scheduled → sending), takže ho cron
 * a odeslání formuláře nikdy nepošlou dvakrát; odhlášený lead se zkontroluje až po zabrání.
 */
async function sendJob(db: Db, leadId: string, step: SequenceStep) {
  const [job] = await db.update(emailJobs)
    .set({ status: 'sending', attempts: sql`${emailJobs.attempts} + 1` })
    .where(and(eq(emailJobs.leadId, leadId), eq(emailJobs.step, step), eq(emailJobs.status, 'scheduled')))
    .returning({ attempts: emailJobs.attempts });
  if (!job) return false;
  const setJob = (v: Partial<typeof emailJobs.$inferInsert>) =>
    db.update(emailJobs).set(v).where(and(eq(emailJobs.leadId, leadId), eq(emailJobs.step, step)));

  const [lead] = await db.select({ email: leads.email, token: leads.token, unsubscribedAt: leads.unsubscribedAt }).from(leads).where(eq(leads.id, leadId));
  if (!lead || lead.unsubscribedAt) {
    await setJob({ status: 'cancelled' });
    return false;
  }

  const day = new Date().toISOString().slice(0, 10);
  const [capKey, cap] = step === 'd0_report' ? [`mail0:${day}`, DAILY_EMAIL_CAP] : [`mail:${day}`, DAILY_NURTURE_CAP];
  if (!(await withinLimit(db, capKey, cap, 86_400))) {
    await setJob({ status: 'scheduled', attempts: job.attempts - 1, error: 'daily_cap' }); // zkusí další běh cronu
    return false;
  }

  const res = await sendSequenceEmail(lead.email, lead.token, step)
    .catch((e: Error) => ({ sent: false, reason: e.name === 'TimeoutError' ? 'timeout' : e.message, retryable: true }));
  if (res.sent) await setJob({ status: 'sent', sentAt: new Date(), error: null });
  else if (res.reason === 'disabled') await setJob({ status: 'skipped', error: 'disabled' });
  // 429 / 5xx / síť: zkusí to znovu další běh cronu, po MAX_ATTEMPTS pokusech failed
  else await setJob({ status: res.retryable && job.attempts < MAX_ATTEMPTS ? 'scheduled' : 'failed', error: res.reason });
  return res.sent;
}

/** Denní cron: splatné kroky sekvence (s odstupem kvůli limitu Resend API) + opakování neúspěšných předání */
export async function runDueEmails(db: Db, limit = 50) {
  const due = await db.select({ leadId: emailJobs.leadId, step: emailJobs.step }).from(emailJobs)
    .where(and(eq(emailJobs.status, 'scheduled'), lte(emailJobs.sendAt, new Date())))
    .orderBy(emailJobs.sendAt).limit(limit);
  let sent = 0;
  for (const j of due) {
    if (await sendJob(db, j.leadId, j.step as SequenceStep)) sent++;
    await sleep(550); // Resend: ~2 požadavky/s
  }
  const failedHandoffs = await db.select().from(leads)
    .where(and(eq(leads.wantsCall, true), isNull(leads.handedOverAt), isNull(leads.unsubscribedAt), sql`${leads.handoffStatus} like 'failed_%'`)).limit(20);
  for (const l of failedHandoffs) await handoff(db, l);
  return { due: due.length, sent, handoffRetries: failedHandoffs.length };
}

export async function recordEmailClick(db: Db, token: string, step: string) {
  const lead = await leadByToken(db, token);
  if (!lead) return;
  await recordEvent(db, { sid: leadSid(lead), event: 'email_click', variant: lead.variant as Variant, utmSource: 'email', utmContent: step.slice(0, 20) });
  await rescore(db, lead.id);
}

export async function unsubscribe(db: Db, token: string) {
  const lead = await leadByToken(db, token);
  if (!lead) return false;
  if (!lead.unsubscribedAt) {
    await db.update(leads).set({ unsubscribedAt: new Date() }).where(eq(leads.id, lead.id));
    await db.update(emailJobs).set({ status: 'cancelled' }).where(and(eq(emailJobs.leadId, lead.id), eq(emailJobs.status, 'scheduled')));
    await recordEvent(db, { sid: leadSid(lead), event: 'unsubscribe', variant: lead.variant as Variant });
    await rescore(db, lead.id);
  }
  return true;
}
