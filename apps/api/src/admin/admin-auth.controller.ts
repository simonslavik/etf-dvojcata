import { Body, Controller, Post, Res, UseGuards } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Throttle } from '@nestjs/throttler';
import { ADMIN_COOKIE, DAY_MS } from '@etfd/shared';
import type { Response } from 'express';
import { z } from 'zod';
import type { Env } from '../config/env.js';
import { safeEqual } from '../common/http.js';
import { OriginGuard } from '../common/origin.guard.js';
import { LIMITS } from '../common/throttle.js';
import { ZodPipe } from '../common/zod.pipe.js';
import { adminCookieValue } from './admin-auth.js';

const LoginBody = z.object({ token: z.string().max(200).default('') });

/** Přihlášení – obyčejný POST formulář přes Next rewrite, odpověď 303 zpět na stránku (funguje i bez JS) */
@Controller('admin')
export class AdminAuthController {
  constructor(private readonly config: ConfigService<Env, true>) {}

  @Post('login')
  @UseGuards(OriginGuard)
  @Throttle({ default: LIMITS.login })
  login(@Body(new ZodPipe(LoginBody)) body: z.infer<typeof LoginBody>, @Res() res: Response) {
    const token = this.config.get('ADMIN_TOKEN', { infer: true });
    if (!token || !safeEqual(body.token, token)) return res.redirect(303, '/admin/login?e=1');
    res.cookie(ADMIN_COOKIE, adminCookieValue(token), {
      httpOnly: true, sameSite: 'lax', path: '/', maxAge: 14 * DAY_MS,
      secure: this.config.get('SITE_URL', { infer: true }).startsWith('https://'),
    });
    return res.redirect(303, '/admin');
  }

  @Post('logout')
  logout(@Res() res: Response) {
    res.clearCookie(ADMIN_COOKIE, { path: '/' });
    return res.redirect(303, '/admin/login');
  }
}
