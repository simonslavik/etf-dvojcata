import type { Metadata } from 'next';
import { data } from '@/lib/data';
import { HOW_TO_BUY, Src, TAX } from '@/lib/content';
import { fmtDate, formatPct, host } from '@/lib/format';
import { Shell } from '@/components/Shell';
import { PrintButton } from '@/components/PrintButton';
import { TrackView } from '@/components/TrackView';

export const metadata: Metadata = { title: `Přehled ${data.pairs.length} ETF dvojčat`, robots: { index: false } };

const DIST: Record<string, string> = { Acc: 'akumulační', Dist: 'distribuční' };

export default function Report() {
  return (
    <Shell action={<PrintButton />}>
      <TrackView event="report_view" />
      <p className="eyebrow">Data k {fmtDate(data.as_of)}</p>
      <h1 className="mt-3 font-display text-[clamp(32px,5vw,52px)] leading-[1.05] font-bold text-ink">Přehled {data.pairs.length} ETF dvojčat</h1>
      <p className="mt-4 max-w-[40em] text-[17px] leading-relaxed text-muted">Americká ETF z burzy NYSE a jejich evropské verze, které si jako investor z Česka koupíte. ISIN zkopírujte do vyhledávání ve své aplikaci.</p>

      <h2 className="h2 mt-12 !text-[28px]">Jak dvojče koupit</h2>
      <ol className="mt-5 grid gap-3 sm:grid-cols-3">
        {HOW_TO_BUY.map((s, i) => (
          <li key={s.t} className="card p-5 shadow-none">
            <span className="font-display text-[28px] font-bold text-teal-200">0{i + 1}</span>
            <p className="mt-2 font-semibold text-ink">{s.t}</p>
            <p className="mt-1 text-[14.5px] text-muted">{s.d}</p>
          </li>
        ))}
      </ol>

      <h2 className="h2 mt-12 !text-[28px]">Všechna dvojčata</h2>
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        {data.pairs.map((p) => (
          <article key={p.us.ticker} className="card break-inside-avoid p-5 shadow-none">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono font-bold text-muted line-through decoration-brick/70">{p.us.ticker}</span>
              <span className="text-teal-500">→</span>
              <span className="font-mono text-[20px] font-bold text-ink">{p.twin.ticker}</span>
              {p.twin.aka && <span className="text-[12px] text-muted">též {p.twin.aka}</span>}
              <span className={`ml-auto rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-wide uppercase ${p.match === 'exact' ? 'bg-ok-50 text-ok' : 'bg-teal-50 text-teal-700'}`}>{p.match === 'exact' ? 'stejný index' : 'podobný index'}</span>
            </div>
            <p className="mt-1 text-[14px] text-muted">{p.twin.name}</p>
            <dl className="num mt-4 grid grid-cols-2 gap-3 text-[13px]">
              <div><dt className="text-muted">ISIN</dt><dd className="font-mono font-bold text-ink">{p.twin.isin}</dd></div>
              <div><dt className="text-muted">TER dvojče / USA</dt><dd className="font-semibold text-ink">{formatPct(p.twin.ter_pct)} / {formatPct(p.us.ter_pct)}</dd></div>
              <div><dt className="text-muted">Typ</dt><dd className="text-ink">{p.twin.form} · {DIST[p.twin.distribution] ?? 'bez výnosu'}</dd></div>
              <div><dt className="text-muted">Index</dt><dd className="text-ink">{p.twin.index}</dd></div>
            </dl>
            {p.note && <p className="mt-3 rounded-xl bg-paper px-3 py-2 text-[13.5px] text-text">{p.match === 'exact' ? '' : 'Rozdíl: '}{p.note}</p>}
            {p.alts.length > 0 && <p className="mt-3 text-[13px] text-muted">Alternativy: {p.alts.map((a, i) => <span key={a.ticker}>{i > 0 && ' · '}<b className="text-ink">{a.ticker}</b> {formatPct(a.ter_pct)} ({a.isin})</span>)}</p>}
            <p className="mt-3 text-[12px] text-muted">Zdroje: <a className="src-link" href={p.twin.source_url} target="_blank" rel="noopener">{host(p.twin.source_url)}</a>, <a className="src-link" href={p.us.source_url} target="_blank" rel="noopener">{host(p.us.source_url)}</a> · {fmtDate(p.twin.accessed)}</p>
          </article>
        ))}
      </div>

      <h2 id="dane" className="h2 mt-12 !text-[28px]">Daně v Česku stručně</h2>
      <ol className="mt-5 space-y-3">
        {TAX.map((x) => (
          <li key={x.t} className="card p-5 text-[15px] leading-relaxed text-text shadow-none"><b className="text-ink">{x.t}.</b> {x.f.cs}<Src f={x.f} /></li>
        ))}
      </ol>
      <p className="mt-3 text-[13.5px] text-muted">Zjednodušeno pro fyzické osoby, které neobchodují v rámci podnikání. U vlastní situace se poraďte s daňovým poradcem.</p>

      <h2 className="h2 mt-12 !text-[28px]">Co v přehledu není</h2>
      <p className="mt-3 text-[15px] text-muted">{data.excluded.map((e) => e.ticker).join(', ')} – obchodují se na burze Nasdaq, ne na NYSE. Údaje jsou orientační, před nákupem si je ověřte v dokumentu KID u svého brokera. Nejde o investiční doporučení.</p>
    </Shell>
  );
}
