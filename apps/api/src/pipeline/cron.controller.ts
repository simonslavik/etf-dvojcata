import { Controller, Get, UseGuards } from '@nestjs/common';
import { CronGuard } from './cron.guard.js';
import { PipelineScheduler } from './scheduler.js';

@Controller('cron')
@UseGuards(CronGuard)
export class CronController {
  constructor(private readonly scheduler: PipelineScheduler) {}

  /** Ruční / externí spuštění denního běhu (sekvence + opakování předání) */
  @Get('emails')
  run() {
    return this.scheduler.run();
  }
}
