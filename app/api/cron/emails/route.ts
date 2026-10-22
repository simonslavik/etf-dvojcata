import { getDb } from '@/lib/db';
import { runDueEmails } from '@/lib/server/pipeline';
import { json } from '@/lib/server/http';

/** Vercel Cron (vercel.json, denně) posílá Authorization: Bearer $CRON_SECRET */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret && process.env.VERCEL_ENV === 'production') return json(401, { error: 'CRON_SECRET není nastavený' });
  if (secret && req.headers.get('authorization') !== `Bearer ${secret}`) return json(401, { error: 'unauthorized' });
  const res = await runDueEmails(await getDb());
  console.log(JSON.stringify({ k: 'cron_emails', ...res }));
  return json(200, res);
}
