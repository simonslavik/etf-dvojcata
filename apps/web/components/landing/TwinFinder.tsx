'use client';

import { useState } from 'react';
import { data, formatPct, host, pairByTicker } from '@etfd/shared';
import { track } from '@/lib/track';
import { ArrowRight, Check, Copy } from '@/components/ui/icons';
import { Term } from '@/components/ui/Term';
import { useLead } from './LeadProvider';

/**
 * Vyhledávač dvojčat – jen to, co návštěvník potřebuje k rozhodnutí: co místo amerického ETF koupit,
 * kolik stojí, kde se obchoduje a ISIN do aplikace. Detaily (alternativy, dividendy, index) jsou v přehledu.
 */
export function TwinFinder() {
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
    <div className="card overflow-hidden" data-module="finder">
      <div className="p-4 sm:p-5">
        <p id="finder-title" className="text-[14px] font-medium text-muted">Které ETF jste chtěli koupit?</p>
        {/* jeden posuvný řádek tickerů místo dvou řádků */}
        <div className="-mx-4 mt-2.5 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:-mx-5 sm:px-5 [&::-webkit-scrollbar]:hidden" role="group" aria-labelledby="finder-title">
          {data.pairs.map((x) => (
            <button
              key={x.us.ticker}
              aria-pressed={x.us.ticker === selected}
              aria-controls="twin-result"
              className="chip flex-none !min-h-10 !px-3.5"
              onClick={() => select(x.us.ticker)}
              data-ticker={x.us.ticker}
            >
              {x.us.ticker}
            </button>
          ))}
        </div>

        <div id="twin-result" aria-live="polite" className="mt-3">
          <div key={selected} className="animate-rise rounded-2xl border border-teal-200 bg-teal-50 p-4">
            <p className="text-[13.5px] text-muted">
              Místo <span className="strike font-mono font-bold text-ink">{p.us.ticker}</span> <span className="text-brick">(v EU nekoupíte)</span> kupte:
            </p>
            <div className="mt-1.5 flex items-center justify-between gap-3">
              <span className="animate-rise-late font-mono text-[30px] leading-none font-bold text-ink" data-twin-ticker>{t.ticker}</span>
              <span className={`inline-flex flex-none items-center gap-1 rounded-full px-2.5 py-1 text-[11.5px] font-semibold ${p.match === 'exact' ? 'bg-ok-50 text-ok' : 'bg-white text-teal-700'}`}>
                <Check className="h-3.5 w-3.5" /> {p.match === 'exact' ? 'Stejný index' : 'Podobný index'}
              </span>
            </div>
            <p className="mt-1 truncate text-[13px] text-muted" title={t.name}>{t.name}</p>

            <div className="mt-3 flex gap-6 text-[13px] text-muted">
              <span><Term k="TER">Poplatek</Term> <b className="num text-[15px] text-ink">{formatPct(t.ter_pct)}</b></span>
              <span>Burza <b className="text-[15px] text-ink">{t.exchange}</b></span>
            </div>

            <div className="mt-3 flex items-center justify-between gap-3 rounded-xl border border-line bg-white py-1.5 pr-1.5 pl-3.5">
              <div className="min-w-0">
                <span className="block text-[11px] text-muted"><Term k="ISIN" /> do aplikace brokera</span>
                <span className="font-mono text-[15px] font-bold tracking-wide text-ink">{t.isin}</span>
              </div>
              <button type="button" onClick={copy} data-copy-isin className="inline-flex min-h-10 flex-none items-center gap-1.5 rounded-lg bg-teal-900 px-3 text-[13px] font-semibold text-white transition-colors hover:bg-teal-700 data-[copied]:bg-ok" data-copied={copied || undefined}>
                {copied ? <span className="animate-pop inline-flex items-center gap-1.5"><Check className="h-4 w-4" /> Zkopírováno</span> : <><Copy className="h-4 w-4" /> Kopírovat</>}
              </button>
            </div>
          </div>
        </div>

        {/* Po odemčení už žádné další velké tlačítko – jen nenápadný odkaz (hlavní vstup je v headeru a v sekci přehledu) */}
        {unlocked ? (
          <a href="/report#dvojcata" onClick={() => track('report_open', { from: 'finder' })} className="group mt-3 flex min-h-11 items-center justify-center gap-1.5 text-[14px] font-semibold text-teal-700 hover:text-teal-900">
            {t.ticker} a dalších {data.pairs.length - 1} najdete v přehledu <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </a>
        ) : (
          <button className="btn btn-primary mt-3 w-full" onClick={() => openSheet('finder')} data-cta="finder">
            <>Poslat {t.ticker} + {data.pairs.length - 1} dalších<span className="hidden sm:inline">&nbsp;zdarma</span></>
            <ArrowRight />
          </button>
        )}
        <p className="mt-2 text-center text-[11.5px] text-muted">
          Zdroj: <a className="src-link" href={t.source_url} target="_blank" rel="noopener">{host(t.source_url)}</a>, <a className="src-link" href={p.us.source_url} target="_blank" rel="noopener">{host(p.us.source_url)}</a>
        </p>
      </div>
    </div>
  );
}
