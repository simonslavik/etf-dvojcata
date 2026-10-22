'use client';

import { compare, data, formatInt, formatKc, formatPct, yearsLabel } from '@etfd/shared';
import { ArrowRight } from '@/components/ui/icons';
import { Term } from '@/components/ui/Term';
import { useCountUp } from '@/lib/useCountUp';
import { useLead } from './LeadProvider';

const { bank, etf, annual_return: annualReturn } = data.calc;

/** Výsledek pro daný vstup – sdílí ho kalkulačka i reklama B (stejná čísla) */
export function feeView(monthly: number, years: number) {
  const r = compare({ monthly, years, annualReturn, bank, etf });
  return { ...r, etfBarPct: Math.max((r.etfCost / Math.max(r.bankCost, 1)) * 100, 1.5), months: Math.round(r.saved / monthly) };
}

function Slider({ label, value, min, max, step, display, onChange, name }: {
  label: string; value: number; min: number; max: number; step: number; display: string; name: string; onChange: (v: number) => void;
}) {
  return (
    <label className="block">
      <span className="flex items-baseline justify-between gap-2 text-[13px] text-muted">
        {label} <output className="num text-[16px] font-semibold whitespace-nowrap text-ink">{display}</output>
      </span>
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
        <div className="grid grid-cols-2 gap-4 sm:gap-6">
          <Slider name="monthly" label="Měsíčně" value={calc.monthly} min={500} max={30000} step={500} display={formatKc(calc.monthly)} onChange={(m) => setCalc({ ...calc, monthly: m })} />
          <Slider name="years" label="Po dobu" value={calc.years} min={5} max={40} step={1} display={yearsLabel(calc.years)} onChange={(y) => setCalc({ ...calc, years: y })} />
        </div>

        {/* Kolik zaplatíte na poplatcích – dva pruhy vedle sebe */}
        <div className="mt-4 space-y-2.5 rounded-2xl bg-paper p-3.5" aria-live="polite">
          <div>
            <div className="flex items-baseline justify-between text-[13px]">
              <span className="text-text">Fond z banky <span className="text-muted">{formatPct(bank.ter_pct)} + vstup {formatPct(bank.entry_fee_pct)}</span></span>
              <b className="num text-brick" data-out="bankFees">{formatKc(bankCost)}</b>
            </div>
            <span className="mt-1 block h-2.5 rounded-full bg-gradient-to-r from-brick-700 to-brick" />
          </div>
          <div>
            <div className="flex items-baseline justify-between text-[13px]">
              <span className="text-text">ETF dvojče <span className="text-muted"><Term k="TER" /> {formatPct(etf.ter_pct)}</span></span>
              <b className="num text-teal-700" data-out="etfFees">{formatKc(etfCost)}</b>
            </div>
            <span className="mt-1 block h-2.5 rounded-full bg-teal-100">
              <span className="block h-full rounded-full bg-gradient-to-r from-teal-700 to-teal-500 transition-[width] duration-300" style={{ width: `${v.etfBarPct}%` }} />
            </span>
          </div>
        </div>

        <div className="mt-4 text-center">
          <p className="text-[13.5px] text-muted">Na poplatcích ušetříte</p>
          <p className="num font-display text-[clamp(36px,8vw,46px)] leading-none font-bold text-brick" data-out="saved">{formatKc(saved)}</p>
          <p className="mt-1 text-[13px] text-muted">= {formatInt(v.months)} měsíčních vkladů</p>
        </div>

        <button className="btn btn-primary mt-4 w-full" onClick={() => openSheet('calc')} data-cta="calc">
          {unlocked ? 'Otevřít celý přehled' : <>Chci ušetřit {formatKc(v.saved)}</>}
          <ArrowRight />
        </button>
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
