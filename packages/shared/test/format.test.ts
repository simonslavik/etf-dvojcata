import { expect, test } from 'vitest';
import { fmtDate, formatKc, formatPct, yearsLabel } from '../src';

test('procenta bez artefaktů plovoucí čárky', () => {
  expect(formatPct(0.07 * 100)).toBe('7 %');
  expect(formatPct(0.0945)).toBe('0,0945 %');
});

test('koruny zaokrouhlené na stovky', () => {
  expect(formatKc(429_149)).toBe('429 100 Kč');
});

test('datum a roky česky', () => {
  expect(fmtDate('2026-10-22')).toBe('22. 10. 2026');
  expect([1, 3, 20].map(yearsLabel)).toEqual(['1 rok', '3 roky', '20 let']);
});
