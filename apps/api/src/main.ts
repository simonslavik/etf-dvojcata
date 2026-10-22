import 'reflect-metadata';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { configureApp } from './app.setup.js';
import { AppModule } from './app.module.js';

const app = await NestFactory.create<NestExpressApplication>(AppModule, { bodyParser: false });
configureApp(app);
app.enableShutdownHooks();
const port = Number(process.env.PORT) || 4000;
await app.listen(port, '0.0.0.0');
new Logger('Bootstrap').log(`API na :${port}`);
