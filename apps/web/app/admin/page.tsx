import Link from 'next/link';
import type { Metadata } from 'next';
import {
  ADMIN_PERIODS,
  DEFAULT_PERIOD,
  FUNNEL,
  fmtDate,
  isMonthlyBand,
  MONTHLY_BANDS,
  NO_UTM,
  QUALIFIED_AT,
  SEQUENCE,
  VARIANT_LABEL,
  VARIANTS,
} from '@etfd/shared';
import { apiGet, type DashboardDto } from '@/lib/api';
import {
  AdminHeader,
  Columns,
  fmtDateTime,
  handoffLabel,
  HBars,
  isTestEmail,
  kc,
  Legend,
  Panel,
  pct,
  SERIES,
  StageCard,
  StageChip,
} from '@/components/admin/ui';
import { ArrowRight, Check, Download, Phone } from '@/components/ui/icons';

export const metadata: Metadata = { title: 'Pipeline – ETF dvojčata', robots: { index: false } };
export const dynamic = 'force-dynamic';

const TONE = { ok: 'text-ok', wait: 'text-teal-700', bad: 'text-brick', muted: 'text-muted' } as const;

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
  const handedN = stages.all.handed_over;
  const spend = camps.reduce((a, c) => a + (c.spend ?? 0), 0);
  const spendLeads = camps.filter((c) => c.spend != null).reduce((a, c) => a + c.leads, 0);
  const sent = seq.rows.filter((r) => r.status === 'sent').reduce((a, r) => a + r.n, 0);
  const dailyTotal = daily.reduce((a, d) => a + d.n, 0);

  return (
    <div className="min-h-dvh bg-paper">
      <AdminHeader>
        <nav className="flex rounded-xl border border-line bg-white p-0.5" aria-label="Období">
          {ADMIN_PERIODS.map((p) => (
            <Link
              key={p}
              href={`/admin?d=${p}`}
              aria-current={p === days ? 'page' : undefined}
              className="rounded-lg px-2.5 py-1.5 text-muted hover:text-ink aria-[current=page]:bg-teal-800 aria-[current=page]:text-white sm:px-3"
            >
              {p} dní
            </Link>
          ))}
        </nav>
        <a href="/api/admin/export" className="btn btn-ghost !min-h-10 gap-1.5 !px-3 !text-[14px]" title="Všechny leady do CSV (Excel)">
          <Download className="h-4 w-4" />
          <span className="sr-only sm:not-sr-only">CSV</span>
        </a>
        <form action="/api/admin/logout" method="post">
          <button className="btn btn-ghost !min-h-10 !px-3 !text-[14px]">Odhlásit</button>
        </form>
      </AdminHeader>

      <main className="wrap space-y-5 py-6 sm:py-8">
        <div>
          <h1 className="font-display text-[26px] leading-tight font-bold text-ink sm:text-[30px]">Pipeline za posledních {days} dní</h1>
          <p className="mt-1 text-[14px] text-muted">
            Od kliknutí na reklamu po předání k hovoru. Návštěvy a kroky trychtýře se počítají jako unikátní relace.
          </p>
        </div>

        {/* Pipeline: každý krok s konverzí z předchozího */}
        <ol className="grid grid-cols-2 gap-3 lg:grid-cols-5" aria-label="Pipeline">
          <StageCard step={1} label="Návštěvy" value={String(f.all.visit)} sub="z reklamy i přímo" />
          <StageCard step={2} label="Leady" value={String(leadsN)} sub={`${pct(f.all.lead, f.all.visit)} z návštěv`} />
          <StageCard
            step={3}
            label="Kvalifikovaní"
            value={String(qualifiedN)}
            sub={`${pct(qualifiedN, leadsN)} leadů má skóre ${QUALIFIED_AT}+`}
          />
          <StageCard step={4} label="Předaní k hovoru" value={String(handedN)} sub={`${pct(handedN, qualifiedN)} kvalifikovaných`} />
          <StageCard
            last
            highlight
            label="Náklad na lead"
            value={spend && spendLeads ? kc(spend / spendLeads) : '–'}
            sub={spend ? `útrata ${kc(spend)} za ${spendLeads} leadů` : 'doplňte útratu u kampaní níže'}
          />
        </ol>

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
          <div className="space-y-5">
            <Panel title="Leady za 14 dní" action={<span className="num text-[13px] text-muted">celkem {dailyTotal}</span>}>
              <Columns
                data={daily.map((d) => ({
                  label: fmtDate(d.day).replace(/ \d{4}$/, ''),
                  value: d.n,
                  title: `${fmtDate(d.day)}: ${d.n} leadů`,
                }))}
              />
            </Panel>
            <Panel title="Postřehy">
              <ul className="space-y-2.5">
                {notes.map((n) => (
                  <li key={n} className="flex items-start gap-2.5 text-[14px] leading-snug text-text">
                    <span className="mt-0.5 grid h-5 w-5 flex-none place-items-center rounded-full bg-teal-50 text-teal-700">
                      <ArrowRight className="h-3 w-3" />
                    </span>
                    {n}
                  </li>
                ))}
              </ul>
            </Panel>
          </div>
        </div>

        {/* A/B */}
        <Panel title="Varianty reklamy A/B" action={<Legend />}>
          <div className="-mx-5 overflow-x-auto px-5">
            <table className="num w-full min-w-[560px] text-[14px] [&_td]:pr-3 [&_th]:pr-3">
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
                  <tr key={s.key} className={`border-t border-line ${s.key === 'lead' ? 'bg-paper font-semibold' : ''}`}>
                    <td className="py-2.5 pl-1 text-text">{s.label}</td>
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
                          <span className="text-[12px] font-normal text-muted">
                            {s.key === 'visit' ? '' : pct(f[v][s.key], f[v].visit)}
                          </span>
                        </span>
                      </td>
                    ))}
                  </tr>
                ))}
                <tr className="border-t border-line">
                  <td className="py-2.5 pl-1 text-text">Kvalifikovaní z leadů</td>
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
          <Panel title="Kampaně a náklad na lead">
            <p className="-mt-2 mb-3 text-[13px] text-muted">
              Kreativa = <code className="text-[12px]">utm_content</code>. Zadejte útratu z Meta Ads a dopočítá se cena za lead (CPL).
            </p>
            <div className="-mx-5 overflow-x-auto px-5">
              <table className="num w-full min-w-[600px] text-[14px] [&_td]:pr-3 [&_th]:pr-3">
                <thead>
                  <tr className="text-left text-[12px] text-muted">
                    <th className="py-2 font-medium">Kreativa</th>
                    <th className="font-medium">Návštěvy</th>
                    <th className="font-medium">Leady</th>
                    <th className="font-medium">Konverze</th>
                    <th className="font-medium">Kvalif.</th>
                    <th className="font-medium">CPL</th>
                    <th className="font-medium">Útrata</th>
                  </tr>
                </thead>
                <tbody>
                  {camps.map((c) => (
                    <tr key={c.key} className="border-t border-line">
                      <td className={`py-2.5 font-mono text-[13px] ${c.key === NO_UTM ? 'text-muted' : 'text-ink'}`}>{c.key}</td>
                      <td>{c.visits}</td>
                      <td>
                        <b className="text-ink">{c.leads}</b>
                      </td>
                      <td>{c.conv == null ? '–' : pct(c.leads, c.visits)}</td>
                      <td>{c.qualified}</td>
                      <td className={c.cpl == null ? 'text-muted' : 'font-semibold text-ink'}>{kc(c.cpl)}</td>
                      <td>
                        <form action="/api/admin/spend" method="post" className="flex items-center gap-1">
                          <input type="hidden" name="key" value={c.key} />
                          <span className="relative">
                            <input
                              name="czk"
                              inputMode="numeric"
                              defaultValue={c.spend ?? ''}
                              placeholder="0"
                              aria-label={`Útrata ${c.key} v Kč`}
                              className="input !min-h-9 w-[88px] !rounded-lg !py-1 !pr-7 !pl-2 !text-[13px]"
                            />
                            <span className="pointer-events-none absolute top-1/2 right-2 -translate-y-1/2 text-[12px] text-muted">Kč</span>
                          </span>
                          <button
                            className="grid h-9 w-9 place-items-center rounded-lg border border-line text-muted hover:border-teal-500 hover:text-teal-700"
                            aria-label={`Uložit útratu ${c.key}`}
                            title="Uložit"
                          >
                            <Check className="h-4 w-4" />
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
            title={`Péče: e-maily (${sent} odesláno)`}
            action={
              emailEnabled && (
                <form action="/api/admin/sequence/run" method="post">
                  <button className="text-[13px] font-medium text-teal-700 hover:underline">Odeslat splatné teď</button>
                </form>
              )
            }
          >
            {!emailEnabled && (
              <p className="-mt-2 mb-3 text-[13px] leading-snug text-muted">
                Odesílání je vypnuté (chybí <code className="text-[12px]">RESEND_API_KEY</code>), kroky se zatím jen plánují. Šablony si
                můžete prohlédnout.
              </p>
            )}
            <ul className="space-y-2.5 text-[14px]">
              {SEQUENCE.map((s) => {
                const by = (st: string) => seq.rows.find((r) => r.step === s.step && r.status === st)?.n ?? 0;
                const extra = (
                  [
                    ['přeskočeno', by('skipped')],
                    ['chyba', by('failed')],
                    ['zrušeno', by('cancelled')],
                  ] as const
                ).filter(([, n]) => n > 0);
                return (
                  <li key={s.step}>
                    <Link
                      href={`/admin/email/${s.step}`}
                      className="group block rounded-xl border border-line p-3 transition-colors hover:border-teal-300 hover:bg-paper"
                    >
                      <span className="flex items-start justify-between gap-3">
                        <span className="font-medium text-ink">
                          <span className="mr-1.5 rounded-md bg-teal-50 px-1.5 py-0.5 text-[11.5px] font-bold text-teal-700">D{s.day}</span>
                          {s.subject}
                        </span>
                        <ArrowRight className="mt-0.5 h-4 w-4 flex-none text-muted transition-transform group-hover:translate-x-0.5" />
                      </span>
                      <span className="num mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5 text-[12.5px] text-muted">
                        <span>
                          odesláno <b className="text-ink">{by('sent')}</b>
                        </span>
                        <span>
                          čeká <b className="text-ink">{by('scheduled')}</b>
                        </span>
                        <span>
                          kliky <b className="text-ink">{seq.clicks[s.step] ?? 0}</b>
                        </span>
                        {extra.map(([k, n]) => (
                          <span key={k}>
                            {k} {n}
                          </span>
                        ))}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </Panel>
        </div>

        {/* Leady */}
        <Panel
          title={`Poslední leady (${latest.length})`}
          action={
            <a href="/api/admin/export" className="flex items-center gap-1 text-[13px] font-medium text-teal-700 hover:underline">
              <Download className="h-3.5 w-3.5" /> Všechny do CSV
            </a>
          }
        >
          <div className="-mx-5 overflow-x-auto px-5">
            <table className="w-full min-w-[860px] text-[14px] [&_td]:pr-3 [&_th]:pr-3">
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
                {latest.map((l) => {
                  const h = handoffLabel(l.handoffStatus);
                  return (
                    <tr key={l.id} className="border-t border-line hover:bg-paper">
                      <td className="num py-2.5 whitespace-nowrap text-muted">{fmtDateTime(l.createdAt)}</td>
                      <td className="max-w-[280px]">
                        <span className="flex items-center gap-1.5">
                          <Link href={`/admin/lead/${l.id}`} className="truncate font-medium text-ink hover:underline" title={l.email}>
                            {l.email}
                          </Link>
                          {l.phone && <Phone className="h-3.5 w-3.5 flex-none text-teal-700" aria-label="má telefon" />}
                          {isTestEmail(l.email) && (
                            <span className="flex-none rounded border border-line px-1 text-[10.5px] font-semibold text-muted">TEST</span>
                          )}
                        </span>
                      </td>
                      <td>
                        <StageChip stage={l.stage} />
                      </td>
                      <td className="num">
                        <span className="flex items-center gap-2">
                          <b className="w-6 text-ink">{l.score}</b>
                          <span className="h-1.5 w-12 overflow-hidden rounded-full bg-line" aria-hidden="true">
                            <span
                              className={`block h-full rounded-full ${l.score >= QUALIFIED_AT ? 'bg-teal-700' : 'bg-teal-200'}`}
                              style={{ width: `${Math.min(l.score, 100)}%` }}
                            />
                          </span>
                        </span>
                      </td>
                      <td className="whitespace-nowrap text-muted">
                        {isMonthlyBand(l.monthlyBand) ? MONTHLY_BANDS[l.monthlyBand].label : '–'}
                      </td>
                      <td className="whitespace-nowrap text-muted">
                        <span className="mr-1.5 inline-block h-2 w-2 rounded-full" style={{ background: SERIES[l.variant] }} />
                        {VARIANT_LABEL[l.variant].slice(0, 1)} · {l.utmSource ?? 'přímo'}
                        {l.utmContent && <span className="font-mono text-[12px]"> · {l.utmContent}</span>}
                      </td>
                      <td className="font-mono text-[13px] text-muted">{l.interest ?? '–'}</td>
                      <td className={`text-[12.5px] whitespace-nowrap ${TONE[h.tone]}`}>{h.text}</td>
                    </tr>
                  );
                })}
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
