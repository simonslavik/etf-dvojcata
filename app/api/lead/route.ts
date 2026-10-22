import { z } from 'zod';
import { getDb } from '@/lib/db';
import { consentRecord } from '@/lib/consent';
import { isVariant } from '@/lib/events';
import { captureLead, mask } from '@/lib/server/pipeline';
import { allowedOrigin, clientIp, clip, json, readJson } from '@/lib/server/http';
import { withinLimit } from '@/lib/server/rate';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
// Mobilní operátoři sdílejí IP (CGNAT) – limit nesmí být moc přísný
const LEADS_PER_IP_10MIN = Number(process.env.LEADS_PER_IP_10MIN) || 20;

const Body = z.object({
  email: z.string().trim().toLowerCase().max(120).regex(EMAIL),
  hp_f7: z.string().optional(),
  sid: z.string().max(64).nullish(),
  variant: z.string().nullish(),
  source: z.string().nullish(),
  utm_source: z.string().nullish(), utm_campaign: z.string().nullish(), utm_content: z.string().nullish(), device: z.string().nullish(),
  interest: z.string().nullish(),
  calc_monthly: z.number().int().nonnegative().max(1_000_000).nullish(),
  consent_id: z.string().max(20).nullish(),
});

export async function POST(req: Request) {
  if (!allowedOrigin(req)) return json(403, { error: 'origin' });
  const raw = await readJson(req).catch(() => ({}) as Record<string, unknown>);
  // Honeypot (pole s nesmyslným názvem, autofill ho nevyplní): bot dostane OK, nic se neuloží
  if (raw.hp_f7) {
    console.log(JSON.stringify({ k: 'honeypot', ip: clientIp(req) }));
    return json(200, { ok: true, emailSent: false, token: null });
  }
  const parsed = Body.safeParse(raw);
  if (!parsed.success) return json(400, { error: 'email', message: 'Zkontrolujte prosím e-mail.' });
  const b = parsed.data;

  try {
    const db = await getDb();
    if (!(await withinLimit(db, `lead:${clientIp(req)}`, LEADS_PER_IP_10MIN, 600))) {
      return json(429, { error: 'rate', message: 'Příliš mnoho pokusů. Zkuste to prosím za pár minut.' });
    }
    const variant = isVariant(b.variant) ? b.variant : 'twin';
    const res = await captureLead(db, {
      email: b.email, sid: clip(b.sid, 64), variant, source: clip(b.source, 20),
      utmSource: clip(b.utm_source, 60), utmCampaign: clip(b.utm_campaign, 60), utmContent: clip(b.utm_content, 60), device: clip(b.device, 10),
      interest: clip(b.interest, 20), calcMonthly: b.calc_monthly ?? null, consentText: b.consent_id ? consentRecord(b.consent_id) : null,
    });
    console.log(JSON.stringify({ k: 'lead', email: mask(b.email), variant, source: b.source, isNew: res.isNew, mail: res.emailSent }));
    return json(200, { ok: true, emailSent: res.emailSent, token: res.token });
  } catch (e) {
    // Lead se nesmí ztratit ani při výpadku DB – zůstane aspoň v logu (Vercel Logs)
    console.error(JSON.stringify({ k: 'lead_db_error', err: (e as Error).message, lead: { ...b, hp_f7: undefined } }));
    return json(200, { ok: true, emailSent: false, token: null });
  }
}
