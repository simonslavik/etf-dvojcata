const kc = new Intl.NumberFormat('cs-CZ', { maximumFractionDigits: 0 });

/** Zaokrouhleno na stovky – víc přesnosti by u 20leté projekce jen předstíralo jistotu */
export const formatKc = (n: number) => `${kc.format(Math.round(n / 100) * 100)} Kč`;
export const formatInt = (n: number) => kc.format(n);
/** Přesně na koruny (náklad na lead, útrata) */
export const formatKcExact = (n: number) => `${kc.format(Math.round(n))}\u00a0Kč`;
/** Zaokrouhlení přes toFixed brání artefaktům typu 7,000000000000001 % */
/** Podíl 0–1 jako procenta s jedním desetinným místem (konverze, únik v trychtýři) */
export const formatShare = (x: number) => `${(x * 100).toLocaleString('cs-CZ', { maximumFractionDigits: 1 })}\u00a0%`;
export const formatPct = (n: number) => `${Number(Number(n).toFixed(4)).toLocaleString('cs-CZ', { maximumFractionDigits: 4 })} %`;
export const fmtDate = (iso: string) => {
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number);
  return `${d}. ${m}. ${y}`;
};
export const host = (u: string) => {
  try {
    return new URL(u).hostname.replace(/^www\./, '');
  } catch {
    return u;
  }
};
export const yearsLabel = (n: number) => `${n} ${n === 1 ? 'rok' : n < 5 ? 'roky' : 'let'}`;
