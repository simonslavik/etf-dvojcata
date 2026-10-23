/**
 * Integrační testy celého Nest API proti reálnému Postgresu (TEST_DATABASE_URL, schéma se před během smaže).
 * Lokálně: docker compose up -d db && npm test -w @etfd/api
 */
import 'reflect-metadata';
import type { INestApplication } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';
import { createServer, type Server } from 'node:http';
import pg from 'pg';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, test, vi } from 'vitest';

const DB_URL = process.env.TEST_DATABASE_URL || 'postgres://etfd:etfd@localhost:5544/etfd_test';
const SITE = 'http://localhost:3000';
const ADMIN_TOKEN = 'test-admin-token';
const CRON_SECRET = 'test-cron-secret';

let app: INestApplication;
let hookServer: Server;
const webhooks: { lead: { id: string; phone: string }; idempotency_key: string }[] = [];
const resendCalls: { to: string; subject: string }[] = [];
let sql: pg.Client;

const http = () => request(app.getHttpServer());
const post = (path: string, body: object, ip = '10.0.0.1') => http().post(path).set('origin', SITE).set('x-forwarded-for', ip).send(body);
let ipCounter = 0;
const lead = (email: string) =>
  post('/lead', { email, sid: `sid-${email}`, variant: 'fees', consent_id: 'email_v1', utm_content: 'ad_b' }, `10.1.0.${++ipCounter}`);

beforeAll(async () => {
  sql = new pg.Client({ connectionString: DB_URL });
  await sql.connect();
  await sql.query('drop schema if exists public cascade; create schema public; drop schema if exists drizzle cascade;');

  // Webhook CRM / call centra
  hookServer = createServer((req, res) => {
    let body = '';
    req.on('data', (c) => (body += c));
    req.on('end', () => {
      webhooks.push(JSON.parse(body));
      res.end('ok');
    });
  });
  await new Promise<void>((r) => hookServer.listen(0, r));
  const hookPort = (hookServer.address() as { port: number }).port;

  // Resend se nevolá doopravdy – zachytíme požadavky, ostatní fetch (webhook) projde
  const realFetch = globalThis.fetch;
  vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
    if (String(input).startsWith('https://api.resend.com')) {
      const b = JSON.parse(String(init?.body));
      resendCalls.push({ to: b.to, subject: b.subject });
      return new Response('{"id":"x"}', { status: 200 });
    }
    return realFetch(input, init);
  });

  Object.assign(process.env, {
    NODE_ENV: 'test',
    DATABASE_URL: DB_URL,
    SITE_URL: SITE,
    ADMIN_TOKEN,
    CRON_SECRET,
    RESEND_API_KEY: 're_test',
    RESEND_FROM: 'ETF <test@example.com>',
    HANDOFF_WEBHOOK_URL: `http://127.0.0.1:${hookPort}/hook`,
  });
  // AppModule až po nastavení env – ConfigModule ho validuje při importu
  const { AppModule } = await import('../src/app.module.js');
  const { configureApp } = await import('../src/app.setup.js');
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
  app = moduleRef.createNestApplication<NestExpressApplication>({ bodyParser: false, logger: false });
  configureApp(app as NestExpressApplication);
  await app.init();
});

afterAll(async () => {
  await app?.close();
  await sql?.end();
  hookServer?.close();
});

test('health = API + DB', async () => {
  await http().get('/health').expect(200, { ok: true });
});

describe('tracking', () => {
  test('text/plain ze sendBeacon se uloží', async () => {
    await http()
      .post('/track')
      .set('content-type', 'text/plain')
      .send(JSON.stringify({ event: 'page_view', sid: 's-track', variant: 'twin' }))
      .expect(200);
  });
  test('události vyhrazené serveru prohlížeč poslat nesmí', async () => {
    await http()
      .post('/track')
      .set('content-type', 'text/plain')
      .send(JSON.stringify({ event: 'qualify', sid: 's-track' }))
      .expect(400);
  });
});

describe('lead → kvalifikace → předání', () => {
  let token: string;

  test('bez Originu (curl) odmítnuto – ochrana proti rozesílání e-mailů', async () => {
    await http().post('/lead').send({ email: 'x@example.com' }).expect(403);
  });

  test('nový lead dostane token a hned okamžitý e-mail (D0)', async () => {
    const r = await lead('anna@example.com').expect(200);
    expect(r.body).toMatchObject({ ok: true, emailSent: true });
    token = r.body.token;
    expect(token).toMatch(/^[\w-]{20,}$/);
    expect(resendCalls.filter((c) => c.to === 'anna@example.com')).toHaveLength(1);
  });

  test('opakované odeslání stejného e-mailu token neprozradí a druhý e-mail nepošle', async () => {
    const r = await lead('ANNA@example.com').expect(200);
    expect(r.body.token).toBeNull();
    expect(resendCalls.filter((c) => c.to === 'anna@example.com')).toHaveLength(1);
  });

  test('honeypot: bot dostane OK, nic se neuloží', async () => {
    await post('/lead', { email: 'bot@example.com', hp_f7: 'x' }).expect(200);
    const { rows } = await sql.query("select 1 from leads where email = 'bot@example.com'");
    expect(rows).toHaveLength(0);
  });

  test('kvalifikace zvedne skóre nad hranici', async () => {
    await post('/qualify', { token, band: 'gt10k' }).expect(200);
    await post('/qualify', { token: 'neexistujici-token', band: 'gt10k' }).expect(404);
    const { rows } = await sql.query("select stage, score from leads where email = 'anna@example.com'");
    expect(rows[0]).toMatchObject({ stage: 'qualified', score: 50 });
  });

  test('telefon: bez souhlasu a se špatným číslem neprojde', async () => {
    await post('/call', { token, phone: '777123456', consent: false, consent_id: 'call_v1' }).expect(400);
    const bad = await post('/call', { token, phone: '12', consent: true, consent_id: 'call_v1' }).expect(400);
    expect(bad.body.error).toBe('phone');
  });

  test('telefon se souhlasem → jeden webhook do CRM, opakování nevytvoří duplicitu', async () => {
    await post('/call', { token, phone: '777 123 456', consent: true, consent_id: 'call_v1' }).expect(200);
    await post('/call', { token, phone: '777 999 888', consent: true, consent_id: 'call_v1' }).expect(200);
    expect(webhooks).toHaveLength(1);
    expect(webhooks[0].lead.phone).toBe('+420777123456');
    expect(webhooks[0].idempotency_key).toBe(webhooks[0].lead.id);
    const { rows } = await sql.query("select stage, phone, call_consent_text from leads where email = 'anna@example.com'");
    expect(rows[0]).toMatchObject({ stage: 'handed_over', phone: '+420777999888' });
    expect(rows[0].call_consent_text).toMatch(/^call_v1: Souhlasím/);
  });
});

describe('odkazy z e-mailů', () => {
  // '/\t/evil.com' = útok z review (?to=/%09/evil.com) – URL parser tabulátor zahodí a vznikne //evil.com
  test.each(['//evil.com', '/\t/evil.com', '/\n/evil.com', 'https://evil.com/x'])('přesměrování %j zůstane na webu', async (to) => {
    const r = await http()
      .get(`/r?to=${encodeURIComponent(to)}`)
      .expect(302);
    expect(r.headers.location).toMatch(/^\/\?utm_source=email/);
  });

  test('klik v e-mailu přidá body a odhlášení zruší zbytek sekvence', async () => {
    const t = (await lead('ben@example.com')).body.token;
    const before = (await sql.query("select score from leads where email = 'ben@example.com'")).rows[0].score;
    const r = await http().get(`/r?t=${t}&s=d2_howto&to=/report`).expect(302);
    expect(r.headers.location).toBe('/report?utm_source=email&utm_medium=nurture');
    const after = (await sql.query("select score from leads where email = 'ben@example.com'")).rows[0].score;
    expect(after - before).toBe(10);

    await http().get(`/unsubscribe?t=${t}`).expect(302); // GET nic nemění (skenery odkazů)
    await http().post(`/unsubscribe?t=${t}`).expect(200, { ok: true });
    const { rows } = await sql.query(
      "select j.status from email_jobs j join leads l on l.id = j.lead_id where l.email = 'ben@example.com' and j.step <> 'd0_report'",
    );
    expect(rows.every((x) => x.status === 'cancelled')).toBe(true);
  });
});

describe('denní běh sekvence', () => {
  test('bez CRON_SECRET 401', async () => {
    await http().get('/cron/emails').expect(401);
  });

  test('splatný krok odejde právě jednou, i když běží dva crony naráz', async () => {
    await lead('cyril@example.com');
    await sql.query(
      "update email_jobs set send_at = now() - interval '1 minute' from leads where leads.id = email_jobs.lead_id and leads.email = 'cyril@example.com' and email_jobs.step = 'd2_howto'",
    );
    const run = () => http().get('/cron/emails').set('authorization', `Bearer ${CRON_SECRET}`).expect(200);
    await Promise.all([run(), run()]);
    expect(resendCalls.filter((c) => c.to === 'cyril@example.com' && c.subject.startsWith('Jak koupit'))).toHaveLength(1);
  });
});

describe('admin', () => {
  test('bez cookie 401, špatný token zpět na přihlášení', async () => {
    await http().get('/admin/dashboard').expect(401);
    const r = await http().post('/admin/login').set('origin', SITE).type('form').send({ token: 'spatne' }).expect(303);
    expect(r.headers.location).toBe('/admin/login?e=1');
  });

  test('přihlášení → dashboard a CSV export', async () => {
    const login = await http().post('/admin/login').set('origin', SITE).type('form').send({ token: ADMIN_TOKEN }).expect(303);
    const cookie = login.headers['set-cookie'][0].split(';')[0];
    expect(cookie).toMatch(/^etfd_admin=/);

    const d = await http().get('/admin/dashboard?d=30').set('cookie', cookie).expect(200);
    expect(d.body.stages.all.handed_over).toBe(1);
    expect(d.body.funnel.fees.lead).toBeGreaterThanOrEqual(3);
    expect(d.body.insights.length).toBeGreaterThan(0);

    const csv = await http().get('/admin/export').set('cookie', cookie).expect(200);
    expect(csv.headers['content-type']).toMatch(/text\/csv/);
    expect(csv.text).toContain('"+420777999888"');
  });
});
