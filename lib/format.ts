const kc = new Intl.NumberFormat('cs-CZ', { maximumFractionDigits: 0 });

/** Zaokrouhleno na stovky – víc přesnosti by u 20leté projekce jen předstíralo jistotu */
export const formatKc = (n: number) => `${kc.format(Math.round(n / 100) * 100)} Kč`;
export const formatInt = (n: number) => kc.format(n);
/** Zaokrouhlení přes toFixed brání artefaktům typu 7,000000000000001 % */
export const formatPct = (n: number) => `${Number(Number(n).toFixed(4)).toLocaleString('cs-CZ', { maximumFractionDigits: 4 })} %`;
export const fmtDate = (iso: string) => { const [y, m, d] = iso.slice(0, 10).split('-').map(Number); return `${d}. ${m}. ${y}`; };
export const host = (u: string) => { try { return new URL(u).hostname.replace(/^www\./, ''); } catch { return u; } };
export const yearsLabel = (n: number) => `${n} ${n === 1 ? 'rok' : n < 5 ? 'roky' : 'let'}`;
