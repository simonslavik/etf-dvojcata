import { Module } from '@nestjs/common';
import { EmailModule } from '../email/email.module.js';
import { PipelineModule } from '../pipeline/pipeline.module.js';
import { AdminAuthController } from './admin-auth.controller.js';
import { AdminController } from './admin.controller.js';
import { StatsService } from './stats.service.js';

@Module({ imports: [EmailModule, PipelineModule], controllers: [AdminAuthController, AdminController], providers: [StatsService] })
export class AdminModule {}
