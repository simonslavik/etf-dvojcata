'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { data, MONTHLY_BANDS, type MonthlyBand } from '@etfd/shared';
import { track } from '@/lib/track';
import { ArrowRight, Check, X } from '@/components/ui/icons';
import { CallRequest } from '@/components/lead/CallRequest';
import { LeadForm } from './LeadForm';
import { useLead } from './LeadProvider';
import { ReportCover } from './ReportCover';
import { SuccessCheck } from '@/components/ui/SuccessCheck';

/** Bottom sheet: e-mail → hotovo + kvalifikace (1 klepnutí) → nabídka hovoru (předání) */
export function LeadSheet() {
  const { sheet, closeSheet, token, emailSent, markCalled } = useLead();
  const ref = useRef<HTMLDialogElement>(null);
  const [band, setBand] = useState<MonthlyBand | null>(null);
  const [callDone, setCallDone] = useState(false);
  const [callSkipped, setCallSkipped] = useState(false);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (sheet.open && !d.open) {
      // iOS Safari < 15.4 nemá showModal – zobrazíme aspoň jako fixní panel
      if (typeof d.showModal === 'function') d.showModal(); else d.setAttribute('open', '');
      // showModal dá fokus prvnímu prvku (zavírací křížek) – chceme rovnou e-mail (na iOS v rámci gesta → otevře klávesnici)
      d.querySelector<HTMLInputElement>('input[type="email"]')?.focus();
    }
    if (!sheet.open && d.open) d.close();
  }, [sheet.open]);

  // Klávesnice na iOS zmenší jen visual viewport – sheet posuneme nad ni, ať je tlačítko vidět
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const update = () => ref.current?.style.setProperty('--kb', `${Math.max(0, innerHeight - vv.height - vv.offsetTop)}px`);
    vv.addEventListener('resize', update);
    vv.addEventListener('scroll', update);
    return () => { vv.removeEventListener('resize', update); vv.removeEventListener('scroll', update); };
  }, []);

  const answer = (b: MonthlyBand) => {
    setBand(b);
    if (token) fetch('/api/qualify', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ token, band: b }) }).catch(() => {});
  };

  return (
    <dialog
      ref={ref}
      onClose={closeSheet}
      onClick={(e) => { if (e.target === ref.current) closeSheet(); }}
      aria-labelledby="sheet-title"
      className="fixed inset-x-0 top-auto bottom-[var(--kb,0px)] m-0 max-h-[92dvh] w-full max-w-none overflow-y-auto rounded-t-[28px] bg-white p-0 text-text shadow-2xl backdrop:bg-teal-950/55 backdrop:backdrop-blur-[2px] open:animate-sheet-in sm:inset-auto sm:top-1/2 sm:left-1/2 sm:max-w-[520px] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-[28px] sm:open:animate-fade-in"
    >
      <div className="relative px-5 pt-3 pb-[max(20px,env(safe-area-inset-bottom))] sm:p-8">
        <span className="mx-auto mb-4 block h-1.5 w-10 rounded-full bg-line sm:hidden" aria-hidden="true" />
        <button onClick={closeSheet} aria-label="Zavřít" className="absolute top-3 right-3 grid h-11 w-11 place-items-center rounded-full text-muted hover:bg-paper"><X className="h-5 w-5" /></button>

        {sheet.step === 'form' ? (
          <div data-sheet-step="form">
            <div className="flex items-start gap-4 pr-8">
              <div className="animate-pop flex-none pt-1"><ReportCover size="sm" /></div>
              <div>
                <p className="eyebrow">Zdarma · hned</p>
                <h2 id="sheet-title" className="mt-2 font-display text-[24px] leading-tight font-bold text-ink">Kam pošleme přehled {data.pairs.length} dvojčat?</h2>
              </div>
            </div>
            <ul className="mt-4 mb-5 space-y-1 text-[14.5px] text-muted">
              {['ISIN ke zkopírování u všech dvojčat', 'Návod na první nákup + daně v Česku'].map((x) => (
                <li key={x} className="flex items-center gap-2"><Check className="h-4 w-4 flex-none text-ok" />{x}</li>
              ))}
            </ul>
            {sheet.open && <LeadForm name="sheet" cta="Odemknout přehled" stacked />}
          </div>
        ) : (
          <div data-sheet-step="done" className="animate-rise">
            <SuccessCheck />
            <h2 id="sheet-title" className="mt-4 font-display text-[26px] leading-tight font-bold text-ink">Hotovo, přehled je váš.</h2>
            <p className="mt-1.5 text-[15px] text-muted">
              {emailSent ? 'Najdete ho níže na stránce a poslali jsme ho i na váš e-mail.' : 'Najdete ho níže na stránce – můžete ho rovnou otevřít.'}
            </p>
            <Link href="/report" className="btn btn-primary mt-5 w-full" onClick={() => track('report_open')} data-open-report>
              Otevřít celý přehled <ArrowRight />
            </Link>

            {token && !band && (
              <div className="mt-6 border-t border-line pt-5" data-qualify>
                <p className="text-[15px] font-medium text-ink">Ještě jedna věc <span className="font-normal text-muted">(nepovinné)</span>: kolik měsíčně investujete?</p>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  {(Object.keys(MONTHLY_BANDS) as MonthlyBand[]).map((b) => (
                    <button key={b} className="chip !font-sans !font-medium" onClick={() => answer(b)} data-q={b}>{MONTHLY_BANDS[b].label}</button>
                  ))}
                </div>
              </div>
            )}

            {token && band && !callSkipped && (
              <div className="mt-6 animate-rise" data-call-offer>
                {!callDone && <p className="mb-3 text-[14px] text-muted">Díky! Podle toho vám budeme posílat jen relevantní tipy.</p>}
                <CallRequest token={token} onDone={() => { setCallDone(true); markCalled(); }} onSkip={() => setCallSkipped(true)} />
              </div>
            )}
            {callSkipped && <p className="mt-5 text-[14px] text-muted" data-qualify-thanks>Díky! Podle toho vám budeme posílat jen relevantní tipy.</p>}
          </div>
        )}
      </div>
    </dialog>
  );
}
