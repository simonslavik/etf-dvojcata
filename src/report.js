import data from '../data/etfs.json';
import { taxSection, howToBuy } from './content.js';
import { formatPct } from './calc.js';
import { track } from './track.js';

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const host = (u) => new URL(u).hostname.replace(/^www\./, '');
const fmtDate = (iso) => new Date(iso).toLocaleDateString('cs-CZ');
const dist = { Acc: 'akumulační', Dist: 'distribuční' };

const card = (p) => `
  <article class="rcard">
    <div class="rcard__top">
      <span class="rcard__us">${esc(p.us.ticker)}</span><span class="rcard__arrow">→</span>
      <span class="rcard__tw">${esc(p.twin.ticker)}</span>
      ${p.twin.aka ? `<span class="rcard__aka">též ${esc(p.twin.aka)}</span>` : ''}
      <span class="tag tag--${p.match}">${p.match === 'exact' ? 'stejný index' : 'podobný index'}</span>
    </div>
    <p class="rcard__name">${esc(p.twin.name)}</p>
    <dl>
      <div><dt>ISIN</dt><dd class="mono">${esc(p.twin.isin)}</dd></div>
      <div><dt>TER dvojče / USA</dt><dd>${formatPct(p.twin.ter_pct)} / ${formatPct(p.us.ter_pct)}</dd></div>
      <div><dt>Typ</dt><dd>${p.twin.form} · ${dist[p.twin.distribution] || 'bez výnosu'}</dd></div>
      <div><dt>Index</dt><dd>${esc(p.twin.index)}</dd></div>
    </dl>
    ${p.note ? `<p class="rcard__note">${p.match === 'exact' ? '' : 'Rozdíl: '}${esc(p.note)}</p>` : ''}
    ${p.alts.length ? `<p class="rcard__note">Alternativy: ${p.alts.map((a) => `<b>${esc(a.ticker)}</b> ${formatPct(a.ter_pct)} (${esc(a.isin)})`).join(' · ')}</p>` : ''}
    <p class="rcard__src">Zdroje: <a href="${esc(p.twin.source_url)}" target="_blank" rel="noopener">${host(p.twin.source_url)}</a>, <a href="${esc(p.us.source_url)}" target="_blank" rel="noopener">${host(p.us.source_url)}</a> · ${fmtDate(p.twin.accessed)}</p>
  </article>`;

document.getElementById('report').innerHTML = `
  <p class="eyebrow">Data k ${fmtDate(data.as_of)}</p>
  <h1>Přehled ${data.pairs.length} ETF dvojčat</h1>
  <p class="lede">Americká ETF z burzy NYSE a jejich evropské verze, které si jako investor z Česka koupíte. ISIN zkopírujte do vyhledávání ve své aplikaci.</p>
  <h2>Jak dvojče koupit</h2>
  ${howToBuy(data)}
  <h2>Všechna dvojčata</h2>
  <div class="rcards">${data.pairs.map(card).join('')}</div>
  ${taxSection(data)}
  <h2>Co v přehledu není</h2>
  <p class="muted">${data.excluded.map((e) => `<b>${esc(e.ticker)}</b>`).join(', ')} – obchodují se na burze Nasdaq, ne na NYSE. Údaje jsou orientační, před nákupem si je ověřte v dokumentu KID u svého brokera. Nejde o investiční doporučení.</p>
`;
track('page_view', { path: location.pathname });
