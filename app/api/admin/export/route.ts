import { getDb } from '@/lib/db';
import { allLeads } from '@/lib/server/stats';

const COLS = ['created_at', 'email', 'stage', 'score', 'monthly_band', 'wants_call', 'phone', 'variant', 'source', 'utm_source', 'utm_campaign', 'utm_content', 'device', 'interest', 'calc_monthly', 'handoff_status', 'unsubscribed_at'] as const;
// Uvozovky + ochrana proti CSV injection (=, +, -, @ na začátku buňky Excel spouští jako vzorec)
const cell = (v: unknown) => {
  let s = v == null ? '' : v instanceof Date ? v.toISOString() : String(v);
  if (/^[=+\-@\t\r]/.test(s) && !/^[+-]?[\d\s]+$/.test(s)) s = `'${s}`; // čisté číslo (telefon +420…) nechat
  return `"${s.replace(/"/g, '""')}"`;
};

/** Export leadů pro CRM / call centrum (chráněno proxy.ts) */
export async function GET() {
  const rows = await allLeads(await getDb());
  const camel = (c: string) => c.replace(/_(\w)/g, (_, x) => x.toUpperCase()) as keyof (typeof rows)[number];
  const csv = [COLS.join(','), ...rows.map((r) => COLS.map((c) => cell(r[camel(c)])).join(','))].join('\n');
  return new Response(`﻿${csv}`, {
    headers: { 'content-type': 'text/csv; charset=utf-8', 'content-disposition': `attachment; filename="leady-${new Date().toISOString().slice(0, 10)}.csv"`, 'cache-control': 'no-store' },
  });
}
