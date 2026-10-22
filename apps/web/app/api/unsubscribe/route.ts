import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { unsubscribe } from '@/lib/server/pipeline';
import { json } from '@/lib/server/http';

/** One-click odhlášení z hlavičky List-Unsubscribe (RFC 8058) – poštovní klient pošle POST */
export async function POST(req: Request) {
  const token = new URL(req.url).searchParams.get('t');
  if (!token) return json(400, { error: 'token' });
  return json(200, { ok: await unsubscribe(await getDb(), token) });
}

/** GET (otevření odkazu v prohlížeči) nic nemění – skenery odkazů by jinak odhlašovaly samy */
export function GET(req: Request) {
  const url = new URL(req.url);
  return NextResponse.redirect(new URL(`/unsubscribe?t=${encodeURIComponent(url.searchParams.get('t') || '')}`, url.origin), 302);
}
