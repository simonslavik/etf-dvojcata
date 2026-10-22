import { Module } from '@nestjs/common';
import { EmailModule } from '../email/email.module.js';
import { PipelineModule } from '../pipeline/pipeline.module.js';
import { AdminAuthController, AdminController } from './admin.controller.js';

@Module({ imports: [EmailModule, PipelineModule], controllers: [AdminAuthController, AdminController] })
export class AdminModule {}
