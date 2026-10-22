/* Čisté funkce data → HTML. Používá je prohlížeč (main.js) i build (vite.config.js předrenderuje
   první stav do index.html – rychlejší LCP, žádný layout shift a stránka funguje i bez JS). */
import { compare, formatKc, formatPct } from './calc.js';
import { faq } from './content.js';

export const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
export const host = (u) => { try { return new URL(u).hostname.replace(/^www\./, ''); } catch { return u; } };
export const fmtDate = (iso) => { const [y, m, d] = iso.split('-').map(Number); return `${d}. ${m}. ${y}`; };
export const FREE_ROWS = 3;
const PREVIEW_ROWS = 7; // 3 čitelné + 4 rozmazané stačí, aby bylo jasné, co návštěvník dostane
const arrowSvg = '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M10 3v13m-5-5 5 5 5-5"/></svg>';

export const chipsHtml = (data, selected) => data.pairs
  .map((p) => `<button class="chip" role="tab" aria-selected="${p.us.ticker === selected}" aria-controls="twin" data-ticker="${p.us.ticker}">${p.us.ticker}</button>`)
  .join('');

export function twinHtml(data, p) {
  const t = p.twin;
  const match = p.match === 'exact' ? `<b>Stejný index</b> ${esc(t.index)}.` : `<b>Podobný index</b> – ${esc(p.note)}`;
  const alts = p.alts?.length
    ? `<p class="twin__alts">Další možnosti: ${p.alts.map((a) => `<span class="mono">${esc(a.ticker)}</span> (${formatPct(a.ter_pct)})`).join(', ')}</p>`
    : '';
  const dividends = { Acc: 'reinvestuje', Dist: 'vyplácí' }[t.distribution] || '–';
  return `
    <div class="twin__side twin__side--us">
      <div class="twin__head">
        <span class="twin__ticker">${esc(p.us.ticker)}</span>
        <span class="twin__badge twin__badge--no">V EU nekoupíte</span>
      </div>
      <p class="twin__name">${esc(p.us.name)} · ${esc(p.us.exchange)} · TER&nbsp;${formatPct(p.us.ter_pct)}</p>
    </div>
    <div class="twin__arrow">${arrowSvg}<span>evropské dvojče</span></div>
    <div class="twin__side twin__side--eu">
      <div class="twin__head">
        <span class="twin__ticker">${esc(t.ticker)}</span>
        <span class="twin__badge twin__badge--yes">${t.form === 'ETC' ? 'ETC' : 'UCITS'} · koupíte</span>
      </div>
      <p class="twin__name">${esc(t.name)}</p>
      <dl class="twin__facts">
        <div><dt>Poplatek (TER)</dt><dd>${formatPct(t.ter_pct)}</dd></div>
        <div><dt>Burza</dt><dd>${esc(t.exchange)}</dd></div>
        <div><dt>Dividendy</dt><dd>${dividends}</dd></div>
      </dl>
      <div class="isin">
        <span><span class="isin__label">ISIN – zadejte u brokera</span><span class="isin__code">${esc(t.isin)}</span></span>
        <button class="copy-btn" type="button" data-copy-isin="${esc(t.isin)}">Kopírovat</button>
      </div>
    </div>
    <p class="twin__note">${match}</p>${alts}
    <p class="twin__src">Zdroj: <a href="${esc(t.source_url)}" target="_blank" rel="noopener">${esc(host(t.source_url))}</a>, <a href="${esc(p.us.source_url)}" target="_blank" rel="noopener">${esc(host(p.us.source_url))}</a> · ${fmtDate(data.as_of)}</p>`;
}

export function previewHtml(data, { unlocked = false } = {}) {
  const rows = data.pairs.slice(0, PREVIEW_ROWS).map((p, i) => {
    const locked = !unlocked && i >= FREE_ROWS;
    return `
        <tr class="${locked ? 'is-locked' : ''}">
          <td><span class="mono us">${esc(p.us.ticker)}</span><span class="sub">${formatPct(p.us.ter_pct)}</span></td>
          <td><span class="mono">${esc(p.twin.ticker)}</span><span class="sub">${locked ? 'IE00XXXXXXXX' : esc(p.twin.isin)}</span></td>
          <td style="text-align:right"><b>${formatPct(p.twin.ter_pct)}</b></td>
        </tr>`;
  }).join('');
  return `
    <table class="ptable">
      <thead><tr><th>USA</th><th>Dvojče v EU</th><th style="text-align:right">TER</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>`;
}

export const faqHtml = (data) => faq(data)
  .map((f, i) => `<details data-faq-i="${i}"><summary>${f.q}</summary><div class="faq__a">${f.a}</div></details>`)
  .join('');

export const sourcesHtml = (data) => data.sources
  .map((s) => `<li>${esc(s.label)} – <a href="${esc(s.url)}" rel="noopener" target="_blank">${esc(host(s.url))}</a> (${fmtDate(s.accessed)})</li>`)
  .join('');

export const priipsSourceHtml = (data) =>
  `Zdroj: <a href="${esc(data.facts.priips.url)}" rel="noopener" target="_blank">${esc(data.facts.priips.label)}</a>`;

/** Texty a šířky sloupců kalkulačky pro daný vstup */
export function calcView(data, { monthly, years }) {
  const { bank, etf, annual_return: annualReturn } = data.calc;
  const r = compare({ monthly, years, annualReturn, bank, etf });
  return {
    text: {
      monthly: formatKc(monthly),
      years: `${years} let`,
      bankFees: formatKc(r.bankCost),
      etfFees: formatKc(r.etfCost),
      saved: formatKc(r.saved),
      bankName: `${bank.label} (${formatPct(bank.ter_pct)} ročně${bank.entry_fee_pct ? ` + ${formatPct(bank.entry_fee_pct)} vstup` : ''})`,
      etfName: `${etf.label} (${formatPct(etf.ter_pct)} ročně)`,
    },
    etfBarPct: Math.max((r.etfCost / Math.max(r.bankCost, 1)) * 100, 1.5),
    note: `Příklad fondu z banky: ${esc(bank.example)} (<a href="${esc(bank.source_url)}" target="_blank" rel="noopener">KID</a>). Počítáme s výnosem trhu ${formatPct(Math.round(annualReturn * 1000) / 10)} ročně před poplatky a srovnáváme jen náklady. Ilustrace, ne předpověď.`,
  };
}

/** Všechny sloty, které build předrenderuje do index.html (klíč = data-ssr="…") */
export function ssrSlots(data, calcDefaults) {
  const first = data.pairs[0];
  const c = calcView(data, calcDefaults);
  return {
    asof: fmtDate(data.as_of),
    count: String(data.pairs.length),
    chips: chipsHtml(data, first.us.ticker),
    twin: twinHtml(data, first),
    preview: previewHtml(data),
    faq: faqHtml(data),
    sources: sourcesHtml(data),
    priips: priipsSourceHtml(data),
    calcNote: c.note,
    ...Object.fromEntries(Object.entries(c.text).map(([k, v]) => [`calc_${k}`, esc(v)])),
    etfBar: `width:${c.etfBarPct}%`,
  };
}
