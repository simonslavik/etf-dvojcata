import { test } from 'node:test';
import assert from 'node:assert/strict';
import { futureValue, feeCost, compare } from '../src/calc.js';

test('bez výnosu a nákladů je hodnota součtem vkladů', () => {
  assert.equal(Math.round(futureValue({ monthly: 1000, years: 10, annualReturn: 0 })), 120000);
});

test('roční složené úročení odpovídá vzorci pro jednorázový vklad', () => {
  // 12 vkladů po 1000 při 0 % pak 1 rok čekání se nedá snadno – ověříme jednoduchý případ: 1 vklad, 1 měsíc
  const v = futureValue({ monthly: 1000, years: 1 / 12, annualReturn: 0.12 });
  assert.ok(Math.abs(v - 1000 * Math.pow(1.12, 1 / 12)) < 1e-9);
});

test('vstupní poplatek snižuje investovanou částku', () => {
  assert.equal(Math.round(futureValue({ monthly: 1000, years: 1, annualReturn: 0, entryFeePct: 3 })), 11640);
});

test('dražší fond stojí víc a úspora je kladná', () => {
  const r = compare({ monthly: 3000, years: 20, annualReturn: 0.07, bank: { ter_pct: 2, entry_fee_pct: 3 }, etf: { ter_pct: 0.07 } });
  assert.ok(r.bankCost > r.etfCost);
  assert.ok(r.saved > 0);
  assert.equal(r.invested, 720000);
});

test('nulové náklady = nulový feeCost', () => {
  assert.equal(feeCost({ monthly: 1000, years: 5, annualReturn: 0.07 }), 0);
});
