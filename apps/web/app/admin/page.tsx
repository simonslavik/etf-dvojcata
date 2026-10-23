import Link from 'next/link';
import type { Metadata } from 'next';
import {
  ADMIN_PERIODS,
  DEFAULT_PERIOD,
  FUNNEL,
  fmtDate,
  isMonthlyBand,
  MONTHLY_BANDS,
  SEQUENCE,
  VARIANT_LABEL,
  VARIANTS,
} from '@etfd/shared';
import { apiGet, type DashboardDto } from '@/lib/api';
import { Columns, HBars, Kpi, Legend, Panel, SERIES, StageChip, kc, pct } from '@/components/admin/ui';
import { ArrowRight } from '@/components/ui/icons';
import { Logo } from '@/components/ui/Logo';

export const metadata: Metadata = { title: 'Pipeline – ETF dvojčata', robots: { index: false } };
export const dynamic = 'force-dynamic';

export default async function AdminPage({ searchParams }: { searchParams: Promise<{ d?: string }> }) {
  const requested = Number((await searchParams).d);
  const {
    days,
    funnel: f,
    stages,
    campaigns: camps,
    daily,
    sequence: seq,
    latest,
    insights: notes,
    emailEnabled,
  } = await apiGet<DashboardDto>(
    `/admin/dashboard?d=${(ADMIN_PERIODS as readonly number[]).includes(requested) ? requested : DEFAULT_PERIOD}`,
  );

  const leadsN = Object.values(stages.all).reduce((a, b) => a + b, 0);
  const qualifiedN = stages.all.qualified + stages.all.handed_over;
  const spend = camps.reduce((a, c) => a + (c.spend ?? 0), 0);
  const spendLeads = camps.filter((c) => c.spend != null).reduce((a, c) => a + c.leads, 0);
  const sent = seq.rows.filter((r) => r.status === 'sent').reduce((a, r) => a + r.n, 0);

  const pipeline = [
    { label: 'Reklama', value: spend ? kc(spend) : '–' },
    { label: 'Návštěva', value: String(f.all.visit) },
    { label: 'Lead', value: String(leadsN) },
    { label: 'Kvalifikace', value: String(qualifiedN) },
    { label: 'Předání', value: String(stages.all.handed_over) },
    { label: 'Péče', value: `${sent} e-mailů` },
  ];

  return (
    <div className="min-h-dvh bg-paper">
      <header className="border-b border-line bg-white">
        <div className="wrap flex h-16 items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Logo />
            <span className="rounded-full bg-teal-800 px-2.5 py-0.5 text-[12px] font-semibold text-white">Admin</span>
          </div>
          <div className="flex items-center gap-2 text-[14px]">
            <nav className="flex rounded-xl border border-line p-0.5" aria-label="Období">
              {ADMIN_PERIODS.map((p) => (
                <Link
                  key={p}
                  href={`/admin?d=${p}`}
                  aria-current={p === days ? 'page' : undefined}
                  className="rounded-lg px-3 py-1.5 text-muted aria-[current=page]:bg-teal-800 aria-[current=page]:text-white"
                >
                  {p} dní
                </Link>
              ))}
            </nav>
            <a href="/api/admin/export" className="btn btn-ghost !min-h-10 !px-3.5 !text-[14px]">
              CSV
            </a>
            <form action="/api/admin/logout" method="post">
              <button className="btn btn-ghost !min-h-10 !px-3.5 !text-[14px]">Odhlásit</button>
            </form>
          </div>
        </div>
      </header>

      <main className="wrap space-y-5 py-6 sm:py-8">
        {!emailEnabled && (
          <p className="rounded-xl border border-brick-100 bg-brick-50 px-4 py-3 text-[14px] text-brick-700">
            E-maily jsou vypnuté (chybí <code>RESEND_API_KEY</code> / <code>RESEND_FROM</code>) – kroky sekvence se označují jako
            přeskočené.
          </p>
        )}

        {/* Okno „dashboard klienta“ */}
        <div className="window !shadow-card">
          <div className="window-bar">
            <span className="window-dots" aria-hidden="true">
              <i />
              <i />
              <i />
            </span>
            <span className="window-url">etf-dvojcata · pipeline za {days} dní</span>
          </div>
          <div className="space-y-5 p-4 sm:p-6">
            <ol className="flex flex-wrap items-center gap-2 text-[13.5px]" aria-label="Pipeline">
              {pipeline.map((s, i) => (
                <li key={s.label} className="flex items-center gap-2">
                  <span
                    className={`rounded-full border px-3.5 py-1.5 ${i === pipeline.length - 1 ? 'border-teal-800 bg-teal-800 text-white' : 'border-line bg-white text-ink'}`}
                  >
                    {s.label} <b className="num ml-1">{s.value}</b>
                  </span>
                  {i < pipeline.length - 1 && <ArrowRight className="h-4 w-4 text-teal-200" />}
                </li>
              ))}
            </ol>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Kpi label="Leady" value={String(leadsN)} sub={`${pct(f.all.lead, f.all.visit)} z návštěv`} tone="up" />
              <Kpi
                label="Náklad na lead"
                value={spend && spendLeads ? kc(spend / spendLeads) : '–'}
                sub={spend ? `útrata ${kc(spend)}` : 'zadejte útratu u kampaní'}
              />
              <Kpi label="Kvalifikovaní (vážný zájem)" value={String(qualifiedN)} sub={`${pct(qualifiedN, leadsN)} leadů`} />
              <Kpi label="Předaní k hovoru" value={String(stages.all.handed_over)} sub={`${pct(stages.all.handed_over, leadsN)} leadů`} />
            </div>

            <div className="grid gap-5 lg:grid-cols-[1.25fr_1fr]">
              <Panel title="Trychtýř návštěvníka">
                <HBars
                  rows={FUNNEL.map((s, i) => ({
                    label: s.label,
                    value: f.all[s.key],
                    hint: i ? pct(f.all[s.key], f.all.visit) : undefined,
                    accent: s.key === 'lead',
                  }))}
                />
              </Panel>
              <Panel title="Leady za 14 dní">
                <Columns
                  data={daily.map((d) => ({
                    label: fmtDate(d.day).replace(/ \d{4}$/, ''),
                    value: d.n,
                    title: `${fmtDate(d.day)}: ${d.n} leadů`,
                  }))}
                />
                <p className="mt-4 text-[13px] text-muted">
                  Celkem {daily.reduce((a, d) => a + d.n, 0)} leadů, nejvíc {Math.max(...daily.map((d) => d.n))} za den.
                </p>
              </Panel>
            </div>

            {notes.map((n) => (
              <p key={n} className="flex items-start gap-2.5 rounded-xl bg-brick-50 px-3.5 py-3 text-[14px] leading-snug text-brick-700">
                <span className="mt-px flex-none rounded-md border border-brick-100 bg-white px-1.5 py-0.5 text-[10px] font-bold tracking-wider text-brick">
                  POSTŘEH
                </span>
                {n}
              </p>
            ))}
          </div>
        </div>

        {/* A/B */}
        <Panel title="Varianty reklamy A/B" action={<Legend />}>
          <div className="overflow-x-auto">
            <table className="num w-full min-w-[560px] text-[14px]">
              <thead>
                <tr className="text-left text-[12px] text-muted">
                  <th className="py-2 font-medium">Krok</th>
                  {VARIANTS.map((v) => (
                    <th key={v} className="py-2 font-medium">
                      {VARIANT_LABEL[v]}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {FUNNEL.map((s) => (
                  <tr key={s.key} className="border-t border-line">
                    <td className="py-2.5 text-text">{s.label}</td>
                    {VARIANTS.map((v) => (
                      <td key={v} className="py-2.5">
                        <span className="flex items-center gap-2">
                          <span
                            className="h-2.5 rounded-r-[4px]"
                            style={{
                              background: SERIES[v],
                              width: `${f[v].visit ? Math.max((f[v][s.key] / f[v].visit) * 120, f[v][s.key] ? 2 : 0) : 0}px`,
                            }}
                          />
                          <b className="text-ink">{f[v][s.key]}</b>
                          <span className="text-[12px] text-muted">{s.key === 'visit' ? '' : pct(f[v][s.key], f[v].visit)}</span>
                        </span>
                      </td>
                    ))}
                  </tr>
                ))}
                <tr className="border-t border-line">
                  <td className="py-2.5 text-text">Kvalifikovaní z leadů</td>
                  {VARIANTS.map((v) => {
                    const n = Object.values(stages[v]).reduce((a, b) => a + b, 0);
                    return (
                      <td key={v} className="py-2.5">
                        <b className="text-ink">{stages[v].qualified + stages[v].handed_over}</b>{' '}
                        <span className="text-[12px] text-muted">{pct(stages[v].qualified + stages[v].handed_over, n)}</span>
                      </td>
                    );
                  })}
                </tr>
              </tbody>
            </table>
          </div>
        </Panel>

        <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
          {/* Kampaně + útrata → CPL */}
          <Panel title="Kampaně (utm_content) a náklad na lead">
            <div className="overflow-x-auto">
              <table className="num w-full min-w-[620px] text-[14px]">
                <thead>
                  <tr className="text-left text-[12px] text-muted">
                    <th className="py-2 font-medium">Kreativa</th>
                    <th className="font-medium">Návštěvy</th>
                    <th className="font-medium">Leady</th>
                    <th className="font-medium">Konverze</th>
                    <th className="font-medium">Kvalif.</th>
                    <th className="font-medium">CPL</th>
                    <th className="font-medium">Útrata (Kč)</th>
                  </tr>
                </thead>
                <tbody>
                  {camps.map((c) => (
                    <tr key={c.key} className="border-t border-line">
                      <td className="py-2.5 font-mono text-[13px] text-ink">{c.key}</td>
                      <td>{c.visits}</td>
                      <td>
                        <b className="text-ink">{c.leads}</b>
                      </td>
                      <td>{c.conv == null ? '–' : pct(c.leads, c.visits)}</td>
                      <td>{c.qualified}</td>
                      <td>{kc(c.cpl)}</td>
                      <td>
                        <form action="/api/admin/spend" method="post" className="flex gap-1.5">
                          <input type="hidden" name="key" value={c.key} />
                          <input
                            name="czk"
                            inputMode="numeric"
                            defaultValue={c.spend ?? ''}
                            aria-label={`Útrata ${c.key}`}
                            className="input !min-h-9 w-24 !rounded-lg !px-2 !text-[13px]"
                          />
                          <button className="rounded-lg border border-line px-2 text-[12px] text-muted hover:border-teal-500">
                            Uložit
                          </button>
                        </form>
                      </td>
                    </tr>
                  ))}
                  {!camps.length && (
                    <tr>
                      <td colSpan={7} className="py-4 text-muted">
                        Zatím žádná data.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Panel>

          {/* E-mailová péče */}
          <Panel
            title="Péče: e-mailová sekvence"
            action={
              <form action="/api/admin/sequence/run" method="post">
                <button className="text-[13px] font-medium text-teal-700 hover:underline">Odeslat splatné teď</button>
              </form>
            }
          >
            <ul className="space-y-3 text-[14px]">
              {SEQUENCE.map((s) => {
                const by = (st: string) => seq.rows.find((r) => r.step === s.step && r.status === st)?.n ?? 0;
                return (
                  <li key={s.step} className="rounded-xl border border-line p-3">
                    <div className="flex items-baseline justify-between gap-2">
                      <Link href={`/admin/email/${s.step}`} className="font-medium text-ink hover:underline">
                        Den {s.day}: {s.subject}
                      </Link>
                    </div>
                    <p className="num mt-1 text-[12.5px] text-muted">
                      odesláno <b className="text-ink">{by('sent')}</b> · čeká {by('scheduled')} · přeskočeno {by('skipped')} · chyba{' '}
                      {by('failed')} · zrušeno {by('cancelled')} · kliky <b className="text-ink">{seq.clicks[s.step] ?? 0}</b>
                    </p>
                  </li>
                );
              })}
            </ul>
          </Panel>
        </div>

        {/* Leady */}
        <Panel title={`Poslední leady (${latest.length})`}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-[14px]">
              <thead>
                <tr className="text-left text-[12px] text-muted">
                  <th className="py-2 font-medium">Kdy</th>
                  <th className="font-medium">E-mail</th>
                  <th className="font-medium">Fáze</th>
                  <th className="font-medium">Skóre</th>
                  <th className="font-medium">Investuje</th>
                  <th className="font-medium">Zdroj</th>
                  <th className="font-medium">Zájem</th>
                  <th className="font-medium">Předání</th>
                </tr>
              </thead>
              <tbody>
                {latest.map((l) => (
                  <tr key={l.id} className="border-t border-line hover:bg-paper">
                    <td className="num py-2.5 text-muted">
                      {new Date(l.createdAt).toLocaleString('cs-CZ', {
                        day: 'numeric',
                        month: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td>
                      <Link href={`/admin/lead/${l.id}`} className="font-medium text-ink hover:underline">
                        {l.email}
                      </Link>
                      {l.phone && <span className="ml-1.5 text-[12px] text-muted">☎</span>}
                    </td>
                    <td>
                      <StageChip stage={l.stage} />
                    </td>
                    <td className="num font-semibold text-ink">{l.score}</td>
                    <td className="text-muted">{isMonthlyBand(l.monthlyBand) ? MONTHLY_BANDS[l.monthlyBand].label : '–'}</td>
                    <td className="text-muted">
                      <span className="mr-1 inline-block h-2 w-2 rounded-full" style={{ background: SERIES[l.variant] }} />
                      {VARIANT_LABEL[l.variant].slice(0, 1)} · {l.utmSource ?? '–'}
                    </td>
                    <td className="font-mono text-[13px] text-muted">{l.interest ?? '–'}</td>
                    <td className="text-[12.5px] text-muted">{l.handoffStatus ?? '–'}</td>
                  </tr>
                ))}
                {!latest.length && (
                  <tr>
                    <td colSpan={8} className="py-4 text-muted">
                      Zatím žádné leady.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Panel>
      </main>
    </div>
  );
}
