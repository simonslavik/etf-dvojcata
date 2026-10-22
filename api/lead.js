import { readJson, send, clip } from './_lib/http.js';
import { saveLead, updateLead, countEvent } from './_lib/store.js';
import { sendReport } from './_lib/email.js';
import data from '../data/etfs.json' with { type: 'json' };

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const QUALIFY = new Set(['0', 'lt2k', '2-10k', 'gt10k']);
const mask = (e) => e.replace(/^(.).*(@.*)$/, '$1***$2');

export default async function handler(req, res) {
  if (req.method !== 'POST') return send(res, 405, { error: 'method' });
  try {
    const b = await readJson(req);

    // Druhý krok po odeslání: kvalifikační otázka (nepovinná)
    if (b.action === 'qualify') {
      const email = clip(String(b.email || '').trim().toLowerCase(), 120);
      if (!EMAIL.test(email) || !QUALIFY.has(b.monthly)) return send(res, 400, { error: 'invalid' });
      await updateLead(email, { monthly: b.monthly });
      return send(res, 200, { ok: true });
    }

    // Honeypot: boti vyplní skryté pole – tváříme se, že je vše OK
    if (b.company) return send(res, 200, { ok: true });

    const email = clip(String(b.email || '').trim().toLowerCase(), 120);
    if (!EMAIL.test(email)) return send(res, 400, { error: 'email', message: 'Zkontrolujte prosím e-mail.' });

    const variant = b.variant === 'fees' ? 'fees' : 'twin';
    const lead = {
      email,
      created: new Date().toISOString(),
      variant,
      source: clip(b.source, 20),
      utm_source: clip(b.utm_source, 60),
      utm_campaign: clip(b.utm_campaign, 60),
      utm_content: clip(b.utm_content, 60),
      device: clip(b.device, 10),
      interest: clip(b.interest, 20), // ticker, na který klikl
      calc_monthly: Number(b.calc_monthly) || null,
      consent_text: clip(b.consent_text, 200),
    };
    const { isNew } = await saveLead(lead);
    await countEvent(variant, 'lead_ok', clip(b.sid, 64) || email);

    const origin = `https://${req.headers['x-forwarded-host'] || req.headers.host}`;
    const mail = isNew ? await sendReport(email, { origin, pairs: data.pairs, asOf: data.as_of }).catch((e) => ({ sent: false, reason: e.message })) : { sent: false, reason: 'duplicate' };
    console.log(JSON.stringify({ k: 'lead', email: mask(email), variant, source: lead.source, isNew, mail: mail.sent, mailReason: mail.reason }));
    return send(res, 200, { ok: true, emailSent: mail.sent });
  } catch (e) {
    console.error('lead error', e.message);
    return send(res, e.status || 500, { error: 'server', message: 'Něco se pokazilo. Zkuste to prosím znovu.' });
  }
}
