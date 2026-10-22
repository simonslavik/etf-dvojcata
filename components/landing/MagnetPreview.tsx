'use client';

import { data } from '@/lib/data';
import { formatPct } from '@/lib/format';
import { ArrowRight, Check, Lock } from '@/components/ui/icons';
import { LeadForm } from './LeadForm';
import { useLead } from './LeadProvider';

const FREE_ROWS = 3;
const PREVIEW_ROWS = 7; // 3 čitelné + 4 rozmazané stačí, aby bylo jasné, co návštěvník dostane

/** Náhled lead magnetu: první řádky čitelné, zbytek rozmazaný + formulář přímo na místě */
export function MagnetPreview() {
  const { unlocked } = useLead();
  return (
    <section id="prehled" aria-labelledby="magnet-title" className="bg-paper py-14 sm:py-20">
      <div className="wrap grid grid-cols-1 items-center gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:gap-14">
        <div>
          <p className="eyebrow">Zdarma výměnou za e-mail</p>
          <h2 id="magnet-title" className="h2 mt-3">Celý přehled na jedné stránce</h2>
          <ul className="mt-6 space-y-3 text-[16px]">
            {[
              [`${data.pairs.length} amerických ETF`, 'a jejich evropská dvojčata'],
              ['ISIN a burza', '– zkopírujete a koupíte u svého brokera'],
              ['Poplatky vedle sebe', '– US originál, dvojče, fond z banky'],
              ['Daně v Česku', '– časový test 3 roky a proč volit akumulační fond'],
            ].map(([b, t]) => (
              <li key={b} className="flex items-start gap-3">
                <span className="mt-0.5 grid h-6 w-6 flex-none place-items-center rounded-full bg-ok-50 text-ok"><Check className="h-3.5 w-3.5" /></span>
                <span><b className="font-semibold text-ink">{b}</b> <span className="text-muted">{t}</span></span>
              </li>
            ))}
          </ul>
        </div>

        <div className="window">
          <div className="window-bar">
            <span className="window-dots" aria-hidden="true"><i /><i /><i /></span>
            <span className="window-url">přehled · {data.pairs.length} ETF dvojčat · PDF</span>
          </div>
          <div className="relative">
            <table className="num w-full text-[14px]">
              <thead>
                <tr className="text-left text-[11px] tracking-[0.14em] text-muted uppercase">
                  <th className="px-4 pt-4 pb-2 font-semibold sm:px-6">USA</th>
                  <th className="px-2 pt-4 pb-2 font-semibold">Dvojče v EU</th>
                  <th className="px-4 pt-4 pb-2 text-right font-semibold sm:px-6">TER</th>
                </tr>
              </thead>
              <tbody>
                {data.pairs.slice(0, unlocked ? data.pairs.length : PREVIEW_ROWS).map((p, i) => {
                  const locked = !unlocked && i >= FREE_ROWS;
                  return (
                    <tr key={p.us.ticker} className={`border-t border-line ${locked ? 'blur-[5px] select-none' : ''}`} aria-hidden={locked || undefined}>
                      <td className="px-4 py-2.5 sm:px-6"><span className="font-mono font-bold text-muted line-through decoration-brick/70">{p.us.ticker}</span><span className="block text-[11.5px] text-muted">{formatPct(p.us.ter_pct)}</span></td>
                      <td className="px-2 py-2.5"><span className="font-mono font-bold text-ink">{p.twin.ticker}</span><span className="block font-mono text-[11.5px] text-muted">{locked ? 'IE00XXXXXXXX' : p.twin.isin}</span></td>
                      <td className="px-4 py-2.5 text-right font-semibold text-ink sm:px-6">{formatPct(p.twin.ter_pct)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {unlocked ? (
              <div className="border-t border-line p-4 sm:p-6">
                <a href="/prehled" className="btn btn-primary w-full" data-open-report>Otevřít celý přehled s daněmi <ArrowRight /></a>
              </div>
            ) : (
              <div className="relative -mt-20 bg-gradient-to-t from-white from-55% to-white/0 px-4 pt-14 pb-5 sm:px-6">
                <p className="mb-3 flex items-center gap-2 text-[15px] font-semibold text-ink"><Lock className="h-4 w-4 text-brick" /> Kam vám přehled pošleme?</p>
                <LeadForm name="inline" cta="Odemknout" />
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
