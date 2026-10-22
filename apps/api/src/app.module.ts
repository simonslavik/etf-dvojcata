import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AdminModule } from './admin/admin.module.js';
import { validateEnv } from './config/env.js';
import { DatabaseModule } from './db/database.module.js';
import { HealthController } from './health/health.controller.js';
import { PipelineModule } from './pipeline/pipeline.module.js';
import { TrackingModule } from './tracking/tracking.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validateEnv, ignoreEnvFile: true }),
    // Krátkodobé limity na IP (in-memory, API běží jako jeden proces); konkrétní limity mají endpointy přes @Throttle
    ThrottlerModule.forRoot({ throttlers: [{ ttl: 60_000, limit: 300 }], errorMessage: 'Příliš mnoho pokusů. Zkuste to prosím za pár minut.' }),
    ScheduleModule.forRoot(),
    DatabaseModule,
    TrackingModule,
    PipelineModule,
    AdminModule,
  ],
  controllers: [HealthController],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
