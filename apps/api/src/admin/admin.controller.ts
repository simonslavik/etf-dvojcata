import { Body, Controller, Get, NotFoundException, Param, Post, Query, Res, UseGuards } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Throttle } from '@nestjs/throttler';
import { insights, SEQUENCE, type SequenceStep } from '@etfd/shared';
import { eq } from 'drizzle-orm';
import type { Response } from 'express';
import type { Env } from '../config/env.js';
import { csvCell, timingSafeEqual } from '../common/http.js';
import { OriginGuard } from '../common/origin.guard.js';
import { InjectDb, type Db } from '../db/db.js';
import { adSpend, leads } from '../db/schema.js';
import { EmailService } from '../email/email.service.js';
import { HandoffService } from '../pipeline/handoff.service.js';
import { PipelineScheduler } from '../pipeline/scheduler.js';
import { ADMIN_COOKIE, adminCookieValue } from './admin-auth.js';
import { AdminGuard } from './admin.guard.js';
import * as stats from './stats.js';

const PERIODS = [7, 30, 90];
const sinceDays = (d: number) => new Date(Date.now() - d * 86_400_000);
const EXPORT_COLS = ['created_at', 'email', 'stage', 'score', 'monthly_band', 'wants_call', 'phone', 'variant', 'source', 'utm_source', 'utm_campaign', 'utm_content', 'device', 'interest', 'calc_monthly', 'handoff_status', 'unsubscribed_at'] as const;

/** Přihlášení – formuláře adminu jsou obyčejné POST formuláře přes Next rewrite (303 zpět na stránku) */
@Controller('admin')
export class AdminAuthController {
  constructor(private readonly config: ConfigService<Env, true>) {}

  @Post('login')
  @UseGuards(OriginGuard)
  @Throttle({ default: { limit: 10, ttl: 900_000 } })
  login(@Body() body: { token?: string }, @Res() res: Response) {
    const token = this.config.get('ADMIN_TOKEN', { infer: true });
    if (!token || !timingSafeEqual(String(body?.token ?? ''), token)) return res.redirect(303, '/admin/login?e=1');
    res.cookie(ADMIN_COOKIE, adminCookieValue(token), {
      httpOnly: true, sameSite: 'lax', path: '/', maxAge: 14 * 86_400_000,
      secure: this.config.get('SITE_URL', { infer: true }).startsWith('https://'),
    });
    return res.redirect(303, '/admin');
  }

  @Post('logout')
  logout(@Res() res: Response) {
    res.clearCookie(ADMIN_COOKIE, { path: '/' });
    return res.redirect(303, '/admin/login');
  }
}

@Controller('admin')
@UseGuards(AdminGuard)
export class AdminController {
  constructor(
    @InjectDb() private readonly db: Db,
    private readonly email: EmailService,
    private readonly handoffs: HandoffService,
    private readonly scheduler: PipelineScheduler,
  ) {}

  /** Vše pro hlavní stránku dashboardu jedním požadavkem */
  @Get('dashboard')
  async dashboard(@Query('d') d?: string) {
    const days = PERIODS.includes(Number(d)) ? Number(d) : 30;
    const since = sinceDays(days);
    const [funnel, stages, campaigns, daily, sequence, latest] = await Promise.all([
      stats.funnel(this.db, since), stats.stageCounts(this.db, since), stats.campaigns(this.db, since),
      stats.dailyLeads(this.db), stats.sequenceStats(this.db), stats.recentLeads(this.db, 50),
    ]);
    return { days, funnel, stages, campaigns, daily, sequence, latest, insights: insights(funnel.all, funnel.twin, funnel.fees), emailEnabled: this.email.enabled };
  }

  /** Lievik a fáze jako JSON (monitoring, E2E test) */
  @Get('funnel')
  async funnel(@Query('d') d?: string) {
    const since = sinceDays(Math.min(Number(d) || 30, 365));
    return { funnel: await stats.funnel(this.db, since), stages: await stats.stageCounts(this.db, since), generated: new Date().toISOString() };
  }

  @Get('leads/:id')
  async lead(@Param('id') id: string) {
    const detail = /^[0-9a-f-]{36}$/.test(id) ? await stats.leadDetail(this.db, id) : null;
    if (!detail) throw new NotFoundException({ error: 'lead' });
    return detail;
  }

  @Post('leads/:id/handoff')
  @UseGuards(OriginGuard)
  async manualHandoff(@Param('id') id: string, @Res() res: Response) {
    const [lead] = /^[0-9a-f-]{36}$/.test(id) ? await this.db.select().from(leads).where(eq(leads.id, id)) : [];
    if (lead) await this.handoffs.handoff(lead, { manual: true });
    return res.redirect(303, `/admin/lead/${id}`);
  }

  @Post('spend')
  @UseGuards(OriginGuard)
  async spend(@Body() body: { key?: string; czk?: string }, @Res() res: Response) {
    const key = String(body?.key || '').slice(0, 60);
    const czk = Math.round(Number(String(body?.czk ?? '').replace(/\s/g, '').replace(',', '.')));
    if (key && Number.isFinite(czk) && czk >= 0) {
      await this.db.insert(adSpend).values({ utmContent: key, czk }).onConflictDoUpdate({ target: adSpend.utmContent, set: { czk, updatedAt: new Date() } });
    }
    return res.redirect(303, '/admin');
  }

  @Post('sequence/run')
  @UseGuards(OriginGuard)
  async runSequence(@Res() res: Response) {
    await this.scheduler.run();
    return res.redirect(303, '/admin');
  }

  @Get('email/:step')
  emailPreview(@Param('step') step: string) {
    if (!SEQUENCE.some((s) => s.step === step)) throw new NotFoundException({ error: 'step' });
    return { subject: this.email.subject(step as SequenceStep), html: this.email.preview(step as SequenceStep) };
  }

  /** Export leadů pro CRM / call centrum */
  @Get('export')
  async export(@Res() res: Response) {
    const rows = await stats.allLeads(this.db);
    const camel = (c: string) => c.replace(/_(\w)/g, (_, x: string) => x.toUpperCase()) as keyof (typeof rows)[number];
    const csv = [EXPORT_COLS.join(','), ...rows.map((r) => EXPORT_COLS.map((c) => csvCell(r[camel(c)])).join(','))].join('\n');
    res.setHeader('content-type', 'text/csv; charset=utf-8');
    res.setHeader('content-disposition', `attachment; filename="leady-${new Date().toISOString().slice(0, 10)}.csv"`);
    res.send(`﻿${csv}`);
  }
}
