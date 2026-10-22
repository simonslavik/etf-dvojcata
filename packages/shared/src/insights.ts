/* Postřehy pro dashboard – jednoduchá pravidla, žádné LLM. Čisté funkce (testované). */
import { FUNNEL } from './events';

type Counts = Record<string, number>;
const MIN_VISITS = 30;
const pct = (x: number) => `${(x * 100).toLocaleString('cs-CZ', { maximumFractionDigits: 1 })} %`;

/** Dvouvýběrový z-test podílů (konverze A vs. B) */
export function zTest(convA: number, nA: number, convB: number, nB: number) {
  const pA = convA / nA, pB = convB / nB, p = (convA + convB) / (nA + nB);
  const se = Math.sqrt(p * (1 - p) * (1 / nA + 1 / nB));
  return se ? (pA - pB) / se : 0;
}

/** Krok s největším relativním únikem cestou k leadu (kroky po leadu jsou nepovinné, únik tam je žádoucí filtr) */
export function biggestDrop(c: Counts) {
  let worst: { from: string; to: string; loss: number } | null = null;
  const end = FUNNEL.findIndex((s) => s.key === 'lead');
  for (let i = 1; i <= end; i++) {
    const a = c[FUNNEL[i - 1].key], b = c[FUNNEL[i].key];
    if (a < 10) continue;
    const loss = 1 - b / a;
    if (!worst || loss > worst.loss) worst = { from: FUNNEL[i - 1].label, to: FUNNEL[i].label, loss };
  }
  return worst;
}

export function insights(all: Counts, a: Counts, b: Counts): string[] {
  const out: string[] = [];
  if (all.visit < MIN_VISITS) return [`Zatím ${all.visit} návštěv – pro závěry je potřeba aspoň ${MIN_VISITS}.`];
  const drop = biggestDrop(all);
  if (drop) out.push(`Největší únik: ${drop.from} → ${drop.to} (ztráta ${pct(drop.loss)}). Tady má optimalizace největší páku.`);
  if (a.visit >= MIN_VISITS && b.visit >= MIN_VISITS) {
    const rA = a.lead / a.visit, rB = b.lead / b.visit;
    const z = zTest(a.lead, a.visit, b.lead, b.visit);
    const better = rA >= rB ? 'A · Dvojče' : 'B · Poplatky';
    out.push(`Konverze na lead: A ${pct(rA)} vs. B ${pct(rB)} – ${Math.abs(z) >= 1.96 ? `${better} vede statisticky významně (|z| = ${Math.abs(z).toFixed(1)})` : 'rozdíl zatím není statisticky významný'}.`);
  } else {
    out.push(`Srovnání variant A/B čeká na ${MIN_VISITS} návštěv v každé variantě.`);
  }
  return out;
}
