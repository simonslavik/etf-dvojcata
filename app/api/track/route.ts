import { z } from 'zod';
import { getDb } from '@/lib/db';
import { EVENTS, isVariant } from '@/lib/events';
import { recordEvent } from '@/lib/server/pipeline';
import { clientIp, clip, json, readJson } from '@/lib/server/http';
import { withinLimit } from '@/lib/server/rate';

const Body = z.object({
  event: z.enum(EVENTS),
  sid: z.string().min(1).max(64),
  variant: z.string().optional(),
  utm_source: z.string().nullish(), utm_campaign: z.string().nullish(), utm_content: z.string().nullish(), device: z.string().nullish(),
  props: z.record(z.string(), z.unknown()).nullish(),
  t: z.number().nullish(),
});

/** Prohlížeč posílá text/plain (sendBeacon = „simple request“), proto parsujeme ručně */
export async function POST(req: Request) {
  const parsed = Body.safeParse(await readJson(req).catch(() => ({})));
  if (!parsed.success) return json(400, { error: 'invalid' });
  const b = parsed.data;
  try {
    const db = await getDb();
    // Ochrana proti zaplavení tabulky (a zkreslení A/B): běžná relace pošle desítky událostí, ne stovky
    if (!(await withinLimit(db, `track:${clientIp(req)}`, 600, 600))) return json(429, { error: 'rate' });
    const props = b.props && JSON.stringify(b.props).length <= 400 ? b.props : null;
    await recordEvent(db, {
      sid: b.sid, event: b.event, variant: isVariant(b.variant) ? b.variant : 'twin',
      utmSource: clip(b.utm_source, 60), utmCampaign: clip(b.utm_campaign, 60), utmContent: clip(b.utm_content, 60), device: clip(b.device, 10),
      props, tMs: b.t != null ? Math.round(b.t) : null,
    });
    return json(200, { ok: true });
  } catch (e) {
    console.error('track error', (e as Error).message);
    return json(500, { error: 'server' }); // měření nikdy nesmí rozbít stránku – klient chybu ignoruje
  }
}
