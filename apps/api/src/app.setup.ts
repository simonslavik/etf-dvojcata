import type { NestExpressApplication } from '@nestjs/platform-express';
import cookieParser from 'cookie-parser';
import express from 'express';

/** Společné nastavení pro běh i testy */
export function configureApp(app: NestExpressApplication) {
  // Za Next rewrite / reverse proxy: req.ip = první adresa z X-Forwarded-For
  app.set('trust proxy', true);
  app.disable('x-powered-by');
  app.use(express.json({ limit: '16kb' }));
  // sendBeacon posílá text/plain (simple request bez CORS preflightu) – ZodPipe ho parsuje jako JSON
  app.use(express.text({ type: 'text/plain', limit: '16kb' }));
  // Formuláře adminu (bez JS)
  app.use(express.urlencoded({ extended: false, limit: '16kb' }));
  app.use(cookieParser());
  app.use((_req: express.Request, res: express.Response, next: express.NextFunction) => {
    res.setHeader('cache-control', 'no-store');
    next();
  });
  return app;
}
