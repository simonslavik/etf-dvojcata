import { ForbiddenException, Injectable, type CanActivate, type ExecutionContext } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';
import type { Env } from '../config/env.js';

/**
 * Formuláře smí odesílat jen náš web. Prohlížeč posílá Origin u každého POST z fetch i formuláře –
 * chybí jen u skriptů (curl), proto mimo vývoj bez Originu odmítneme (jinak by šlo /lead zneužít k rozesílání e-mailů).
 */
const sameHost = (a: string, b: string) => {
  try {
    return new URL(a).host === new URL(b).host;
  } catch {
    return false;
  }
};

@Injectable()
export class OriginGuard implements CanActivate {
  constructor(private readonly config: ConfigService<Env, true>) {}

  canActivate(ctx: ExecutionContext) {
    if (this.config.get('NODE_ENV', { infer: true }) === 'development') return true;
    const origin = ctx.switchToHttp().getRequest<Request>().headers.origin;
    if (!origin || !sameHost(origin, this.config.get('SITE_URL', { infer: true }))) throw new ForbiddenException({ error: 'origin' });
    return true;
  }
}
