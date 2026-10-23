import { Body, Controller, Get, NotFoundException, Param, ParseUUIDPipe, Post, Query, Res, UseGuards } from '@nestjs/common';
import { ADMIN_PERIODS, DEFAULT_PERIOD, SEQUENCE, type SequenceStep } from '@etfd/shared';
import type { Response } from 'express';
import { z } from 'zod';
import { csvCell } from '../common/http.js';
import { OriginGuard } from '../common/origin.guard.js';
import { ZodPipe } from '../common/zod.pipe.js';
import { EmailService } from '../email/email.service.js';
import { HandoffService } from '../pipeline/handoff.service.js';
import { PipelineScheduler } from '../pipeline/scheduler.js';
import { AdminGuard } from './admin.guard.js';
import { StatsService } from './stats.service.js';

const EXPORT_COLS = ['created_at', 'email', 'stage', 'score', 'monthly_band', 'wants_call', 'phone', 'variant', 'source', 'utm_source', 'utm_campaign', 'utm_content', 'device', 'interest', 'calc_monthly', 'handoff_status', 'unsubscribed_at'] as const;
const toCamel = (c: string) => c.replace(/_(\w)/g, (_, x: string) => x.toUpperCase());

const period = (d?: string) => (ADMIN_PERIODS as readonly number[]).includes(Number(d)) ? Number(d) : DEFAULT_PERIOD;
// útrata z formuláře: „12 500“ i „12500,5“ → celé koruny
const SpendBody = z.object({
  key: z.string().trim().min(1).max(60),
  czk: z.string().transform((v) => Math.round(Number(v.replace(/\s/g, '').replace(',', '.')))).pipe(z.number().int().nonnegative()),
});
const StepParam = z.enum(SEQUENCE.map((s) => s.step) as [SequenceStep, ...SequenceStep[]]);

/** Admin dashboard. Formuláře jsou POST přes Next rewrite a odpovídají 303 zpět na stránku. */
@Controller('admin')
@UseGuards(AdminGuard)
export class AdminController {
  constructor(
    private readonly stats: StatsService,
    private readonly email: EmailService,
    private readonly handoffs: HandoffService,
    private readonly scheduler: PipelineScheduler,
  ) {}

  @Get('dashboard')
  async dashboard(@Query('d') d?: string) {
    return { ...(await this.stats.dashboard(period(d))), emailEnabled: this.email.enabled };
  }

  /** Trychtýř a fáze jako JSON (monitoring, E2E test) */
  @Get('funnel')
  async funnel(@Query('d') d?: string) {
    const days = Math.min(Number(d) || DEFAULT_PERIOD, 365);
    const [funnel, stages] = await Promise.all([this.stats.funnel(days), this.stats.stageCounts(days)]);
    return { funnel, stages, generated: new Date().toISOString() };
  }

  @Get('leads/:id')
  async lead(@Param('id', ParseUUIDPipe) id: string) {
    const detail = await this.stats.leadDetail(id);
    if (!detail) throw new NotFoundException({ error: 'lead' });
    return detail;
  }

  @Post('leads/:id/handoff')
  @UseGuards(OriginGuard)
  async manualHandoff(@Param('id', ParseUUIDPipe) id: string, @Res() res: Response) {
    const lead = await this.stats.findLead(id);
    if (lead) await this.handoffs.handoff(lead, { manual: true });
    return res.redirect(303, `/admin/lead/${id}`);
  }

  @Post('spend')
  @UseGuards(OriginGuard)
  async spend(@Body(new ZodPipe(SpendBody)) body: z.infer<typeof SpendBody>, @Res() res: Response) {
    await this.stats.saveSpend(body.key, body.czk);
    return res.redirect(303, '/admin');
  }

  @Post('sequence/run')
  @UseGuards(OriginGuard)
  async runSequence(@Res() res: Response) {
    await this.scheduler.run();
    return res.redirect(303, '/admin');
  }

  @Get('email/:step')
  emailPreview(@Param('step', new ZodPipe(StepParam)) step: SequenceStep) {
    return { subject: this.email.subject(step), html: this.email.preview(step) };
  }

  /** Export leadů pro CRM / call centrum */
  @Get('export')
  async export(@Res() res: Response) {
    const rows = await this.stats.allLeads();
    const csv = [EXPORT_COLS.join(','), ...rows.map((r) => EXPORT_COLS.map((c) => csvCell(r[toCamel(c) as keyof typeof r])).join(','))].join('\n');
    res.setHeader('content-type', 'text/csv; charset=utf-8');
    res.setHeader('content-disposition', `attachment; filename="leady-${new Date().toISOString().slice(0, 10)}.csv"`);
    res.send(`\uFEFF${csv}`); // BOM – Excel pak správně načte diakritiku
  }
}
