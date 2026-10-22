'use client';

import { useState } from 'react';
import { data, pairByTicker } from '@/lib/data';
import { fmtDate, formatPct, host } from '@/lib/format';
import { track } from '@/lib/track';
import { ArrowDown, ArrowRight, Check, Copy } from '@/components/ui/icons';
import { Term } from '@/components/ui/Term';
import { useLead } from './LeadProvider';

const DIVIDENDS: Record<string, string> = { Acc: 'reinvestuje', Dist: 'vyplácí' };

export function TwinFinder({ compact = false }: { compact?: boolean }) {
  const { selected, select, openSheet, unlocked } = useLead();
  const p = pairByTicker(selected)!;
  const t = p.twin;
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try { await navigator.clipboard.writeText(t.isin); } catch { /* starší prohlížeče: ISIN je vidět vedle */ }
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
    track('isin_copy', { isin: t.isin });
  };

  return (
    <div className="window" data-module="finder">
      <div className="window-bar">
        <span className="window-dots" aria-hidden="true"><i /><i /><i /></span>
        <span className="window-url">etf-dvojcata · vyhledávač dvojčat</span>
      </div>

      <div className="p-4 sm:p-6">
        <h2 id="finder-title" className="mb-3 text-[15px] font-semibold text-ink">Které ETF jste chtěli koupit?</h2>
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:px-0" role="tablist" aria-labelledby="finder-title">
          {data.pairs.map((x) => (
            <button
              key={x.us.ticker}
              role="tab"
              aria-selected={x.us.ticker === selected}
              aria-controls="twin-result"
              className="chip flex-none"
              onClick={() => select(x.us.ticker)}
              data-ticker={x.us.ticker}
            >
              {x.us.ticker}
            </button>
          ))}
        </div>

        <div id="twin-result" role="tabpanel" aria-live="polite" key={selected} className="animate-rise mt-4">
          {/* Americký originál – přeškrtnutý */}
          <div className="flex items-center justify-between gap-3 rounded-2xl border border-dashed border-line bg-paper px-4 py-3">
            <div className="min-w-0">
              <span className="font-mono text-[19px] font-bold text-muted line-through decoration-brick decoration-2">{p.us.ticker}</span>
              <p className="truncate text-[13px] text-muted">{p.us.name} · {p.us.exchange}</p>
            </div>
            <span className="flex-none rounded-full bg-brick-50 px-2.5 py-1 text-[11px] font-semibold tracking-wide text-brick uppercase">V EU nekoupíte</span>
          </div>

          <div className="flex items-center gap-2 py-2 pl-4 text-[13px] font-medium text-teal-700">
            <ArrowDown className="h-4 w-4" /> evropské dvojče
          </div>

          {/* Evropské dvojče */}
          <div className="rounded-2xl border border-teal-200 bg-teal-50 p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <span className="font-mono text-[26px] leading-none font-bold text-ink" data-twin-ticker>{t.ticker}</span>
                {t.aka && <span className="ml-2 text-[12px] text-muted">též {t.aka}</span>}
                <p className="mt-1.5 text-[13.5px] text-muted">{t.name}</p>
              </div>
              <span className="inline-flex flex-none items-center gap-1 rounded-full bg-ok-50 px-2.5 py-1 text-[11px] font-semibold tracking-wide text-ok uppercase">
                <Check className="h-3 w-3" /> {t.form === 'ETC' ? 'ETC' : 'UCITS'} · koupíte
              </span>
            </div>

            <dl className="mt-4 grid grid-cols-3 gap-2 text-[12px] text-muted">
              <div><dt><Term k="TER">Poplatek</Term></dt><dd className="mt-0.5 text-[16px] font-semibold text-ink">{formatPct(t.ter_pct)}</dd></div>
              <div><dt>Burza</dt><dd className="mt-0.5 text-[16px] font-semibold text-ink">{t.exchange}</dd></div>
              <div><dt>{t.distribution === 'Acc' ? <Term k="Acc">Dividendy</Term> : 'Dividendy'}</dt><dd className="mt-0.5 text-[16px] font-semibold text-ink">{DIVIDENDS[t.distribution] ?? '–'}</dd></div>
            </dl>

            <div className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-line bg-white py-2 pr-2 pl-3.5">
              <div className="min-w-0">
                <span className="block text-[11px] text-muted"><Term k="ISIN" /> – zadejte u brokera</span>
                <span className="font-mono text-[15px] font-bold tracking-wide text-ink">{t.isin}</span>
              </div>
              <button type="button" onClick={copy} className="inline-flex min-h-11 flex-none items-center gap-1.5 rounded-lg bg-teal-900 px-3.5 text-[13px] font-semibold text-white transition-colors hover:bg-teal-700 data-[copied]:bg-ok" data-copied={copied || undefined}>
                {copied ? <><Check className="h-4 w-4" /> Zkopírováno</> : <><Copy className="h-4 w-4" /> Kopírovat</>}
              </button>
            </div>
          </div>

          <p className="mt-3 text-[13.5px] leading-relaxed text-text">
            {p.match === 'exact' ? <><b className="font-semibold">Stejný index</b> {t.index}.</> : <><b className="font-semibold">Podobný index</b> – {p.note}</>}
            {!compact && p.alts.length > 0 && <> Další možnosti: {p.alts.map((a, i) => <span key={a.ticker}>{i > 0 && ', '}<span className="font-mono font-bold">{a.ticker}</span> ({formatPct(a.ter_pct)})</span>)}.</>}
          </p>
          <p className="mt-1.5 text-[12px] text-muted">
            Zdroj: <a className="src-link" href={t.source_url} target="_blank" rel="noopener">{host(t.source_url)}</a>, <a className="src-link" href={p.us.source_url} target="_blank" rel="noopener">{host(p.us.source_url)}</a> · {fmtDate(data.as_of)}
          </p>
        </div>

        <button className="btn btn-primary mt-4 w-full" onClick={() => openSheet('finder')} data-cta="finder">
          {unlocked ? 'Otevřít celý přehled' : <>Poslat všech {data.pairs.length} dvojčat do e-mailu</>}
          <ArrowRight />
        </button>
        <p className="mt-2 text-center text-[12.5px] text-muted">Zdarma · 1 pole · přehled hned na obrazovce</p>
      </div>
    </div>
  );
}
