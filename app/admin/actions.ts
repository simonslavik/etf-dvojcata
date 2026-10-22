'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { eq } from 'drizzle-orm';
import { getDb } from '@/lib/db';
import { adSpend, leads } from '@/lib/db/schema';
import { ADMIN_COOKIE, adminCookieValue, isAdmin } from '@/lib/server/auth';
import { handoff, runDueEmails } from '@/lib/server/pipeline';

/** Server actions kontrolují přístup samy – proxy.ts je jen první vrstva */
async function guard() {
  if (!(await isAdmin((await cookies()).get(ADMIN_COOKIE)?.value))) throw new Error('unauthorized');
}

export async function login(_: unknown, form: FormData) {
  const token = process.env.ADMIN_TOKEN;
  if (!token || form.get('token') !== token) return { error: 'Neplatný token.' };
  (await cookies()).set(ADMIN_COOKIE, await adminCookieValue(token), { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: 60 * 60 * 24 * 14 });
  redirect('/admin');
}

export async function logout() {
  (await cookies()).delete(ADMIN_COOKIE);
  redirect('/admin/login');
}

export async function saveSpend(form: FormData) {
  await guard();
  const key = String(form.get('key') || '').slice(0, 60);
  const czk = Math.round(Number(String(form.get('czk')).replace(/\s/g, '').replace(',', '.')));
  if (!key || !Number.isFinite(czk) || czk < 0) return;
  const db = await getDb();
  await db.insert(adSpend).values({ utmContent: key, czk }).onConflictDoUpdate({ target: adSpend.utmContent, set: { czk, updatedAt: new Date() } });
  revalidatePath('/admin');
}

export async function manualHandoff(id: string) {
  await guard();
  const db = await getDb();
  const [lead] = await db.select().from(leads).where(eq(leads.id, id));
  if (lead) await handoff(db, lead, { manual: true });
  revalidatePath(`/admin/lead/${id}`);
}

export async function runSequenceNow() {
  await guard();
  await runDueEmails(await getDb());
  revalidatePath('/admin');
}
