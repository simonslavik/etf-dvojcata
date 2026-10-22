'use client';

import { compare } from '@etfd/shared';
import { data } from '@etfd/shared';
import { formatInt, formatKc, formatPct, yearsLabel } from '@etfd/shared';
import { ArrowRight } from '@/components/ui/icons';
import { Term } from '@/components/ui/Term';
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
      <span className="flex items-baseline justify-between text-[14px] text-muted">
        {label} <output className="text-[18px] font-semibold text-ink">{display}</output>
      </span>
      <input
        type="range" className="range mt-1" min={min} max={max} step={step} value={value} data-in={name}
        style={{ ['--p' as string]: `${((value - min) / (max - min)) * 100}%` }}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </label>
  );
}

export function FeeCalculator({ title }: { title?: string }) {
  const { calc, setCalc, openSheet, unlocked } = useLead();
  const v = feeView(calc.monthly, calc.years);

  return (
    <div className="window" data-module="calc">
      <div className="window-bar">
        <span className="window-dots" aria-hidden="true"><i /><i /><i /></span>
        <span className="window-url">etf-dvojcata · kalkulačka poplatků</span>
      </div>
      <div className="p-4 sm:p-6">
        {title && <h2 className="mb-4 text-[15px] font-semibold text-ink">{title}</h2>}
        <div className="grid gap-4 sm:grid-cols-2 sm:gap-6">
          <Slider name="monthly" label="Měsíčně investuji" value={calc.monthly} min={500} max={30000} step={500} display={formatKc(calc.monthly)} onChange={(m) => setCalc({ ...calc, monthly: m })} />
          <Slider name="years" label="Po dobu" value={calc.years} min={5} max={40} step={1} display={yearsLabel(calc.years)} onChange={(y) => setCalc({ ...calc, years: y })} />
        </div>

        {/* Srovnání nákladů – sloupce jako „trychtýř“ v dashboardu */}
        <div className="mt-5 rounded-2xl border border-line p-4" aria-live="polite">
          <p className="text-[11px] font-semibold tracking-[0.18em] text-muted uppercase">Na poplatcích zaplatíte</p>
          <div className="mt-3 grid grid-cols-[1fr_auto] items-end gap-x-3 gap-y-1.5">
            <span className="text-[13.5px] leading-tight text-text">{bank.label}<span className="block text-[12px] text-muted">{formatPct(bank.ter_pct)} ročně + {formatPct(bank.entry_fee_pct)} vstupní poplatek</span></span>
            <span className="num text-right text-[15px] font-semibold text-brick" data-out="bankFees">{formatKc(v.bankCost)}</span>
            <span className="col-span-2 mb-2.5 h-3 rounded-full bg-gradient-to-r from-brick-700 to-brick" />
            <span className="text-[13.5px] leading-tight text-text">{etf.label}<span className="block text-[12px] text-muted"><Term k="TER" /> {formatPct(etf.ter_pct)} ročně, bez vstupního poplatku</span></span>
            <span className="num text-right text-[15px] font-semibold text-teal-700" data-out="etfFees">{formatKc(v.etfCost)}</span>
            <span className="col-span-2 h-3 rounded-full bg-teal-100">
              <span className="block h-full rounded-full bg-gradient-to-r from-teal-700 to-teal-500 transition-[width] duration-300" style={{ width: `${v.etfBarPct}%` }} />
            </span>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-end justify-between gap-x-4 gap-y-1">
          <p className="text-[14px] text-muted">S ETF dvojčetem ušetříte</p>
          <p className="num font-display text-[clamp(36px,8vw,48px)] leading-none font-bold text-brick" data-out="saved">{formatKc(v.saved)}</p>
        </div>

        {/* Poznámka ve stylu „AI“ řádku z dashboardu Clientela */}
        <p className="mt-4 flex items-start gap-2.5 rounded-xl bg-brick-50 px-3.5 py-3 text-[13.5px] leading-snug text-brick-700">
          <span className="mt-px flex-none rounded-md border border-brick-100 bg-white px-1.5 py-0.5 text-[10px] font-bold tracking-wider text-brick">TIP</span>
          <span>Rozdíl odpovídá <b>{formatInt(v.months)} měsíčním vkladům</b>. Stejný trh, jen jiný „obal“.</span>
        </p>

        <p className="mt-3 text-[11.5px] leading-relaxed text-muted" id="calc-note">
          Příklad fondu z banky: {bank.example} (<a className="src-link" href={bank.source_url} target="_blank" rel="noopener">KID</a>). Výnos trhu {formatPct(annualReturn * 100)} ročně před poplatky, srovnáváme jen náklady. Ilustrace, ne předpověď.
        </p>

        <button className="btn btn-primary mt-4 w-full" onClick={() => openSheet('calc')} data-cta="calc">
          {unlocked ? 'Otevřít celý přehled' : 'Chci přehled levných ETF do e-mailu'}
          <ArrowRight />
        </button>
      </div>
    </div>
  );
}
