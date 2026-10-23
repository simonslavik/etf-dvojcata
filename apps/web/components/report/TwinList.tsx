'use client';

import { useMemo, useState } from 'react';
import { data, fmtDate, formatPct, host, type Pair } from '@etfd/shared';
import { CopyIsinButton } from '@/components/ui/CopyIsinButton';
import { ChevronDown, Search } from '@/components/ui/icons';

const DIST: Record<string, string> = { Acc: 'Akumulační', Dist: 'Distribuční' };
const DIST_HINT: Record<string, string> = { Acc: 'dividendy reinvestuje', Dist: 'dividendy vyplácí' };
type Filter = 'all' | 'exact';

const fundSize = (m: number | null) =>
  m == null
    ? '–'
    : m >= 1000
      ? `${(m / 1000).toLocaleString('cs-CZ', { maximumFractionDigits: 1 })} mld. €`
      : `${m.toLocaleString('cs-CZ')} mil. €`;

function Fact({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-xl bg-paper px-3 py-2.5">
      <dt className="text-[11.5px] text-muted">{label}</dt>
      <dd className="mt-0.5 text-[14px] leading-snug font-semibold text-ink">
        {value}
        {hint && <span className="block text-[12px] font-normal text-muted">{hint}</span>}
      </dd>
    </div>
  );
}

function Row({ p }: { p: Pair }) {
  const t = p.twin;
  const sources = [...new Map([t.source_url, p.us.source_url].map((u) => [host(u), u])).entries()];
  return (
    <li>
      <details className="smooth group rounded-2xl border border-line bg-white transition-[border-color,box-shadow] open:border-teal-200 open:shadow-card hover:border-teal-200">
        <summary className="grid cursor-pointer list-none grid-cols-[1fr_auto] items-center gap-x-4 gap-y-3 rounded-2xl p-4 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-teal-500/50 sm:grid-cols-[minmax(0,1.4fr)_96px_minmax(0,1.15fr)_32px] sm:p-5 [&::-webkit-details-marker]:hidden">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <span className="font-mono text-[14px] font-bold text-muted line-through decoration-brick/70">{p.us.ticker}</span>
              <span className="text-teal-500" aria-hidden="true">
                →
              </span>
              <span className="font-mono text-[19px] font-bold text-ink">{t.ticker}</span>
              <span
                className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${p.match === 'exact' ? 'bg-ok-50 text-ok' : 'bg-teal-50 text-teal-700'}`}
              >
                {p.match === 'exact' ? 'stejný index' : 'podobný index'}
              </span>
            </div>
            <p className="mt-0.5 truncate text-[13px] text-muted" title={t.name}>
              {t.name}
            </p>
          </div>
          <p className="num text-right text-[15px] font-bold text-ink sm:text-left">
            {formatPct(t.ter_pct)}
            <span className="block text-[11px] font-normal text-muted">poplatek ročně</span>
          </p>
          <div className="col-span-2 flex items-center justify-between gap-2 rounded-xl bg-paper py-1.5 pr-1.5 pl-3 sm:col-span-1">
            <span className="min-w-0">
              <span className="block text-[10.5px] text-muted">ISIN</span>
              <span className="font-mono text-[13.5px] font-bold tracking-wide text-ink">{t.isin}</span>
            </span>
            <CopyIsinButton isin={t.isin} from="report" size="sm" />
          </div>
          <span
            aria-hidden="true"
            className="col-span-2 flex items-center justify-center gap-1 text-[12.5px] font-medium text-teal-700 sm:col-span-1 sm:h-8 sm:w-8 sm:justify-self-end sm:rounded-full sm:border sm:border-line sm:text-muted sm:group-hover:border-teal-300 sm:group-hover:text-teal-700 print:hidden"
          >
            <span className="sm:hidden">
              <span className="group-open:hidden">Zobrazit detaily</span>
              <span className="hidden group-open:inline">Skrýt detaily</span>
            </span>
            <ChevronDown className="h-4 w-4 transition-transform duration-300 group-open:rotate-180" />
          </span>
        </summary>

        <div className="space-y-4 border-t border-line px-4 py-4 sm:px-5">
          <dl className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Fact label="Sleduje index" value={t.index} />
            <Fact label="Typ fondu" value={`${t.form} · ${DIST[t.distribution] ?? 'bez výnosu'}`} hint={DIST_HINT[t.distribution]} />
            <Fact label="Kde koupit" value={t.exchange} hint={t.aka ? `též ${t.aka}` : undefined} />
            <Fact label="Velikost fondu" value={fundSize(t.size_eur_m)} hint={`sídlo ${t.domicile}`} />
          </dl>

          <p className="text-[13.5px] text-text">
            <span className="text-muted">Místo:</span> <b className="font-mono text-ink">{p.us.ticker}</b> {p.us.name} · TER{' '}
            {formatPct(p.us.ter_pct)} · {p.us.exchange}
          </p>

          {p.note && (
            <p className="rounded-xl border border-teal-100 bg-teal-50/60 px-3.5 py-2.5 text-[13.5px] leading-snug text-text">
              {p.match === 'exact' ? '' : <b className="text-ink">Rozdíl: </b>}
              {p.note}
            </p>
          )}

          {p.alts.length > 0 && (
            <div>
              <p className="mb-1.5 text-[12px] font-semibold tracking-wide text-muted uppercase">Další možnosti</p>
              <ul className="divide-y divide-line rounded-xl border border-line">
                {p.alts.map((a) => (
                  <li key={a.isin} className="flex flex-wrap items-center gap-x-3 gap-y-1.5 px-3 py-2.5">
                    <b className="font-mono text-[13.5px] text-ink sm:w-[92px] sm:flex-none">{a.ticker.replace(' / ', ' · ')}</b>
                    <span className="hidden min-w-0 flex-1 truncate text-[13px] text-muted sm:block" title={a.name}>
                      {a.name}
                    </span>
                    <span className="num ml-auto text-[13px] font-semibold text-ink sm:ml-0">{formatPct(a.ter_pct)}</span>
                    <span className="flex w-full items-center justify-between gap-2 sm:w-auto">
                      <span className="font-mono text-[12.5px] text-muted">{a.isin}</span>
                      <CopyIsinButton isin={a.isin} from="report_alt" size="xs" />
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <p className="text-[12px] text-muted">
            Ověřeno {fmtDate(t.accessed)} ·{' '}
            {sources.map(([h, u], i) => (
              <span key={u}>
                {i > 0 && ', '}
                <a className="src-link" href={u} target="_blank" rel="noopener">
                  {h}
                </a>
              </span>
            ))}
          </p>
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
    return data.pairs.filter(
      (p) =>
        (filter === 'all' || p.match === 'exact') &&
        (!needle ||
          [p.us.ticker, p.twin.ticker, p.twin.isin, p.twin.name, p.us.name, p.twin.index].some((x) => x.toLowerCase().includes(needle))),
    );
  }, [q, filter]);

  return (
    <div>
      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center print:hidden">
        <label className="relative flex-1">
          <span className="sr-only">Hledat</span>
          <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Hledat ticker nebo název, např. VOO"
            className="input !min-h-11 !pl-10"
          />
        </label>
        <div className="flex gap-1.5" role="group" aria-label="Filtr">
          {(
            [
              ['all', `Vše (${data.pairs.length})`],
              ['exact', `Stejný index (${data.pairs.filter((p) => p.match === 'exact').length})`],
            ] as [Filter, string][]
          ).map(([id, label]) => (
            <button
              key={id}
              aria-pressed={filter === id}
              onClick={() => setFilter(id)}
              className="chip !min-h-11 !font-sans !text-[13.5px] !font-semibold"
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      <ul className="mt-3 space-y-2">
        {rows.map((p) => (
          <Row key={p.us.ticker} p={p} />
        ))}
      </ul>
      {!rows.length && (
        <p className="mt-4 rounded-2xl bg-white p-5 text-center text-[14.5px] text-muted">
          Nic jsme nenašli. Zkuste jiný ticker – v přehledu jsou ETF z burzy NYSE.
        </p>
      )}
      <p className="mt-3 text-[13px] text-muted">Klepnutím na kartu zobrazíte index, typ fondu, velikost, další možnosti a zdroje.</p>
    </div>
  );
}
