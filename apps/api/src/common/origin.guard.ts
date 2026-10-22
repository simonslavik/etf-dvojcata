import { ForbiddenException, Injectable, type CanActivate, type ExecutionContext } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';
import type { Env } from '../config/env.js';

/**
 * Formuláře smí odesílat jen náš web. Prohlížeč posílá Origin u každého POST z fetch i formuláře –
 * chybí jen u skriptů (curl), proto mimo vývoj bez Originu odmítneme (jinak by šlo /lead zneužít k rozesílání e-mailů).
 */
@Injectable()
export class OriginGuard implements CanActivate {
  constructor(private readonly config: ConfigService<Env, true>) {}

  canActivate(ctx: ExecutionContext) {
    if (this.config.get('NODE_ENV', { infer: true }) === 'development') return true;
    const origin = ctx.switchToHttp().getRequest<Request>().headers.origin;
    let ok = false;
    try { ok = Boolean(origin) && new URL(origin!).host === new URL(this.config.get('SITE_URL', { infer: true })).host; } catch { ok = false; }
    if (!ok) throw new ForbiddenException({ error: 'origin' });
    return true;
  }
}
