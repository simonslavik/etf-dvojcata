/**
 * Skóre a fáze leadu. Čisté funkce – stejná pravidla používá API (po každé změně leadu)
 * i dashboard (vysvětlení „proč má lead 45 bodů“).
 */
export const MONTHLY_BANDS = {
  '0': { label: 'Zatím nic', points: 0 },
  lt2k: { label: 'do 2 000 Kč', points: 10 },
  '2-10k': { label: '2–10 tis. Kč', points: 25 },
  gt10k: { label: 'nad 10 tis. Kč', points: 40 },
} as const;
export type MonthlyBand = keyof typeof MONTHLY_BANDS;
export const isMonthlyBand = (v: unknown): v is MonthlyBand => typeof v === 'string' && v in MONTHLY_BANDS;

/** Body za chování v relaci a v e-mailech – každá událost se počítá jednou */
export const SIGNAL_POINTS: Record<string, { points: number; label: string }> = {
  calc_change: { points: 5, label: 'Počítal poplatky' },
  isin_copy: { points: 10, label: 'Zkopíroval ISIN' },
  report_open: { points: 5, label: 'Otevřel přehled' },
  email_click: { points: 10, label: 'Klikl v e-mailu' },
};

export const BASE_POINTS = 10;
export const CALL_POINTS = 30;
export const QUALIFIED_AT = 35;

export interface ScoreInput { monthlyBand: string | null; wantsCall: boolean; signals: Iterable<string> }

export function scoreLead({ monthlyBand, wantsCall, signals }: ScoreInput) {
  const reasons: { label: string; points: number }[] = [{ label: 'Nechal e-mail', points: BASE_POINTS }];
  if (isMonthlyBand(monthlyBand) && MONTHLY_BANDS[monthlyBand].points) {
    reasons.push({ label: `Investuje ${MONTHLY_BANDS[monthlyBand].label} měsíčně`, points: MONTHLY_BANDS[monthlyBand].points });
  }
  for (const s of new Set(signals)) if (SIGNAL_POINTS[s]) reasons.push(SIGNAL_POINTS[s]);
  if (wantsCall) reasons.push({ label: 'Chce pomoct s nákupem (telefon)', points: CALL_POINTS });
  return { score: reasons.reduce((a, r) => a + r.points, 0), reasons };
}

export const STAGES = ['lead', 'qualified', 'handed_over', 'unsubscribed'] as const;
export type Stage = (typeof STAGES)[number];
export const STAGE_LABEL: Record<Stage, string> = {
  lead: 'Lead', qualified: 'Kvalifikovaný', handed_over: 'Předaný', unsubscribed: 'Odhlášený',
};

export function stageFor({ score, handedOver, unsubscribed }: { score: number; handedOver: boolean; unsubscribed: boolean }): Stage {
  if (unsubscribed) return 'unsubscribed';
  if (handedOver) return 'handed_over';
  return score >= QUALIFIED_AT ? 'qualified' : 'lead';
}
