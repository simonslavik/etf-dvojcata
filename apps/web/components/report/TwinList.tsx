'use client';

import { useMemo, useState } from 'react';
import { data, fmtDate, formatPct, host, type Pair } from '@etfd/shared';
import { track } from '@/lib/track';
import { Check, Copy, Search } from '@/components/ui/icons';

const DIST: Record<string, string> = { Acc: 'akumulační – dividendy reinvestuje', Dist: 'distribuční – dividendy vyplácí' };
type Filter = 'all' | 'exact';

function CopyIsin({ isin }: { isin: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try { await navigator.clipboard.writeText(isin); } catch { /* ISIN je vidět vedle */ }
        setDone(true);
        setTimeout(() => setDone(false), 1600);
        track('isin_copy', { isin, from: 'report' });
      }}
      className="inline-flex min-h-9 flex-none items-center gap-1.5 rounded-lg bg-teal-900 px-2.5 text-[12.5px] font-semibold text-white transition-colors hover:bg-teal-700 data-[done]:bg-ok print:hidden"
      data-done={done || undefined}
      aria-label={`Kopírovat ISIN ${isin}`}
    >
      {done ? <><Check className="h-3.5 w-3.5" /> Hotovo</> : <><Copy className="h-3.5 w-3.5" /> Kopírovat</>}
    </button>
  );
}

function Row({ p }: { p: Pair }) {
  const t = p.twin;
  return (
    <li>
      <details className="smooth group rounded-2xl border border-line bg-white transition-colors open:border-teal-200 hover:border-teal-200">
        <summary className="grid cursor-pointer list-none grid-cols-[1fr_auto] items-center gap-x-4 gap-y-2 p-4 sm:grid-cols-[minmax(0,1.4fr)_90px_minmax(0,1.1fr)_20px] sm:p-5 [&::-webkit-details-marker]:hidden">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <span className="font-mono text-[14px] font-bold text-muted line-through decoration-brick/70">{p.us.ticker}</span>
              <span className="text-teal-500" aria-hidden="true">→</span>
              <span className="font-mono text-[19px] font-bold text-ink">{t.ticker}</span>
              <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${p.match === 'exact' ? 'bg-ok-50 text-ok' : 'bg-teal-50 text-teal-700'}`}>{p.match === 'exact' ? 'stejný index' : 'podobný index'}</span>
            </div>
            <p className="mt-0.5 truncate text-[13px] text-muted" title={t.name}>{t.name}</p>
          </div>
          <p className="num text-right text-[15px] font-bold text-ink sm:text-left">
            {formatPct(t.ter_pct)}<span className="block text-[11px] font-normal text-muted">ročně</span>
          </p>
          <div className="col-span-2 flex items-center justify-between gap-2 rounded-xl bg-paper py-1.5 pr-1.5 pl-3 sm:col-span-1">
            <span className="font-mono text-[13.5px] font-bold tracking-wide text-ink">{t.isin}</span>
            <CopyIsin isin={t.isin} />
          </div>
          <span aria-hidden="true" className="hidden text-muted transition-transform duration-300 group-open:rotate-90 sm:block print:hidden">›</span>
        </summary>
        <div className="grid gap-x-8 gap-y-2 border-t border-line px-4 py-4 text-[13.5px] sm:grid-cols-2 sm:px-5">
          <p><span className="text-muted">Index:</span> <span className="text-ink">{t.index}</span></p>
          <p><span className="text-muted">Typ:</span> <span className="text-ink">{t.form} · {DIST[t.distribution] ?? 'bez výnosu'}</span></p>
          <p><span className="text-muted">Burza:</span> <span className="text-ink">{t.exchange}{t.aka ? ` (též ${t.aka})` : ''}</span></p>
          <p><span className="text-muted">Americký originál:</span> <span className="text-ink">{p.us.name}, TER {formatPct(p.us.ter_pct)}</span></p>
          {p.note && <p className="rounded-lg bg-paper px-3 py-2 text-text sm:col-span-2">{p.match === 'exact' ? '' : 'Rozdíl: '}{p.note}</p>}
          {p.alts.length > 0 && (
            <p className="sm:col-span-2"><span className="text-muted">Alternativy:</span> {p.alts.map((a, i) => <span key={a.ticker}>{i > 0 && ' · '}<b className="font-mono text-ink">{a.ticker}</b> {formatPct(a.ter_pct)} <span className="font-mono text-muted">{a.isin}</span></span>)}</p>
          )}
          <p className="text-[12px] text-muted sm:col-span-2">Zdroje: <a className="src-link" href={t.source_url} target="_blank" rel="noopener">{host(t.source_url)}</a>, <a className="src-link" href={p.us.source_url} target="_blank" rel="noopener">{host(p.us.source_url)}</a> · {fmtDate(t.accessed)}</p>
        </div>
      </details>
    </li>
  );
}

/** Seznam všech dvojčat: hledání podle tickeru/názvu, filtr „stejný index“, ISIN ke zkopírování, detaily po rozbalení */
export function TwinList() {
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return data.pairs.filter((p) =>
      (filter === 'all' || p.match === 'exact') &&
      (!needle || [p.us.ticker, p.twin.ticker, p.twin.isin, p.twin.name, p.us.name, p.twin.index].some((x) => x.toLowerCase().includes(needle))));
  }, [q, filter]);

  return (
    <div>
      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center print:hidden">
        <label className="relative flex-1">
          <span className="sr-only">Hledat</span>
          <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-muted" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Hledat ticker nebo název, např. VOO" className="input !min-h-11 !pl-10" />
        </label>
        <div className="flex gap-1.5" role="group" aria-label="Filtr">
          {([['all', `Vše (${data.pairs.length})`], ['exact', `Stejný index (${data.pairs.filter((p) => p.match === 'exact').length})`]] as [Filter, string][]).map(([id, label]) => (
            <button key={id} aria-pressed={filter === id} onClick={() => setFilter(id)} className="chip !min-h-11 !font-sans !text-[13.5px] !font-semibold">{label}</button>
          ))}
        </div>
      </div>
      <ul className="mt-3 space-y-2">
        {rows.map((p) => <Row key={p.us.ticker} p={p} />)}
      </ul>
      {!rows.length && <p className="mt-4 rounded-2xl bg-white p-5 text-center text-[14.5px] text-muted">Nic jsme nenašli. Zkuste jiný ticker – v přehledu jsou ETF z burzy NYSE.</p>}
      <p className="mt-3 text-[13px] text-muted">Klepnutím na řádek zobrazíte index, typ fondu, alternativy a zdroje.</p>
    </div>
  );
}
