import { Injectable, UnauthorizedException, type CanActivate, type ExecutionContext } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';
import type { Env } from '../config/env.js';
import { safeEqual } from '../common/http.js';

/** Externí spouštění denního běhu (systémový cron, Vercel Cron): Authorization: Bearer $CRON_SECRET */
@Injectable()
export class CronGuard implements CanActivate {
  constructor(private readonly config: ConfigService<Env, true>) {}

  canActivate(ctx: ExecutionContext) {
    const secret = this.config.get('CRON_SECRET', { infer: true });
    const auth = ctx.switchToHttp().getRequest<Request>().headers.authorization ?? '';
    const ok = secret ? safeEqual(auth, `Bearer ${secret}`) : this.config.get('NODE_ENV', { infer: true }) === 'development';
    if (!ok) throw new UnauthorizedException({ error: 'unauthorized' });
    return true;
  }
}
