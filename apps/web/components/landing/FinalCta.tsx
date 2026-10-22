'use client';

import { data } from '@etfd/shared';
import { ArrowRight } from '@/components/ui/icons';
import { LeadForm } from './LeadForm';
import { useLead } from './LeadProvider';
import { ReportCover } from './ReportCover';

/**
 * Konec stránky = poslední příležitost: kdo dočetl FAQ, má námitky vyřešené a je nejblíž rozhodnutí.
 * Kompaktní (jedna karta), po odemčení místo formuláře odkaz na přehled.
 */
export function FinalCta() {
  const { unlocked } = useLead();
  return (
    <section aria-labelledby="final-title" className="bg-paper pb-10 sm:pb-16">
      <div className="wrap max-w-[920px]">
        <div className="reveal relative overflow-hidden rounded-[24px] bg-teal-900 px-5 py-6 text-white sm:px-8 sm:py-7">
          <div className="facets" aria-hidden="true" />
          <div className="relative flex items-center gap-5 sm:gap-7">
            <div className="animate-float hidden flex-none sm:block"><ReportCover size="sm" /></div>
            <div className="min-w-0 flex-1">
              <h2 id="final-title" className="font-display text-[22px] leading-tight font-bold sm:text-[26px]">
                {unlocked ? 'Přehled máte odemčený' : <>Všech {data.pairs.length} dvojčat + návod do&nbsp;e‑mailu</>}
              </h2>
              <p className="mt-1 text-[14px] text-white/70">{unlocked ? 'ISIN, poplatky, návod na první nákup a daně na jedné stránce.' : 'Zdarma a hned na obrazovce – stačí e-mail.'}</p>
              <div className="mt-4">
                {unlocked
                  ? <a href="/report" className="btn btn-primary" data-open-report>Otevřít celý přehled <ArrowRight /></a>
                  : <LeadForm name="final" cta="Chci přehled" tone="dark" />}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
