import { z } from 'zod';
import { getDb } from '@/lib/db';
import { normalizePhone } from '@/lib/phone';
import { requestCall } from '@/lib/server/pipeline';
import { allowedOrigin, clientIp, json, readJson } from '@/lib/server/http';
import { withinLimit } from '@/lib/server/rate';

const Body = z.object({ token: z.string().min(10).max(64), phone: z.string().max(30), consent: z.literal(true), consent_text: z.string().max(300) });

export async function POST(req: Request) {
  if (!allowedOrigin(req)) return json(403, { error: 'origin' });
  const parsed = Body.safeParse(await readJson(req).catch(() => ({})));
  if (!parsed.success) return json(400, { error: 'invalid', message: 'Potvrďte prosím souhlas s kontaktováním.' });
  const phone = normalizePhone(parsed.data.phone);
  if (!phone) return json(400, { error: 'phone', message: 'Zkontrolujte prosím číslo – 9 číslic, např. 777 123 456.' });
  const db = await getDb();
  if (!(await withinLimit(db, `call:${clientIp(req)}`, 10, 600))) return json(429, { error: 'rate', message: 'Příliš mnoho pokusů. Zkuste to za pár minut.' });
  const lead = await requestCall(db, parsed.data.token, phone, parsed.data.consent_text);
  if (!lead) return json(404, { error: 'lead', message: 'Odkaz už neplatí. Zkuste prosím formulář na hlavní stránce.' });
  return json(200, { ok: true });
}
