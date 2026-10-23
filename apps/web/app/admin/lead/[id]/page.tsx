import type { ReactNode } from 'react';
import Link from 'next/link';
import { apiGet, type LeadDetailDto } from '@/lib/api';
import { isMonthlyBand, MONTHLY_BANDS, VARIANT_LABEL } from '@etfd/shared';
import { Panel, StageChip } from '@/components/admin/ui';
import { Logo } from '@/components/ui/Logo';

export const dynamic = 'force-dynamic';
export const metadata = { robots: { index: false } };

const fmt = (d: string | Date) => new Date(d).toLocaleString('cs-CZ', { day: 'numeric', month: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' });

export default async function LeadPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { lead, journey, jobs } = await apiGet<LeadDetailDto>(`/admin/leads/${id}`);
  const t0 = new Date(journey[0]?.createdAt ?? lead.createdAt).getTime();
  const facts: [string, ReactNode][] = [
    ['Vytvořen', fmt(lead.createdAt)],
    ['Varianta / zdroj', `${VARIANT_LABEL[lead.variant]} · ${lead.utmSource ?? '–'} / ${lead.utmCampaign ?? '–'} / ${lead.utmContent ?? '–'}`],
    ['Formulář', lead.source ?? '–'],
    ['Zařízení', lead.device ?? '–'],
    ['Zájem (ticker)', lead.interest ?? '–'],
    ['Kalkulačka', lead.calcMonthly ? `${lead.calcMonthly} Kč/měsíc` : '–'],
    ['Investuje měsíčně', isMonthlyBand(lead.monthlyBand) ? MONTHLY_BANDS[lead.monthlyBand].label : '–'],
    ['Telefon', lead.phone ?? '–'],
    ['Souhlas (e-mail)', lead.consentText ?? '–'],
    ['Souhlas (hovor)', lead.callConsentText ?? '–'],
    ['Předání', `${lead.handoffStatus ?? '–'}${lead.handedOverAt ? ` · ${fmt(lead.handedOverAt)}` : ''}`],
    ['Odhlášen', lead.unsubscribedAt ? fmt(lead.unsubscribedAt) : '–'],
  ];

  return (
    <div className="min-h-dvh bg-paper">
      <header className="border-b border-line bg-white"><div className="wrap flex h-16 items-center gap-4"><Logo /><Link href="/admin" className="text-[14px] text-teal-700 hover:underline">← Pipeline</Link></div></header>
      <main className="wrap space-y-5 py-6">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-[24px] font-bold text-ink">{lead.email}</h1>
          <StageChip stage={lead.stage} />
          {!lead.handedOverAt && lead.wantsCall && (
            <form action={`/api/admin/leads/${lead.id}/handoff`} method="post"><button className="btn btn-primary !min-h-10 !px-4 !text-[14px]">Označit jako předaný</button></form>
          )}
        </div>
        <div className="grid gap-5 lg:grid-cols-[1fr_1.2fr]">
          <div className="space-y-5">
            <Panel title={`Skóre ${lead.score}`}>
              <ul className="space-y-1.5 text-[14px]">
                {(lead.scoreReasons ?? []).map((r) => <li key={r.label} className="flex justify-between"><span className="text-text">{r.label}</span><b className="num text-ink">+{r.points}</b></li>)}
              </ul>
            </Panel>
            <Panel title="Údaje">
              <dl className="space-y-2 text-[14px]">{facts.map(([k, v]) => <div key={k} className="grid grid-cols-[150px_1fr] gap-2"><dt className="text-muted">{k}</dt><dd className="text-ink">{v}</dd></div>)}</dl>
            </Panel>
            <Panel title="E-mailová sekvence">
              <ul className="space-y-1.5 text-[14px]">{jobs.map((j) => <li key={j.id} className="flex justify-between gap-3"><span className="text-text">{j.step}</span><span className="text-muted">{j.status} · {fmt(j.sentAt ?? j.sendAt)}{j.error ? ` · ${j.error}` : ''}</span></li>)}</ul>
            </Panel>
          </div>
          <Panel title={`Cesta relace (${journey.length} událostí)`}>
            <ol className="relative space-y-2 border-l-2 border-teal-100 pl-4 text-[13.5px]">
              {journey.map((e) => (
                <li key={e.id} className="relative">
                  <span className={`absolute top-1.5 -left-[21px] h-2.5 w-2.5 rounded-full ring-2 ring-white ${['lead_ok', 'handoff'].includes(e.event) ? 'bg-brick' : 'bg-teal-700'}`} />
                  <span className="num mr-2 text-muted">+{Math.round((new Date(e.createdAt).getTime() - t0) / 1000)} s</span>
                  <b className="text-ink">{e.event}</b>
                  {e.props && Object.keys(e.props).length > 0 && <span className="ml-2 font-mono text-[12px] text-muted">{JSON.stringify(e.props)}</span>}
                </li>
              ))}
            </ol>
          </Panel>
        </div>
      </main>
    </div>
  );
}
