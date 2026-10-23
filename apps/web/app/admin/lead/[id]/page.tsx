import type { ReactNode } from 'react';
import { apiGet, type LeadDetailDto } from '@/lib/api';
import { isMonthlyBand, MONTHLY_BANDS, SEQUENCE, VARIANT_LABEL } from '@etfd/shared';
import { AdminHeader, fmtDateTime, handoffLabel, isTestEmail, JOB_LABEL, Panel, StageChip } from '@/components/admin/ui';

export const dynamic = 'force-dynamic';
export const metadata = { robots: { index: false } };

const fmt = (d: string | Date) => fmtDateTime(d, true);

export default async function LeadPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { lead, journey, jobs } = await apiGet<LeadDetailDto>(`/admin/leads/${id}`);
  const t0 = new Date(journey[0]?.createdAt ?? lead.createdAt).getTime();
  const facts: [string, ReactNode][] = [
    ['Vytvořen', fmt(lead.createdAt)],
    [
      'Varianta / zdroj',
      `${VARIANT_LABEL[lead.variant]} · ${lead.utmSource ?? '–'} / ${lead.utmCampaign ?? '–'} / ${lead.utmContent ?? '–'}`,
    ],
    ['Formulář', lead.source ?? '–'],
    ['Zařízení', lead.device ?? '–'],
    ['Zájem (ticker)', lead.interest ?? '–'],
    ['Kalkulačka', lead.calcMonthly ? `${lead.calcMonthly} Kč/měsíc` : '–'],
    ['Investuje měsíčně', isMonthlyBand(lead.monthlyBand) ? MONTHLY_BANDS[lead.monthlyBand].label : '–'],
    ['Telefon', lead.phone ?? '–'],
    ['Souhlas (e-mail)', lead.consentText ?? '–'],
    ['Souhlas (hovor)', lead.callConsentText ?? '–'],
    ['Předání', `${handoffLabel(lead.handoffStatus).text}${lead.handedOverAt ? ` · ${fmt(lead.handedOverAt)}` : ''}`],
    ['Odhlášen', lead.unsubscribedAt ? fmt(lead.unsubscribedAt) : '–'],
  ];

  return (
    <div className="min-h-dvh bg-paper">
      <AdminHeader back />
      <main className="wrap space-y-5 py-6">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-[22px] font-bold break-all text-ink sm:text-[24px]">{lead.email}</h1>
          <StageChip stage={lead.stage} />
          {isTestEmail(lead.email) && <span className="rounded border border-line px-1.5 text-[11px] font-semibold text-muted">TEST</span>}
          {!lead.handedOverAt && lead.wantsCall && (
            <form action={`/api/admin/leads/${lead.id}/handoff`} method="post">
              <button className="btn btn-primary !min-h-10 !px-4 !text-[14px]">Označit jako předaný</button>
            </form>
          )}
        </div>
        <div className="grid gap-5 lg:grid-cols-[1fr_1.2fr]">
          <div className="space-y-5">
            <Panel title={`Skóre ${lead.score}`}>
              <ul className="space-y-1.5 text-[14px]">
                {!(lead.scoreReasons ?? []).length && <li className="text-muted">Zatím žádné body.</li>}
                {(lead.scoreReasons ?? []).map((r) => (
                  <li key={r.label} className="flex justify-between">
                    <span className="text-text">{r.label}</span>
                    <b className="num text-ink">+{r.points}</b>
                  </li>
                ))}
              </ul>
            </Panel>
            <Panel title="Údaje">
              <dl className="space-y-2 text-[14px]">
                {facts.map(([k, v]) => (
                  <div key={k} className="grid gap-0.5 sm:grid-cols-[150px_1fr] sm:gap-2">
                    <dt className="text-muted">{k}</dt>
                    <dd className="text-ink">{v}</dd>
                  </div>
                ))}
              </dl>
            </Panel>
            <Panel title="E-mailová sekvence">
              <ul className="space-y-1.5 text-[14px]">
                {jobs.map((j) => (
                  <li key={j.id} className="flex justify-between gap-3">
                    <span className="min-w-0 truncate text-text">
                      <span className="mr-1.5 rounded-md bg-teal-50 px-1.5 py-0.5 text-[11.5px] font-bold text-teal-700">
                        D{SEQUENCE.find((s) => s.step === j.step)?.day}
                      </span>
                      {SEQUENCE.find((s) => s.step === j.step)?.subject ?? j.step}
                    </span>
                    <span className="flex-none text-right text-muted">
                      {JOB_LABEL[j.status] ?? j.status} · {fmt(j.sentAt ?? j.sendAt)}
                      {j.error ? ` · ${j.error === 'disabled' ? 'e-maily vypnuté' : j.error}` : ''}
                    </span>
                  </li>
                ))}
              </ul>
            </Panel>
          </div>
          <Panel title={`Cesta relace (${journey.length} událostí)`}>
            <ol className="relative space-y-2 border-l-2 border-teal-100 pl-4 text-[13.5px]">
              {journey.map((e) => (
                <li key={e.id} className="relative">
                  <span
                    className={`absolute top-1.5 -left-[21px] h-2.5 w-2.5 rounded-full ring-2 ring-white ${['lead_ok', 'handoff'].includes(e.event) ? 'bg-brick' : 'bg-teal-700'}`}
                  />
                  <span className="num mr-2 text-muted">+{Math.round((new Date(e.createdAt).getTime() - t0) / 1000)} s</span>
                  <b className="text-ink">{e.event}</b>
                  {e.props && Object.keys(e.props).length > 0 && (
                    <span className="ml-2 font-mono text-[12px] text-muted">{JSON.stringify(e.props)}</span>
                  )}
                </li>
              ))}
            </ol>
          </Panel>
        </div>
      </main>
    </div>
  );
}
