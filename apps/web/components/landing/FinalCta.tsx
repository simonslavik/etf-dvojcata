'use client';

import { data } from '@etfd/shared';
import { CallRequest } from '@/components/lead/CallRequest';
import { LeadForm } from './LeadForm';
import { useLead } from './LeadProvider';
import { ReportCover } from './ReportCover';

/**
 * Konec stránky = poslední příležitost: kdo dočetl FAQ, má námitky vyřešené a je nejblíž rozhodnutí.
 * Před odemčením formulář; po odemčení místo dalšího „Otevřít přehled“ další krok trychtýře – nabídka hovoru.
 */
export function FinalCta() {
  const { unlocked, token, called, markCalled } = useLead();
  // po odemčení: nabídka hovoru, ale jen s tokenem a jen pokud o hovor ještě nepožádal
  if (unlocked && (!token || called)) return null;
  return (
    <section aria-labelledby="final-title" className="bg-paper pb-10 sm:pb-16">
      <div className="wrap max-w-[920px]">
        {unlocked && token ? (
          <div className="reveal">
            <h2 id="final-title" className="sr-only">Pomoc s prvním nákupem</h2>
            <CallRequest token={token} onDone={markCalled} />
          </div>
        ) : (
          <div className="reveal relative overflow-hidden rounded-[24px] bg-teal-900 px-5 py-6 text-white sm:px-8 sm:py-7">
            <div className="facets" aria-hidden="true" />
            <div className="relative flex items-center gap-5 sm:gap-7">
              <div className="animate-float hidden flex-none sm:block"><ReportCover size="sm" /></div>
              <div className="min-w-0 flex-1">
                <h2 id="final-title" className="font-display text-[22px] leading-tight font-bold sm:text-[26px]">
                  Všech {data.pairs.length} dvojčat + návod do&nbsp;e‑mailu
                </h2>
                <p className="mt-1 text-[14px] text-white/70">Zdarma a hned na obrazovce – stačí e-mail.</p>
                <div className="mt-4"><LeadForm name="final" cta="Chci přehled" tone="dark" /></div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
