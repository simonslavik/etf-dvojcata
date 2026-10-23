import { Injectable, Logger, type OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SchedulerRegistry } from '@nestjs/schedule';
import { CronJob } from 'cron';
import type { Env } from '../config/env.js';
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
    const job = CronJob.from({
      cronTime: schedule,
      timeZone: 'Europe/Prague',
      onTick: () => void this.run().catch((e: Error) => this.log.error(e.message)),
    });
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
