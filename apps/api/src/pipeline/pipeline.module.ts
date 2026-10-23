import { Module } from '@nestjs/common';
import { EmailModule } from '../email/email.module.js';
import { TrackingModule } from '../tracking/tracking.module.js';
import { HandoffService } from './handoff.service.js';
import { LeadsController } from './leads.controller.js';
import { LeadsService } from './leads.service.js';
import { LinksController } from './links.controller.js';
import { CronController } from './cron.controller.js';
import { PipelineScheduler } from './scheduler.js';
import { ScoringService } from './scoring.service.js';

@Module({
  imports: [TrackingModule, EmailModule],
  controllers: [LeadsController, LinksController, CronController],
  providers: [ScoringService, HandoffService, LeadsService, PipelineScheduler],
  exports: [HandoffService, LeadsService, PipelineScheduler],
})
export class PipelineModule {}
