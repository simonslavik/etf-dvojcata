/**
 * Lead pipeline: Návštěva → Lead → Kvalifikace → Předání → Péče.
 * Každá změna leadu končí přepočtem skóre a fáze (rescore), aby dashboard i webhook viděly aktuální stav.
 */
import { randomBytes } from 'node:crypto';
import { and, eq, inArray, isNull, lte, sql } from 'drizzle-orm';
import type { Db } from '@/lib/db';
import { emailJobs, events, leads, type Lead } from '@/lib/db/schema';
import { scoreLead, stageFor, SIGNAL_POINTS, type MonthlyBand } from '@/lib/pipeline/score';
import { scheduleFor, type SequenceStep } from '@/lib/pipeline/sequence';
import type { Variant } from '@/lib/events';
import { sendSequenceEmail } from './email';
import { withinLimit } from './rate';

const DAILY_EMAIL_CAP = Number(process.env.DAILY_EMAIL_CAP) || 300;
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
    emailSent = await sendJob(db, { leadId: row.id, email: input.email, token: row.token, step: 'd0_report' });
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
  return updated ? handoff(db, updated) : null;
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

async function sendJob(db: Db, job: { leadId: string; email: string; token: string; step: SequenceStep }) {
  const day = new Date().toISOString().slice(0, 10);
  const res = !(await withinLimit(db, `mail:${day}`, DAILY_EMAIL_CAP, 86_400))
    ? { sent: false, reason: 'daily_cap' }
    : await sendSequenceEmail(job.email, job.token, job.step).catch((e: Error) => ({ sent: false, reason: e.message }));
  // disabled = Resend není nastavený → skipped (ne chyba); daily_cap → zůstane naplánovaný na další běh
  const status = res.sent ? 'sent' : res.reason === 'disabled' ? 'skipped' : res.reason === 'daily_cap' ? 'scheduled' : 'failed';
  await db.update(emailJobs)
    .set({ status, sentAt: res.sent ? new Date() : null, error: res.sent ? null : res.reason })
    .where(and(eq(emailJobs.leadId, job.leadId), eq(emailJobs.step, job.step)));
  return res.sent;
}

/** Volá denní cron: pošle všechny splatné kroky sekvence (odhlášeným nic) */
export async function runDueEmails(db: Db, limit = 200) {
  const due = await db.select({ leadId: emailJobs.leadId, step: emailJobs.step, email: leads.email, token: leads.token })
    .from(emailJobs).innerJoin(leads, eq(leads.id, emailJobs.leadId))
    .where(and(eq(emailJobs.status, 'scheduled'), lte(emailJobs.sendAt, new Date()), isNull(leads.unsubscribedAt)))
    .orderBy(emailJobs.sendAt).limit(limit);
  let sent = 0;
  for (const j of due) if (await sendJob(db, { ...j, step: j.step as SequenceStep })) sent++;
  return { due: due.length, sent };
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
