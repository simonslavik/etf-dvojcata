/* Stavební kameny adminu – vizuálně podle ukázky „dashboard klienta“ na clientelo.cz */
import type { ReactNode } from 'react';
import Link from 'next/link';
import { formatInt, formatKcExact, formatShare, STAGE_LABEL, VARIANT_LABEL, VARIANTS, type Stage } from '@etfd/shared';
import { ArrowRight } from '@/components/ui/icons';
import { Logo } from '@/components/ui/Logo';

/** Barvy variant A/B – ověřené validátorem (CVD ΔE 15,6, kontrast ≥ 3:1); text nikdy nenese barvu série */
export const SERIES = { twin: '#2a7fa8', fees: '#c2553f' } as const;

/** Podíl a/b pro dashboard („–“, když základ je nula) */
export const pct = (a: number, b: number) => (b ? formatShare(a / b) : '–');
export const kc = (n: number | null) => (n == null ? '–' : formatKcExact(n));

export const fmtDateTime = (d: string | Date, seconds = false) =>
  new Date(d).toLocaleString('cs-CZ', {
    day: 'numeric',
    month: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    ...(seconds ? { second: '2-digit' } : {}),
    timeZone: 'Europe/Prague',
  });

/** Leady z E2E testů a ukázkových dat (…@example.com) – v tabulkách je označíme, ať nepletou */
export const isTestEmail = (email: string) => /@example\.(com|cz)$/i.test(email);

/** Stav předání do CRM lidsky (v DB je kód kvůli filtrování a opakování) */
export function handoffLabel(status: string | null) {
  if (!status) return { text: '–', tone: 'muted' as const };
  if (status === 'sent') return { text: 'Předáno do CRM', tone: 'ok' as const };
  if (status === 'manual') return { text: 'Předáno ručně', tone: 'ok' as const };
  if (status === 'pending_no_webhook') return { text: 'Čeká – CRM nepřipojené', tone: 'wait' as const };
  if (status.startsWith('failed_')) return { text: `Chyba (${status.slice(7)}), zkusí se znovu`, tone: 'bad' as const };
  return { text: status, tone: 'muted' as const };
}

export const JOB_LABEL: Record<string, string> = {
  scheduled: 'čeká',
  sending: 'odesílá se',
  sent: 'odesláno',
  failed: 'chyba',
  skipped: 'přeskočeno',
  cancelled: 'zrušeno',
};

/** Společná hlavička adminu: logo, volitelně zpět a akce vpravo (na mobilu se zalomí pod logo) */
export function AdminHeader({ back, children }: { back?: boolean; children?: ReactNode }) {
  return (
    <header className="border-b border-line bg-white">
      <div className="wrap flex flex-wrap items-center justify-between gap-x-4 gap-y-2 py-3">
        <div className="flex items-center gap-3">
          <Logo />
          <span className="rounded-full bg-teal-800 px-2.5 py-0.5 text-[12px] font-semibold text-white">Admin</span>
          {back && (
            <Link href="/admin" className="ml-1 text-[14px] font-medium text-teal-700 hover:underline">
              ← Pipeline
            </Link>
          )}
        </div>
        {children && <div className="flex flex-wrap items-center gap-2 text-[14px]">{children}</div>}
      </div>
    </header>
  );
}

/** Krok pipeline: hodnota + konverze z předchozího kroku; šipka k dalšímu kroku jen na širokém displeji */
export function StageCard({
  step,
  label,
  value,
  sub,
  last = false,
  highlight = false,
}: {
  step?: number;
  label: string;
  value: string;
  sub: string;
  last?: boolean;
  highlight?: boolean;
}) {
  return (
    <li
      className={`relative rounded-2xl border p-4 sm:p-5 ${last ? 'col-span-2 lg:col-span-1' : ''} ${highlight ? 'border-teal-800 bg-teal-800 text-white' : 'border-line bg-white'}`}
    >
      <p className={`flex items-center gap-2 text-[13px] ${highlight ? 'text-teal-100' : 'text-muted'}`}>
        {step != null && (
          <span
            className={`grid h-5 w-5 place-items-center rounded-full text-[11px] font-bold ${highlight ? 'bg-white/15 text-white' : 'bg-teal-50 text-teal-700'}`}
          >
            {step}
          </span>
        )}
        {label}
      </p>
      <p className={`num mt-2 text-[28px] leading-none font-bold sm:text-[32px] ${highlight ? 'text-white' : 'text-ink'}`}>{value}</p>
      <p className={`mt-2 text-[12.5px] leading-snug ${highlight ? 'text-teal-100' : 'text-muted'}`}>{sub}</p>
      {!last && (
        <ArrowRight className="absolute top-1/2 -right-[15px] z-10 hidden h-4 w-4 -translate-y-1/2 rounded-full bg-paper text-teal-300 lg:block" />
      )}
    </li>
  );
}

export function Panel({
  title,
  children,
  action,
  className = '',
}: {
  title: string;
  children: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <section className={`rounded-2xl border border-line bg-white p-5 ${className}`}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-[11.5px] font-semibold tracking-[0.18em] text-muted uppercase">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

const STAGE_STYLE: Record<Stage, string> = {
  lead: 'bg-paper text-muted border-line',
  qualified: 'bg-teal-50 text-teal-700 border-teal-200',
  handed_over: 'bg-teal-800 text-white border-teal-800',
  unsubscribed: 'bg-white text-muted/70 border-line line-through',
};
export const StageChip = ({ stage }: { stage: string }) => (
  <span
    className={`inline-block rounded-full border px-2.5 py-0.5 text-[12px] font-medium whitespace-nowrap ${STAGE_STYLE[stage as Stage] ?? STAGE_STYLE.lead}`}
  >
    {STAGE_LABEL[stage as Stage] ?? stage}
  </span>
);

/** Vodorovné pruhy jedné série (trychtýř). Hodnota na konci pruhu, hover přes title. */
export function HBars({ rows }: { rows: { label: string; value: number; hint?: string; accent?: boolean }[] }) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <ul className="space-y-3">
      {rows.map((r) => (
        <li
          key={r.label}
          className="grid grid-cols-[minmax(110px,38%)_1fr_auto] items-center gap-3 text-[13.5px]"
          title={`${r.label}: ${formatInt(r.value)}${r.hint ? ` (${r.hint})` : ''}`}
        >
          <span className="leading-tight text-text">{r.label}</span>
          <span className="h-5">
            <span
              className={`block h-full rounded-r-[4px] ${r.accent ? 'bg-brick' : 'bg-teal-700'}`}
              style={{ width: `${Math.max((r.value / max) * 100, r.value ? 1.5 : 0)}%` }}
            />
          </span>
          <span className="num w-[86px] text-right">
            <b className="text-ink">{formatInt(r.value)}</b>
            {r.hint && <span className="ml-1 text-[11.5px] text-muted">{r.hint}</span>}
          </span>
        </li>
      ))}
    </ul>
  );
}

/** Svislé sloupce jedné série (leady za den): maximum na ose, hodnota v title */
export function Columns({ data }: { data: { label: string; value: number; title: string }[] }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <div>
      <div className="relative flex h-32 items-end gap-[3px] border-b border-line">
        <span className="num absolute -top-1 right-0 text-[11px] text-muted">{max}</span>
        <span className="absolute inset-x-0 top-0 border-t border-dashed border-line" aria-hidden="true" />
        {data.map((d) => (
          <div key={d.label} className="group relative flex h-full flex-1 items-end justify-center" title={d.title}>
            <span
              className="block w-full max-w-7 rounded-t-[4px] bg-teal-700 transition-colors group-hover:bg-teal-500"
              style={{ height: `${(d.value / max) * 100}%`, minHeight: d.value ? 3 : 0 }}
            />
          </div>
        ))}
      </div>
      <div className="mt-1.5 flex justify-between text-[11px] text-muted">
        <span>{data[0]?.label}</span>
        <span>{data.at(-1)?.label}</span>
      </div>
    </div>
  );
}

export function Legend() {
  return (
    <span className="flex gap-4 text-[12.5px] text-muted">
      {VARIANTS.map((v) => (
        <span key={v} className="flex items-center gap-1.5">
          <i className="h-2.5 w-2.5 rounded-[3px]" style={{ background: SERIES[v] }} />
          {VARIANT_LABEL[v]}
        </span>
      ))}
    </span>
  );
}
