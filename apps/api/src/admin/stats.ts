/* Dotazy pro admin dashboard (lievik, fáze, kampaně, sekvence, leady). */
import { and, asc, desc, eq, gte, inArray, sql } from 'drizzle-orm';
import type { Db } from '../db/db.js';
import { adSpend, emailJobs, events, leads } from '../db/schema.js';
import { FUNNEL, STAGES, VARIANTS, type Stage, type Variant } from '@etfd/shared';

export type FunnelCounts = Record<string, number>;

export async function funnel(db: Db, since: Date) {
  const cols = Object.fromEntries(FUNNEL.map((s) => [s.key, sql<number>`(count(distinct ${events.sid}) filter (where ${inArray(events.event, s.events)}))::int`]));
  const rows = await db.select({ variant: events.variant, ...cols }).from(events).where(gte(events.createdAt, since)).groupBy(events.variant);
  const by = Object.fromEntries(VARIANTS.map((v) => [v, Object.fromEntries(FUNNEL.map((s) => [s.key, 0]))])) as Record<Variant, FunnelCounts>;
  for (const r of rows as Record<string, unknown>[]) {
    if (!((r.variant as string) in by)) continue;
    for (const s of FUNNEL) by[r.variant as Variant][s.key] = Number(r[s.key]) || 0;
  }
  // relace má vždy jednu variantu → součet = celkem
  const all = Object.fromEntries(FUNNEL.map((s) => [s.key, VARIANTS.reduce((a, v) => a + by[v][s.key], 0)]));
  return { all, ...by } as Record<'all' | Variant, FunnelCounts>;
}

export async function stageCounts(db: Db, since: Date) {
  const rows = await db.select({ stage: leads.stage, variant: leads.variant, n: sql<number>`count(*)::int` }).from(leads)
    .where(gte(leads.createdAt, since)).groupBy(leads.stage, leads.variant);
  const empty = () => Object.fromEntries(STAGES.map((s) => [s, 0])) as Record<Stage, number>;
  const out: Record<string, Record<Stage, number>> = { all: empty() };
  for (const v of VARIANTS) out[v] = empty();
  for (const r of rows) {
    const s = r.stage as Stage;
    out.all[s] += Number(r.n);
    if (out[r.variant]) out[r.variant][s] += Number(r.n);
  }
  return out;
}

/** Kampaně = kreativy podle utm_content: návštěvy, leady, kvalifikovaní, útrata → CPL */
export async function campaigns(db: Db, since: Date) {
  const visits = await db.select({ key: events.utmContent, n: sql<number>`count(distinct ${events.sid})::int` }).from(events)
    .where(and(eq(events.event, 'page_view'), gte(events.createdAt, since))).groupBy(events.utmContent);
  const ls = await db.select({
    key: leads.utmContent,
    leads: sql<number>`count(*)::int`,
    qualified: sql<number>`(count(*) filter (where ${inArray(leads.stage, ['qualified', 'handed_over'])}))::int`,
    handed: sql<number>`(count(*) filter (where ${eq(leads.stage, 'handed_over')}))::int`,
  }).from(leads).where(gte(leads.createdAt, since)).groupBy(leads.utmContent);
  const spend = await db.select().from(adSpend);

  const keys = new Set([...visits.map((v) => v.key ?? '(bez UTM)'), ...ls.map((l) => l.key ?? '(bez UTM)'), ...spend.map((s) => s.utmContent)]);
  return [...keys].map((key) => {
    const raw = key === '(bez UTM)' ? null : key;
    const v = visits.find((x) => x.key === raw)?.n ?? 0;
    const l = ls.find((x) => x.key === raw);
    const czk = spend.find((s) => s.utmContent === key)?.czk ?? null;
    const n = Number(l?.leads ?? 0);
    return {
      key, visits: Number(v), leads: n, qualified: Number(l?.qualified ?? 0), handed: Number(l?.handed ?? 0), spend: czk,
      cpl: czk != null && n ? czk / n : null, conv: v ? n / Number(v) : null,
    };
  }).sort((a, b) => b.visits - a.visits);
}

export async function dailyLeads(db: Db, days = 14) {
  const since = new Date(Date.now() - days * 86_400_000);
  const day = sql<string>`to_char(date_trunc('day', ${leads.createdAt}), 'YYYY-MM-DD')`;
  const rows = await db.select({ day, n: sql<number>`count(*)::int` }).from(leads).where(gte(leads.createdAt, since)).groupBy(day).orderBy(day);
  return Array.from({ length: days }, (_, i) => {
    const d = new Date(Date.now() - (days - 1 - i) * 86_400_000).toISOString().slice(0, 10);
    return { day: d, n: Number(rows.find((r) => r.day === d)?.n ?? 0) };
  });
}

export async function sequenceStats(db: Db) {
  const rows = await db.select({ step: emailJobs.step, status: emailJobs.status, n: sql<number>`count(*)::int` }).from(emailJobs).groupBy(emailJobs.step, emailJobs.status);
  const clicks = await db.select({ step: events.utmContent, n: sql<number>`count(distinct ${events.sid})::int` }).from(events).where(eq(events.event, 'email_click')).groupBy(events.utmContent);
  return { rows: rows.map((r) => ({ ...r, n: Number(r.n) })), clicks: Object.fromEntries(clicks.map((c) => [c.step, Number(c.n)])) };
}

export const recentLeads = (db: Db, limit = 50) =>
  db.select().from(leads).orderBy(desc(leads.createdAt)).limit(limit);

export async function leadDetail(db: Db, id: string) {
  const [lead] = await db.select().from(leads).where(eq(leads.id, id));
  if (!lead) return null;
  const sids = [lead.sid, `lead:${lead.id}`].filter(Boolean) as string[];
  const journey = await db.select().from(events).where(inArray(events.sid, sids)).orderBy(asc(events.createdAt)).limit(300);
  const jobs = await db.select().from(emailJobs).where(eq(emailJobs.leadId, id)).orderBy(asc(emailJobs.sendAt));
  return { lead, journey, jobs };
}

export const allLeads = (db: Db) => db.select().from(leads).orderBy(desc(leads.createdAt));
