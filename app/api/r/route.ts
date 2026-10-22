import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { recordEmailClick } from '@/lib/server/pipeline';

/** Klik z e-mailu: zapíše email_click (skóre) a přesměruje. Jen na cestu v rámci webu – žádný open redirect. */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const to = url.searchParams.get('to') || '/';
  const safe = to.startsWith('/') && !to.startsWith('//') && !to.startsWith('/\\') ? to : '/';
  const token = url.searchParams.get('t');
  if (token) {
    try { await recordEmailClick(await getDb(), token, url.searchParams.get('s') || 'email'); } catch (e) { console.error('click', (e as Error).message); }
  }
  const dest = new URL(safe, url.origin);
  dest.searchParams.set('utm_source', 'email');
  dest.searchParams.set('utm_medium', 'nurture');
  return NextResponse.redirect(dest, 302);
}
