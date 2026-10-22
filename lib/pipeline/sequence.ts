/* E-mailová péče: krok 0 odchází hned po odeslání formuláře, ostatní posílá denní cron. */
export const SEQUENCE = [
  { step: 'd0_report', day: 0, subject: 'Vaše ETF dvojčata – přehled' },
  { step: 'd2_howto', day: 2, subject: 'Jak koupit ETF dvojče za 3 minuty' },
  { step: 'd5_tax', day: 5, subject: 'Daně z ETF v Česku: 3 pravidla, která stačí znát' },
  { step: 'd9_check', day: 9, subject: 'Už máte první ETF? (a jedna nabídka)' },
] as const;
export type SequenceStep = (typeof SEQUENCE)[number]['step'];

export function scheduleFor(created: Date) {
  return SEQUENCE.map((s) => ({ step: s.step as SequenceStep, sendAt: new Date(created.getTime() + s.day * 86_400_000) }));
}
