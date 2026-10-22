import { describe, expect, test } from 'vitest';
import { consentRecord, CONSENTS } from '@/lib/consent';
import { timingSafeEqual } from '@/lib/server/auth';
import { sameOriginUrl } from '@/lib/server/http';

const O = 'https://etf-dvojcata.cz';

describe('přesměrování z e-mailu zůstane na webu', () => {
  test.each(['//evil.com', '/\\evil.com', '/\t/evil.com', '/\n/evil.com', 'https://evil.com', 'javascript:alert(1)', '%2F%2Fevil.com'])('%j → hlavní stránka nebo vlastní origin', (to) => {
    expect(sameOriginUrl(to, O).origin).toBe(O);
  });
  test('vlastní cesta projde i s parametry', () => {
    expect(sameOriginUrl('/pomoc?t=abc#x', O).href).toBe(`${O}/pomoc?t=abc#x`);
  });
});

test('porovnání tokenu', () => {
  expect(timingSafeEqual('abc', 'abc')).toBe(true);
  expect(timingSafeEqual('abc', 'abd')).toBe(false);
  expect(timingSafeEqual('abc', 'abcd')).toBe(false);
});

test('souhlas se ukládá v kanonickém znění podle verze', () => {
  expect(consentRecord('call_v1')).toBe(`call_v1: ${CONSENTS.call_v1}`);
  expect(consentRecord('cokoli jiného')).toBeNull();
});
