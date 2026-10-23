import { Injectable, UnauthorizedException, type CanActivate, type ExecutionContext } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ADMIN_COOKIE } from '@etfd/shared';
import type { Request } from 'express';
import type { Env } from '../config/env.js';
import { verifyAdminCookie } from './admin-auth.js';

/** Bez ADMIN_TOKEN otevřeno jen ve vývoji; jinak fail closed */
@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private readonly config: ConfigService<Env, true>) {}

  canActivate(ctx: ExecutionContext) {
    const token = this.config.get('ADMIN_TOKEN', { infer: true });
    if (!token) {
      if (this.config.get('NODE_ENV', { infer: true }) === 'development') return true;
      throw new UnauthorizedException({ error: 'admin_disabled', message: 'ADMIN_TOKEN není nastavený' });
    }
    const cookie = (ctx.switchToHttp().getRequest<Request>().cookies as Record<string, string> | undefined)?.[ADMIN_COOKIE] ?? '';
    if (!verifyAdminCookie(cookie, token)) throw new UnauthorizedException({ error: 'unauthorized' });
    return true;
  }
}
