import 'reflect-metadata';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module.js';
import { configureApp } from './app.setup.js';
import type { Env } from './config/env.js';

const app = await NestFactory.create<NestExpressApplication>(AppModule, { bodyParser: false });
configureApp(app);
app.enableShutdownHooks();
const port = app.get<ConfigService<Env, true>>(ConfigService).get('PORT', { infer: true });
await app.listen(port, '0.0.0.0');
new Logger('Bootstrap').log(`API na :${port}`);
