/**
 * Budoucí hodnota pravidelné měsíční investice po odečtení nákladů.
 * - annualReturn: hrubý roční výnos trhu (např. 0.07)
 * - terPct: roční průběžné náklady fondu v % (TER), strhávají se z majetku
 * - entryFeePct: vstupní poplatek v % z každého vkladu
 */
export interface FvInput { monthly: number; years: number; annualReturn: number; terPct?: number; entryFeePct?: number }

export function futureValue({ monthly, years, annualReturn, terPct = 0, entryFeePct = 0 }: FvInput) {
  const netAnnual = (1 + annualReturn) * (1 - terPct / 100) - 1;
  const r = Math.pow(1 + netAnnual, 1 / 12) - 1;
  const invested = monthly * (1 - entryFeePct / 100);
  let value = 0;
  for (let i = 0; i < years * 12; i++) value = (value + invested) * (1 + r);
  return value;
}

/** Kolik investora stojí náklady fondu = rozdíl proti stejné investici bez nákladů (včetně ušlého zhodnocení). */
export const feeCost = (opts: FvInput) => futureValue({ ...opts, terPct: 0, entryFeePct: 0 }) - futureValue(opts);

interface Fund { ter_pct: number; entry_fee_pct?: number }

export function compare({ monthly, years, annualReturn, bank, etf }: { monthly: number; years: number; annualReturn: number; bank: Fund; etf: Fund }) {
  const bankCost = feeCost({ monthly, years, annualReturn, terPct: bank.ter_pct, entryFeePct: bank.entry_fee_pct });
  const etfCost = feeCost({ monthly, years, annualReturn, terPct: etf.ter_pct });
  return { bankCost, etfCost, saved: bankCost - etfCost, invested: monthly * years * 12 };
}
