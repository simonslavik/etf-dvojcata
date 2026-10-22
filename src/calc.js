/**
 * Budoucí hodnota pravidelné měsíční investice po odečtení nákladů.
 * - annualReturn: hrubý roční výnos trhu (např. 0.07)
 * - terPct: roční průběžné náklady fondu v % (TER), strhávají se z majetku
 * - entryFeePct: vstupní poplatek v % z každého vkladu
 */
export function futureValue({ monthly, years, annualReturn, terPct = 0, entryFeePct = 0 }) {
  const netAnnual = (1 + annualReturn) * (1 - terPct / 100) - 1;
  const r = Math.pow(1 + netAnnual, 1 / 12) - 1;
  const invested = monthly * (1 - entryFeePct / 100);
  let value = 0;
  for (let i = 0; i < years * 12; i++) value = (value + invested) * (1 + r);
  return value;
}

/** Kolik investora stojí náklady fondu = rozdíl proti stejné investici bez nákladů (včetně ušlého zhodnocení). */
export function feeCost(opts) {
  return futureValue({ ...opts, terPct: 0, entryFeePct: 0 }) - futureValue(opts);
}

export function compare({ monthly, years, annualReturn, bank, etf }) {
  const bankCost = feeCost({ monthly, years, annualReturn, terPct: bank.ter_pct, entryFeePct: bank.entry_fee_pct });
  const etfCost = feeCost({ monthly, years, annualReturn, terPct: etf.ter_pct, entryFeePct: 0 });
  return { bankCost, etfCost, saved: bankCost - etfCost, invested: monthly * years * 12 };
}

const kc = new Intl.NumberFormat('cs-CZ', { maximumFractionDigits: 0 });
export const formatKc = (n) => `${kc.format(Math.round(n / 100) * 100)} Kč`;
export const formatPct = (n) => `${Number(n).toLocaleString('cs-CZ', { maximumFractionDigits: 4 })}\u00a0%`;
