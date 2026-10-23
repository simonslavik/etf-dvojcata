import 'reflect-metadata';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module.js';
import { configureApp } from './app.setup.js';

/** Vstup pro Vercel Function: aplikace se inicializuje jednou na instanci a pak obsluhuje požadavky přes Express */
type Handler = (req: IncomingMessage, res: ServerResponse) => void;

let server: Promise<Handler> | undefined;

async function bootstrap(): Promise<Handler> {
  const app = configureApp(await NestFactory.create<NestExpressApplication>(AppModule, { bodyParser: false }));
  await app.init();
  return app.getHttpAdapter().getInstance();
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  server ??= bootstrap();
  (await server)(req, res);
}
