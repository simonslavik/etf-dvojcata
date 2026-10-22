import { describe, expect, test } from 'vitest';
import { compare, feeCost, futureValue } from '../src';
import { data } from '../src';

describe('kalkulačka poplatků', () => {
  test('bez výnosu a nákladů je hodnota součtem vkladů', () => {
    expect(Math.round(futureValue({ monthly: 1000, years: 10, annualReturn: 0 }))).toBe(120000);
  });

  test('jeden měsíční vklad se zhodnotí o měsíční ekvivalent ročního výnosu', () => {
    const v = futureValue({ monthly: 1000, years: 1 / 12, annualReturn: 0.12 });
    expect(v).toBeCloseTo(1000 * Math.pow(1.12, 1 / 12), 9);
  });

  test('vstupní poplatek snižuje investovanou částku', () => {
    expect(Math.round(futureValue({ monthly: 1000, years: 1, annualReturn: 0, entryFeePct: 3 }))).toBe(11640);
  });

  test('dražší fond stojí víc a úspora je kladná', () => {
    const r = compare({ monthly: 3000, years: 20, annualReturn: 0.07, bank: { ter_pct: 2, entry_fee_pct: 3 }, etf: { ter_pct: 0.07 } });
    expect(r.bankCost).toBeGreaterThan(r.etfCost);
    expect(r.saved).toBeGreaterThan(0);
    expect(r.invested).toBe(720000);
  });

  test('nulové náklady = nulový feeCost', () => {
    expect(feeCost({ monthly: 1000, years: 5, annualReturn: 0.07 })).toBe(0);
  });

  test('čísla v reklamě B odpovídají kalkulačce (3 000 Kč, 20 let, data z KID)', () => {
    const r = compare({ monthly: 3000, years: 20, annualReturn: data.calc.annual_return, bank: data.calc.bank, etf: data.calc.etf });
    expect(Math.round(r.saved / 100) * 100).toBe(429100);
  });
});
