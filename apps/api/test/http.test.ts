import { describe, expect, test } from 'vitest';
import { consentRecord, CONSENTS } from '@etfd/shared';
import { csvCell, sameOriginUrl, timingSafeEqual } from '../src/common/http.js';

const O = 'https://etf-dvojcata.cz';

describe('přesměrování z e-mailu zůstane na webu', () => {
  test.each(['//evil.com', '/\\evil.com', '/\t/evil.com', '/\n/evil.com', 'https://evil.com', 'javascript:alert(1)', '%2F%2Fevil.com'])('%j → vlastní origin', (to) => {
    expect(sameOriginUrl(to, O).origin).toBe(O);
  });
  test('vlastní cesta projde i s parametry', () => {
    expect(sameOriginUrl('/help?t=abc#x', O).href).toBe(`${O}/help?t=abc#x`);
  });
});

test('porovnání tokenu', () => {
  expect(timingSafeEqual('abc', 'abc')).toBe(true);
  expect(timingSafeEqual('abc', 'abd')).toBe(false);
  expect(timingSafeEqual('abc', 'abcd')).toBe(false);
});

test('CSV: vzorce neutralizované, telefon zůstane číslem', () => {
  expect(csvCell('=HYPERLINK("x")')).toBe(`"'=HYPERLINK(""x"")"`);
  expect(csvCell('+420777123456')).toBe('"+420777123456"');
  expect(csvCell(null)).toBe('""');
});

test('souhlas se ukládá v kanonickém znění podle verze', () => {
  expect(consentRecord('call_v1')).toBe(`call_v1: ${CONSENTS.call_v1}`);
  expect(consentRecord('cokoli jiného')).toBeNull();
});
