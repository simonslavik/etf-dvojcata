import { Injectable } from '@nestjs/common';
import { DAY_MS, FUNNEL, insights, NO_UTM, STAGES, VARIANTS, type Stage, type Variant } from '@etfd/shared';
import { and, asc, desc, eq, gte, inArray, sql } from 'drizzle-orm';
import { InjectDb, type Db } from '../db/db.js';
import { adSpend, emailJobs, events, leads } from '../db/schema.js';
import { leadSids } from '../pipeline/scoring.service.js';

type FunnelCounts = Record<string, number>;
const since = (days: number) => new Date(Date.now() - days * DAY_MS);

/** Dotazy pro admin dashboard: trychtýř, fáze, kampaně, sekvence, leady */
@Injectable()
export class StatsService {
  constructor(@InjectDb() private readonly db: Db) {}

  /** Vše pro hlavní stránku dashboardu jedním voláním */
  async dashboard(days: number) {
    const [funnel, stages, campaigns, daily, sequence, latest] = await Promise.all([
      this.funnel(days),
      this.stageCounts(days),
      this.campaigns(days),
      this.dailyLeads(),
      this.sequenceStats(),
      this.recentLeads(),
    ]);
    return { days, funnel, stages, campaigns, daily, sequence, latest, insights: insights(funnel.all, funnel.twin, funnel.fees) };
  }

  /** Unikátní relace v každém kroku trychtýře, po variantách */
  async funnel(days: number) {
    const cols = Object.fromEntries(
      FUNNEL.map((s) => [s.key, sql<number>`(count(distinct ${events.sid}) filter (where ${inArray(events.event, s.events)}))::int`]),
    );
    const rows = await this.db
      .select({ variant: events.variant, ...cols })
      .from(events)
      .where(gte(events.createdAt, since(days)))
      .groupBy(events.variant);
    const empty = (): FunnelCounts => Object.fromEntries(FUNNEL.map((s) => [s.key, 0]));
    const by: Record<Variant, FunnelCounts> = { twin: empty(), fees: empty() };
    for (const r of rows as Array<{ variant: Variant } & Record<string, unknown>>) {
      if (!by[r.variant]) continue;
      for (const s of FUNNEL) by[r.variant][s.key] = Number(r[s.key]) || 0;
    }
    // relace má vždy jednu variantu → součet = celkem
    const all = Object.fromEntries(FUNNEL.map((s) => [s.key, VARIANTS.reduce((a, v) => a + by[v][s.key], 0)]));
    return { all, ...by };
  }

  async stageCounts(days: number) {
    const rows = await this.db
      .select({ stage: leads.stage, variant: leads.variant, n: sql<number>`count(*)::int` })
      .from(leads)
      .where(gte(leads.createdAt, since(days)))
      .groupBy(leads.stage, leads.variant);
    const empty = () => Object.fromEntries(STAGES.map((s) => [s, 0])) as Record<Stage, number>;
    const out: Record<'all' | Variant, Record<Stage, number>> = { all: empty(), twin: empty(), fees: empty() };
    for (const r of rows) {
      out.all[r.stage] += r.n;
      out[r.variant][r.stage] += r.n;
    }
    return out;
  }

  /** Kampaně = kreativy podle utm_content: návštěvy, leady, kvalifikovaní, útrata → CPL */
  async campaigns(days: number) {
    const from = since(days);
    const [visits, ls, spend] = await Promise.all([
      this.db
        .select({ key: events.utmContent, n: sql<number>`count(distinct ${events.sid})::int` })
        .from(events)
        .where(and(eq(events.event, 'page_view'), gte(events.createdAt, from)))
        .groupBy(events.utmContent),
      this.db
        .select({
          key: leads.utmContent,
          leads: sql<number>`count(*)::int`,
          qualified: sql<number>`(count(*) filter (where ${inArray(leads.stage, ['qualified', 'handed_over'])}))::int`,
          handed: sql<number>`(count(*) filter (where ${eq(leads.stage, 'handed_over')}))::int`,
        })
        .from(leads)
        .where(gte(leads.createdAt, from))
        .groupBy(leads.utmContent),
      this.db.select().from(adSpend),
    ]);
    const keys = new Set([...visits.map((v) => v.key ?? NO_UTM), ...ls.map((l) => l.key ?? NO_UTM), ...spend.map((s) => s.utmContent)]);
    return [...keys]
      .map((key) => {
        const raw = key === NO_UTM ? null : key;
        const v = visits.find((x) => x.key === raw)?.n ?? 0;
        const l = ls.find((x) => x.key === raw);
        const czk = spend.find((s) => s.utmContent === key)?.czk ?? null;
        const n = l?.leads ?? 0;
        return {
          key,
          visits: v,
          leads: n,
          qualified: l?.qualified ?? 0,
          handed: l?.handed ?? 0,
          spend: czk,
          cpl: czk != null && n ? czk / n : null,
          conv: v ? n / v : null,
        };
      })
      .sort((a, b) => b.visits - a.visits);
  }

  async dailyLeads(days = 14) {
    const day = sql<string>`to_char(date_trunc('day', ${leads.createdAt}), 'YYYY-MM-DD')`;
    const rows = await this.db
      .select({ day, n: sql<number>`count(*)::int` })
      .from(leads)
      .where(gte(leads.createdAt, since(days)))
      .groupBy(day)
      .orderBy(day);
    return Array.from({ length: days }, (_, i) => {
      const d = new Date(Date.now() - (days - 1 - i) * DAY_MS).toISOString().slice(0, 10);
      return { day: d, n: rows.find((r) => r.day === d)?.n ?? 0 };
    });
  }

  async sequenceStats() {
    const [rows, clicks] = await Promise.all([
      this.db
        .select({ step: emailJobs.step, status: emailJobs.status, n: sql<number>`count(*)::int` })
        .from(emailJobs)
        .groupBy(emailJobs.step, emailJobs.status),
      this.db
        .select({ step: events.utmContent, n: sql<number>`count(distinct ${events.sid})::int` })
        .from(events)
        .where(eq(events.event, 'email_click'))
        .groupBy(events.utmContent),
    ]);
    return { rows, clicks: Object.fromEntries(clicks.map((c) => [c.step, c.n])) };
  }

  recentLeads(limit = 50) {
    return this.db.select().from(leads).orderBy(desc(leads.createdAt)).limit(limit);
  }

  allLeads() {
    return this.db.select().from(leads).orderBy(desc(leads.createdAt));
  }

  findLead(id: string) {
    return this.db
      .select()
      .from(leads)
      .where(eq(leads.id, id))
      .then((r) => r[0] ?? null);
  }

  /** Lead + celá cesta jeho relace (prohlížeč i server) + stav e-mailové sekvence */
  async leadDetail(id: string) {
    const lead = await this.findLead(id);
    if (!lead) return null;
    const [journey, jobs] = await Promise.all([
      this.db
        .select()
        .from(events)
        .where(inArray(events.sid, leadSids(lead)))
        .orderBy(asc(events.createdAt))
        .limit(300),
      this.db.select().from(emailJobs).where(eq(emailJobs.leadId, id)).orderBy(asc(emailJobs.sendAt)),
    ]);
    return { lead, journey, jobs };
  }

  /** Útrata za kreativu (utm_content) – z ní náklad na lead */
  async saveSpend(utmContent: string, czk: number) {
    await this.db
      .insert(adSpend)
      .values({ utmContent, czk })
      .onConflictDoUpdate({ target: adSpend.utmContent, set: { czk, updatedAt: new Date() } });
  }
}
