import { Controller, Get, HttpCode, Logger, Post, Query, Res } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Response } from 'express';
import type { Env } from '../config/env.js';
import { sameOriginUrl } from '../common/http.js';
import { LeadsService } from './leads.service.js';

/** Odkazy z e-mailů: měření kliku + přesměrování a one-click odhlášení */
@Controller()
export class LinksController {
  private readonly log = new Logger('Links');
  private readonly site: string;

  constructor(private readonly leads: LeadsService, config: ConfigService<Env, true>) {
    this.site = new URL(config.get('SITE_URL', { infer: true })).origin;
  }

  /** Klik z e-mailu: zapíše email_click (skóre) a přesměruje – jen v rámci webu, žádný open redirect */
  @Get('r')
  async click(@Query('t') token: string | undefined, @Query('s') step: string | undefined, @Query('to') to: string | undefined, @Res() res: Response) {
    if (token) await this.leads.recordEmailClick(token, step || 'email').catch((e: Error) => this.log.error(e.message));
    const dest = sameOriginUrl(to, this.site);
    dest.searchParams.set('utm_source', 'email');
    dest.searchParams.set('utm_medium', 'nurture');
    // Relativní cesta: přes Next rewrite zůstane návštěvník na stejné doméně
    res.redirect(302, dest.pathname + dest.search + dest.hash);
  }

  /** One-click odhlášení z hlavičky List-Unsubscribe (RFC 8058) – poštovní klient pošle POST */
  @Post('unsubscribe')
  @HttpCode(200)
  async unsubscribe(@Query('t') token: string | undefined) {
    return { ok: token ? await this.leads.unsubscribe(token) : false };
  }

  /** GET (otevření odkazu) nic nemění – skenery odkazů v poště by jinak odhlašovaly samy */
  @Get('unsubscribe')
  unsubscribePage(@Query('t') token: string | undefined, @Res() res: Response) {
    res.redirect(302, `/unsubscribe?t=${encodeURIComponent(token || '')}`);
  }
}
