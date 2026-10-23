'use client';

import { compare, data, formatInt, formatKc, formatPct, yearsLabel } from '@etfd/shared';
import { ArrowRight } from '@/components/ui/icons';
import { Term } from '@/components/ui/Term';
import { track } from '@/lib/track';
import { useCountUp } from '@/lib/useCountUp';
import { useLead } from './LeadProvider';

const { bank, etf, annual_return: annualReturn } = data.calc;

/** Výsledek pro daný vstup – sdílí ho kalkulačka i reklama B (stejná čísla) */
function feeView(monthly: number, years: number) {
  const r = compare({ monthly, years, annualReturn, bank, etf });
  return { ...r, etfBarPct: Math.max((r.etfCost / Math.max(r.bankCost, 1)) * 100, 1.5), months: Math.round(r.saved / monthly) };
}

function Slider({ label, value, min, max, step, display, onChange, name }: {
  label: string; value: number; min: number; max: number; step: number; display: string; name: string; onChange: (v: number) => void;
}) {
  return (
    <label className="block">
      <span className="block text-[13px] leading-tight text-muted">{label}</span>
      <output className="num mt-0.5 block text-[18px] font-bold whitespace-nowrap text-ink">{display}</output>
      <input
        type="range" className="range mt-1" min={min} max={max} step={step} value={value} data-in={name}
        style={{ ['--p' as string]: `${((value - min) / (max - min)) * 100}%` }}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </label>
  );
}

/**
 * Kalkulačka – jen dva posuvníky, dva pruhy a jedno velké číslo. Metodika je schovaná pod „Jak počítáme?“.
 */
export function FeeCalculator() {
  const { calc, setCalc, openSheet, unlocked } = useLead();
  const v = feeView(calc.monthly, calc.years);
  const saved = useCountUp(v.saved);
  const bankCost = useCountUp(v.bankCost);
  const etfCost = useCountUp(v.etfCost);

  return (
    <div className="card overflow-hidden" data-module="calc">
      <div className="p-4 sm:p-5">
        <p className="mb-3 text-[15px] font-semibold text-ink">Spočítejte si, kolik vás stojí poplatky</p>
        <div className="grid grid-cols-2 gap-4 sm:gap-6">
          <Slider name="monthly" label="Kolik měsíčně investujete" value={calc.monthly} min={500} max={30000} step={500} display={formatKc(calc.monthly)} onChange={(m) => setCalc({ ...calc, monthly: m })} />
          <Slider name="years" label="Jak dlouho" value={calc.years} min={5} max={40} step={1} display={yearsLabel(calc.years)} onChange={(y) => setCalc({ ...calc, years: y })} />
        </div>

        {/* Kolik zaplatíte na poplatcích – dva pruhy pod sebou, popisky lidsky */}
        <div className="mt-4 space-y-3 rounded-2xl bg-paper p-3.5" aria-live="polite">
          <p className="text-[12px] font-semibold tracking-[0.14em] text-muted uppercase">Za {yearsLabel(calc.years)} zaplatíte na poplatcích</p>
          <div>
            <div className="flex items-baseline justify-between gap-3 text-[13.5px]">
              <span className="font-semibold text-text">Fond z banky</span>
              <b className="num text-[15px] text-brick" data-out="bankFees">{formatKc(bankCost)}</b>
            </div>
            <p className="text-[12px] text-muted">{formatPct(bank.ter_pct)} ročně + {formatPct(bank.entry_fee_pct)} z každého vkladu</p>
            <span className="mt-1.5 block h-2.5 rounded-full bg-gradient-to-r from-brick-700 to-brick" />
          </div>
          <div>
            <div className="flex items-baseline justify-between gap-3 text-[13.5px]">
              <span className="font-semibold text-text">ETF dvojče</span>
              <b className="num text-[15px] text-teal-700" data-out="etfFees">{formatKc(etfCost)}</b>
            </div>
            <p className="text-[12px] text-muted"><Term k="TER">{formatPct(etf.ter_pct)} ročně</Term>, bez vstupního poplatku</p>
            <span className="mt-1.5 block h-2.5 rounded-full bg-teal-100">
              <span className="block h-full rounded-full bg-gradient-to-r from-teal-700 to-teal-500 transition-[width] duration-300" style={{ width: `${v.etfBarPct}%` }} />
            </span>
          </div>
        </div>

        <div className="mt-4 text-center">
          <p className="text-[14px] text-muted">S ETF vám za {yearsLabel(calc.years)} zůstane navíc</p>
          <p className="num font-display text-[clamp(36px,8vw,46px)] leading-none font-bold text-brick" data-out="saved">{formatKc(saved)}</p>
          <p className="mt-1 text-[13px] text-muted">to je jako {formatInt(v.months)} vašich měsíčních vkladů</p>
        </div>

        {unlocked ? (
          <a href="/report#dvojcata" onClick={() => track('report_open', { from: 'calc' })} className="group mt-4 flex min-h-11 items-center justify-center gap-1.5 text-[14px] font-semibold text-teal-700 hover:text-teal-900">
            Levná ETF dvojčata najdete v přehledu <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </a>
        ) : (
          <button className="btn btn-primary mt-4 w-full" onClick={() => openSheet('calc')} data-cta="calc">
            Chci ušetřit {formatKc(v.saved)}
            <ArrowRight />
          </button>
        )}
        <details className="smooth mt-2 text-center text-[11.5px] text-muted">
          <summary className="cursor-pointer list-none text-teal-700 [&::-webkit-details-marker]:hidden">Jak počítáme?</summary>
          <p className="mt-2 text-left leading-relaxed" id="calc-note">
            Příklad fondu z banky: {bank.example} (<a className="src-link" href={bank.source_url} target="_blank" rel="noopener">KID</a>). Výnos trhu {formatPct(annualReturn * 100)} ročně před poplatky, srovnáváme jen náklady. Ilustrace, ne předpověď.
          </p>
        </details>
      </div>
    </div>
  );
}
