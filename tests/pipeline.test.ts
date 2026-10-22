import { describe, expect, test } from 'vitest';
import { QUALIFIED_AT, scoreLead, stageFor } from '@/lib/pipeline/score';
import { scheduleFor, SEQUENCE } from '@/lib/pipeline/sequence';
import { normalizePhone } from '@/lib/phone';

describe('skóre leadu', () => {
  test('samotný e-mail = základních 10 bodů, fáze lead', () => {
    const s = scoreLead({ monthlyBand: null, wantsCall: false, signals: [] });
    expect(s.score).toBe(10);
    expect(stageFor({ score: s.score, handedOver: false, unsubscribed: false })).toBe('lead');
  });

  test('investuje 2–10 tis. → kvalifikovaný', () => {
    const s = scoreLead({ monthlyBand: '2-10k', wantsCall: false, signals: [] });
    expect(s.score).toBeGreaterThanOrEqual(QUALIFIED_AT);
    expect(stageFor({ score: s.score, handedOver: false, unsubscribed: false })).toBe('qualified');
  });

  test('chování v relaci se počítá jednou a neznámé události se ignorují', () => {
    const s = scoreLead({ monthlyBand: 'lt2k', wantsCall: false, signals: ['isin_copy', 'isin_copy', 'calc_change', 'page_view'] });
    expect(s.score).toBe(10 + 10 + 10 + 5);
    expect(s.reasons.map((r) => r.label)).toContain('Zkopíroval ISIN');
  });

  test('neplatné pásmo nepřidá body', () => {
    expect(scoreLead({ monthlyBand: 'milion', wantsCall: false, signals: [] }).score).toBe(10);
  });

  test('předání a odhlášení mají přednost před skóre', () => {
    expect(stageFor({ score: 5, handedOver: true, unsubscribed: false })).toBe('handed_over');
    expect(stageFor({ score: 90, handedOver: true, unsubscribed: true })).toBe('unsubscribed');
  });
});

describe('e-mailová sekvence', () => {
  test('krok 0 hned, další po dnech podle SEQUENCE', () => {
    const t0 = new Date('2026-10-22T10:00:00Z');
    const plan = scheduleFor(t0);
    expect(plan.map((p) => p.step)).toEqual(SEQUENCE.map((s) => s.step));
    expect(plan[0].sendAt.getTime()).toBe(t0.getTime());
    expect(plan.at(-1)!.sendAt.toISOString()).toBe('2026-10-31T10:00:00.000Z');
  });
});

describe('telefon', () => {
  test.each([
    ['777 123 456', '+420777123456'],
    ['+420 777-123-456', '+420777123456'],
    ['00420777123456', '+420777123456'],
  ])('%s → %s', (input, out) => expect(normalizePhone(input)).toBe(out));

  test.each(['12', '077712345', '777 123 45', '+421 777 123 456'])('%s je neplatné', (input) => expect(normalizePhone(input)).toBeNull());
});
