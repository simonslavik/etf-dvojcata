import { Controller, Get, Headers, Injectable, Logger, UnauthorizedException, type OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SchedulerRegistry } from '@nestjs/schedule';
import { CronJob } from 'cron';
import type { Env } from '../config/env.js';
import { timingSafeEqual } from '../common/http.js';
import { SequenceService } from '../email/sequence.service.js';
import { HandoffService } from './handoff.service.js';

/** Denní běh: splatné kroky e-mailové sekvence + opakování neúspěšných předání */
@Injectable()
export class PipelineScheduler implements OnModuleInit {
  private readonly log = new Logger('Scheduler');

  constructor(
    private readonly sequence: SequenceService,
    private readonly handoffs: HandoffService,
    private readonly registry: SchedulerRegistry,
    private readonly config: ConfigService<Env, true>,
  ) {}

  /** Rozvrh z CRON_SCHEDULE (výchozí 7:00 denně, Europe/Prague) – proto registrace v kódu, ne dekorátorem */
  onModuleInit() {
    const schedule = this.config.get('CRON_SCHEDULE', { infer: true });
    const job = CronJob.from({ cronTime: schedule, timeZone: 'Europe/Prague', onTick: () => void this.run().catch((e: Error) => this.log.error(e.message)) });
    this.registry.addCronJob('pipeline-daily', job);
    job.start();
    this.log.log(`denní běh: ${schedule}`);
  }

  async run() {
    const emails = await this.sequence.runDue();
    const handoffRetries = await this.handoffs.retryFailed();
    return { ...emails, handoffRetries };
  }
}

/** Ruční / externí spuštění (např. systémový cron): Authorization: Bearer $CRON_SECRET */
@Controller('cron')
export class CronController {
  constructor(private readonly scheduler: PipelineScheduler, private readonly config: ConfigService<Env, true>) {}

  @Get('emails')
  run(@Headers('authorization') auth: string | undefined) {
    const secret = this.config.get('CRON_SECRET', { infer: true });
    const dev = this.config.get('NODE_ENV', { infer: true }) === 'development';
    if (!(secret ? timingSafeEqual(auth ?? '', `Bearer ${secret}`) : dev)) throw new UnauthorizedException({ error: 'unauthorized' });
    return this.scheduler.run();
  }
}
