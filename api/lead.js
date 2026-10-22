import { readJson, send, clip, clientIp, allowedOrigin, siteUrl } from './_lib/http.js';
import { saveLead, updateLead, countEvent, withinLimit } from './_lib/store.js';
import { sendReport } from './_lib/email.js';
import data from '../data/etfs.json' with { type: 'json' };

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const QUALIFY = new Set(['0', 'lt2k', '2-10k', 'gt10k']);
const DAILY_EMAIL_CAP = Number(process.env.DAILY_EMAIL_CAP) || 300;
// Mobilní operátoři sdílejí IP (CGNAT) – limit nesmí být moc přísný
const LEADS_PER_IP_10MIN = Number(process.env.LEADS_PER_IP_10MIN) || 20;
const mask = (e) => e.replace(/^(.).*(@.*)$/, '$1***$2');

export default async function handler(req, res) {
  if (req.method !== 'POST') return send(res, 405, { error: 'method' });
  if (!allowedOrigin(req)) return send(res, 403, { error: 'origin' });
  try {
    const b = await readJson(req);
    const email = clip(String(b.email || '').trim().toLowerCase(), 120);

    // Druhý krok po odeslání: kvalifikační otázka (nepovinná)
    if (b.action === 'qualify') {
      if (!EMAIL.test(email) || !QUALIFY.has(b.monthly)) return send(res, 400, { error: 'invalid' });
      return send(res, 200, { ok: await updateLead(email, { monthly: b.monthly }) });
    }

    // Honeypot (pole s nesmyslným názvem, autofill ho nevyplní): bot dostane OK, nic se neuloží
    if (b.hp_f7) {
      console.log(JSON.stringify({ k: 'honeypot', ip: clientIp(req) }));
      return send(res, 200, { ok: true });
    }
    if (!EMAIL.test(email)) return send(res, 400, { error: 'email', message: 'Zkontrolujte prosím e-mail.' });
    if (!(await withinLimit(`lead:${clientIp(req)}`, LEADS_PER_IP_10MIN, 600))) {
      return send(res, 429, { error: 'rate', message: 'Příliš mnoho pokusů. Zkuste to prosím za pár minut.' });
    }

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

    // E-mail jen novým leadům a s denním stropem (ochrana reputace odesílací domény)
    const day = new Date().toISOString().slice(0, 10);
    const mail = !isNew
      ? { sent: false, reason: 'duplicate' }
      : !(await withinLimit(`mail:${day}`, DAILY_EMAIL_CAP, 86400))
        ? { sent: false, reason: 'daily_cap' }
        : await sendReport(email, { origin: siteUrl(req), pairs: data.pairs, asOf: data.as_of }).catch((e) => ({ sent: false, reason: e.message }));
    console.log(JSON.stringify({ k: 'lead', email: mask(email), variant, source: lead.source, isNew, mail: mail.sent, mailReason: mail.reason }));
    return send(res, 200, { ok: true, emailSent: mail.sent });
  } catch (e) {
    const status = e.status || e.statusCode || 500;
    if (status >= 500) console.error('lead error', e.message);
    return send(res, status, { error: status === 400 ? 'invalid' : 'server', message: 'Něco se pokazilo. Zkuste to prosím znovu.' });
  }
}
