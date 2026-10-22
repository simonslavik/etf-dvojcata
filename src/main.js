import data from '../data/etfs.json';
import { faq } from './content.js';
import { compare, formatKc, formatPct } from './calc.js';
import { track, trackScrollDepth, trackVisible, context, initPosthog } from './track.js';

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const UNLOCK_KEY = 'etfd_unlocked';
const ANNUAL_RETURN = data.calc.annual_return;
const state = { selected: null, calc: { monthly: 3000, years: 20 }, email: null, calcTouched: false };

const fmtDate = (iso) => new Date(iso).toLocaleDateString('cs-CZ', { day: 'numeric', month: 'numeric', year: 'numeric' });
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const host = (u) => { try { return new URL(u).hostname.replace(/^www\./, ''); } catch { return u; } };
const arrowSvg = '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M10 3v13m-5-5 5 5 5-5"/></svg>';

/* ---------- Statické části ---------- */
function renderMeta() {
  $$('[data-asof]').forEach((el) => { el.textContent = fmtDate(data.as_of); el.dateTime = data.as_of; });
  $$('[data-count]').forEach((el) => { el.textContent = data.pairs.length; });
  const priips = data.facts.priips;
  $('[data-source="priips"]').innerHTML = `Zdroj: <a href="${esc(priips.url)}" rel="noopener" target="_blank">${esc(priips.label)}</a>`;
  $('[data-sources]').innerHTML = data.sources
    .map((s) => `<li>${esc(s.label)} – <a href="${esc(s.url)}" rel="noopener" target="_blank">${esc(host(s.url))}</a> (${fmtDate(s.accessed)})</li>`)
    .join('');
}

function renderFaq() {
  $('[data-faq]').innerHTML = faq(data)
    .map((f, i) => `<details data-faq-i="${i}"><summary>${f.q}</summary><div class="faq__a">${f.a}</div></details>`)
    .join('');
  $$('[data-faq] details').forEach((d) => d.addEventListener('toggle', () => d.open && track('faq_open', { q: d.dataset.faqI }, { once: true })));
}

/* ---------- Vyhledávač dvojčat ---------- */
function renderChips() {
  $('[data-chips]').innerHTML = data.pairs
    .map((p) => `<button class="chip" role="tab" aria-selected="false" aria-controls="twin" data-ticker="${p.us.ticker}">${p.us.ticker}</button>`)
    .join('');
  $('[data-chips]').addEventListener('click', (e) => {
    const b = e.target.closest('[data-ticker]');
    if (!b) return;
    selectTwin(b.dataset.ticker);
    track('finder_select', { ticker: b.dataset.ticker });
  });
}

function selectTwin(ticker) {
  const p = data.pairs.find((x) => x.us.ticker === ticker) || data.pairs[0];
  state.selected = p.us.ticker;
  $$('[data-ticker]').forEach((b) => b.setAttribute('aria-selected', String(b.dataset.ticker === p.us.ticker)));
  const t = p.twin;
  const match = p.match === 'exact'
    ? `<b>Stejný index</b> ${esc(t.index)}.`
    : `<b>Podobný index</b> – ${esc(p.note)}`;
  const alts = p.alts?.length
    ? `<p class="twin__alts">Další možnosti: ${p.alts.map((a) => `<span class="mono">${esc(a.ticker)}</span> (${formatPct(a.ter_pct)})`).join(', ')}</p>`
    : '';
  $('[data-twin]').innerHTML = `
    <div class="twin__side twin__side--us">
      <div class="twin__head">
        <span class="twin__ticker">${esc(p.us.ticker)}</span>
        <span class="twin__badge twin__badge--no">V EU nekoupíte</span>
      </div>
      <p class="twin__name">${esc(p.us.name)} · ${esc(p.us.exchange)} · TER ${formatPct(p.us.ter_pct)}</p>
    </div>
    <div class="twin__arrow">${arrowSvg}<span>evropské dvojče</span></div>
    <div class="twin__side twin__side--eu">
      <div class="twin__head">
        <span class="twin__ticker">${esc(t.ticker)}</span>
        <span class="twin__badge twin__badge--yes">${t.form === 'ETC' ? 'ETC · koupíte' : 'UCITS · koupíte'}</span>
      </div>
      <p class="twin__name">${esc(t.name)}</p>
      <dl class="twin__facts">
        <div><dt>Poplatek (TER)</dt><dd>${formatPct(t.ter_pct)}</dd></div>
        <div><dt>Burza</dt><dd>${esc(t.exchange)}</dd></div>
        <div><dt>Dividendy</dt><dd>${t.distribution === 'Acc' ? 'reinvestuje' : t.distribution === 'Dist' ? 'vyplácí' : '–'}</dd></div>
      </dl>
      <div class="isin">
        <span><span class="isin__label">ISIN – zadejte u brokera</span><span class="isin__code">${esc(t.isin)}</span></span>
        <button class="copy-btn" type="button" data-copy-isin="${esc(t.isin)}">Kopírovat</button>
      </div>
    </div>`;
  $('[data-twin]').insertAdjacentHTML('beforeend', `
    <p class="twin__note">${match}</p>${alts}
    <p class="twin__src">Zdroj: <a href="${esc(t.source_url)}" target="_blank" rel="noopener">${esc(host(t.source_url))}</a>, <a href="${esc(p.us.source_url)}" target="_blank" rel="noopener">${esc(host(p.us.source_url))}</a> · ${fmtDate(data.as_of)}</p>`);
}

function wireCopy() {
  document.addEventListener('click', async (e) => {
    const b = e.target.closest('[data-copy-isin]');
    if (!b) return;
    const isin = b.dataset.copyIsin;
    try { await navigator.clipboard.writeText(isin); } catch { /* starší prohlížeče: ISIN je vidět vedle */ }
    b.textContent = 'Zkopírováno ✓';
    b.dataset.copied = '';
    setTimeout(() => { b.textContent = 'Kopírovat'; delete b.dataset.copied; }, 1800);
    track('isin_copy', { isin });
  });
}

/* ---------- Kalkulačka ---------- */
function wireCalc() {
  const bank = data.calc.bank;
  const etf = data.calc.etf;
  $('[data-out="bankName"]').textContent = `${bank.label} (${formatPct(bank.ter_pct)} ročně${bank.entry_fee_pct ? ` + ${formatPct(bank.entry_fee_pct)} vstup` : ''})`;
  $('[data-out="etfName"]').textContent = `${etf.label} (${formatPct(etf.ter_pct)} ročně)`;
  $('[data-calc-note]').innerHTML = `Příklad fondu z banky: ${esc(bank.example)} (<a href="${esc(bank.source_url)}" target="_blank" rel="noopener">KID</a>). Počítáme s výnosem trhu ${formatPct(Math.round(ANNUAL_RETURN * 1000) / 10)} ročně před poplatky a srovnáváme jen náklady. Ilustrace, ne předpověď.`;

  const inputs = $$('[data-in]');
  const update = () => {
    for (const i of inputs) {
      state.calc[i.dataset.in] = Number(i.value);
      i.style.setProperty('--p', `${((i.value - i.min) / (i.max - i.min)) * 100}%`);
    }
    const { monthly, years } = state.calc;
    const r = compare({ monthly, years, annualReturn: ANNUAL_RETURN, bank, etf });
    $('[data-out="monthly"]').textContent = formatKc(monthly);
    $('[data-out="years"]').textContent = `${years} ${years < 5 ? 'roky' : 'let'}`;
    $('[data-out="bankFees"]').textContent = formatKc(r.bankCost);
    $('[data-out="etfFees"]').textContent = formatKc(r.etfCost);
    $('[data-out="saved"]').textContent = formatKc(r.saved);
    const max = Math.max(r.bankCost, 1);
    $('[data-bar="bank"]').style.width = '100%';
    $('[data-bar="etf"]').style.width = `${Math.max((r.etfCost / max) * 100, 1.5)}%`;
  };
  let debounce;
  inputs.forEach((i) => i.addEventListener('input', () => {
    update();
    state.calcTouched = true;
    clearTimeout(debounce);
    debounce = setTimeout(() => track('calc_change', { monthly: state.calc.monthly, years: state.calc.years }), 600);
  }));
  update();
}

/* ---------- Náhled přehledu (lead magnet) ---------- */
function renderPreview() {
  const FREE = 3;
  const SHOWN = 7; // 3 čitelné + 4 rozmazané stačí, aby bylo jasné, co návštěvník dostane
  $('[data-preview-table]').innerHTML = `
    <table class="ptable">
      <thead><tr><th>USA</th><th>Dvojče v EU</th><th style="text-align:right">TER</th></tr></thead>
      <tbody>${data.pairs.slice(0, SHOWN).map((p, i) => `
        <tr class="${i >= FREE ? 'is-locked' : ''}">
          <td><span class="mono us">${esc(p.us.ticker)}</span><span class="sub">${formatPct(p.us.ter_pct)}</span></td>
          <td><span class="mono">${esc(p.twin.ticker)}</span><span class="sub">${i >= FREE ? 'IE00XXXXXXXX' : esc(p.twin.isin)}</span></td>
          <td style="text-align:right"><b>${formatPct(p.twin.ter_pct)}</b></td>
        </tr>`).join('')}
      </tbody>
    </table>`;
}

function unlock({ fromStorage = false } = {}) {
  $('[data-preview]').classList.add('is-unlocked');
  // Odemčená tabulka ukáže skutečné ISIN
  $$('[data-preview-table] tbody tr').forEach((tr, i) => { tr.children[1].querySelector('.sub').textContent = data.pairs[i].twin.isin; });
  if (!$('[data-report-link]')) {
    $('[data-preview]').insertAdjacentHTML('beforeend', '<div style="padding:12px 16px 16px"><a class="btn btn--primary btn--block" href="/prehled.html" data-report-link data-open-report>Otevřít celý přehled s daněmi</a></div>');
  }
  $('[data-cta="sticky"]').innerHTML = '<span>Otevřít celý přehled</span>';
  if (!fromStorage) {
    try { localStorage.setItem(UNLOCK_KEY, '1'); } catch { /* bez storage OK */ }
  }
}

/* ---------- Formuláře + bottom sheet ---------- */
const sheet = $('[data-sheet]');

function openSheet(source) {
  if (isUnlocked()) {
    location.href = '/prehled.html';
    return;
  }
  sheet.dataset.source = source;
  setSheetStep('form');
  if (!sheet.open) sheet.showModal();
  track('form_view', { form: 'sheet', source });
  // Na iOS se klávesnice otevře jen při fokusu v rámci uživatelského gesta – showModal je synchronní, takže to projde
  $('#email-sheet').focus();
}

function setSheetStep(step) {
  $$('[data-sheet-step]', sheet).forEach((el) => { el.hidden = el.dataset.sheetStep !== step; });
}

const isUnlocked = () => { try { return localStorage.getItem(UNLOCK_KEY) === '1'; } catch { return false; } };

function wireForms() {
  $$('[data-cta]').forEach((b) => b.addEventListener('click', () => {
    track('cta_click', { source: b.dataset.cta });
    openSheet(b.dataset.cta);
  }));
  $$('[data-close]').forEach((b) => b.addEventListener('click', () => sheet.close()));
  sheet.addEventListener('click', (e) => { if (e.target === sheet) sheet.close(); });

  $$('[data-form]').forEach((form) => {
    const input = form.querySelector('input[type="email"]');
    const err = form.querySelector('.lead-form__error');
    const btn = form.querySelector('button[type="submit"]');
    const name = form.dataset.form;
    input.addEventListener('input', () => {
      track('form_start', { form: name }, { once: true });
      if (input.getAttribute('aria-invalid')) { input.removeAttribute('aria-invalid'); err.hidden = true; }
    }, { passive: true });

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = input.value.trim();
      const showError = (msg, reason) => {
        err.textContent = msg; err.hidden = false;
        input.setAttribute('aria-invalid', 'true'); input.focus();
        track('form_error', { form: name, reason });
      };
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return showError('Zkontrolujte prosím e-mail – chybí zavináč nebo doména.', 'invalid');

      const source = name === 'sheet' ? sheet.dataset.source || 'sheet' : name;
      track('form_submit', { form: name, source });
      btn.disabled = true;
      const label = btn.textContent;
      btn.textContent = 'Odemykám…';
      try {
        const r = await fetch('/api/lead', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            email, company: form.company.value, source, ...context,
            interest: state.selected, calc_monthly: state.calcTouched ? state.calc.monthly : null,
            consent_text: form.querySelector('.lead-form__legal')?.textContent.trim(),
          }),
        });
        const res = await r.json().catch(() => ({}));
        if (!r.ok) return showError(res.message || 'Něco se pokazilo. Zkuste to prosím znovu.', `http_${r.status}`);
        state.email = email;
        unlock();
        $('[data-done-lead]').textContent = res.emailSent
          ? 'Přehled je odemčený níže na stránce a poslali jsme ho i na váš e-mail.'
          : 'Přehled je odemčený níže na stránce – můžete ho rovnou otevřít.';
        setSheetStep('done');
        if (!sheet.open) sheet.showModal();
        form.reset();
      } catch {
        showError('Nepodařilo se připojit. Zkontrolujte internet a zkuste to znovu.', 'network');
      } finally {
        btn.disabled = false;
        btn.textContent = label;
      }
    });
  });

  // Kvalifikace po odeslání – jedno klepnutí, nepovinné
  $$('[data-q]').forEach((b) => b.addEventListener('click', () => {
    track('qualify', { monthly: b.dataset.q });
    fetch('/api/lead', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ action: 'qualify', email: state.email, monthly: b.dataset.q }) }).catch(() => {});
    $('[data-qualify]').hidden = true;
    $('[data-qualify-thanks]').hidden = false;
  }));
  document.addEventListener('click', (e) => { if (e.target.closest('[data-open-report]')) track('report_open'); });
}

/* ---------- Sticky CTA (jen mobil) ---------- */
function wireSticky() {
  const sticky = $('[data-sticky]');
  sticky.hidden = false;
  const heroCta = $('.hero [data-cta]');
  const blockers = [heroCta, ...$$('[data-form="inline"], [data-form="final"]')].filter(Boolean);
  const visible = new Set();
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (e.isIntersecting) visible.add(e.target); else visible.delete(e.target);
    }
    // Na mobilu je CTA vidět od začátku (hero CTA bývá pod ohybem); schová se, když je na očích jiný formulář/CTA
    const show = visible.size === 0 && !sheet.open;
    sticky.classList.toggle('is-visible', show);
    if (show) track('sticky_view', {}, { once: true });
  }, { threshold: 0 });
  blockers.forEach((el) => io.observe(el));
}

/* ---------- Start ---------- */
renderMeta();
renderChips();
selectTwin(context.utm_content && data.pairs.some((p) => p.us.ticker === context.utm_content.toUpperCase()) ? context.utm_content.toUpperCase() : 'VOO');
wireCopy();
wireCalc();
renderPreview();
renderFaq();
wireForms();
wireSticky();
if (context.variant === 'fees') $('[data-cta="sticky"]').innerHTML = '<span>Poslat výpočet + přehled ETF zdarma</span>';
if (isUnlocked()) unlock({ fromStorage: true });

track('page_view', { path: location.pathname, ref: document.referrer ? host(document.referrer) : null });
trackScrollDepth();
trackVisible($('[data-form="inline"]'), 'form_view', { form: 'inline' });
trackVisible($('[data-form="final"]'), 'form_view', { form: 'final' });
initPosthog();
