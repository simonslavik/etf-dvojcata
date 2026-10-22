import data from '../data/etfs.json';
import { chipsHtml, twinHtml, previewHtml, calcView } from './render.js';
import { track, trackScrollDepth, trackVisible, context, initPosthog } from './track.js';

/* První stav (VOO, kalkulačka 3 000 Kč / 20 let, náhled, FAQ, zdroje) je předrenderovaný v HTML.
   Tady jen napojujeme interakce a měření. */

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const UNLOCK_KEY = 'etfd_unlocked';
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const state = { selected: data.pairs[0].us.ticker, calc: { monthly: 3000, years: 20 }, calcTouched: false, email: null };
const sheet = $('[data-sheet]');
const hasDialog = typeof sheet.showModal === 'function'; // iOS Safari < 15.4 <dialog> nemá

/* ---------- Vyhledávač dvojčat ---------- */
function selectTwin(ticker) {
  const p = data.pairs.find((x) => x.us.ticker === ticker);
  if (!p) return;
  state.selected = p.us.ticker;
  $$('[data-ticker]').forEach((b) => b.setAttribute('aria-selected', String(b.dataset.ticker === p.us.ticker)));
  $('[data-twin]').innerHTML = twinHtml(data, p);
}

function wireFinder() {
  $('[data-chips]').addEventListener('click', (e) => {
    const b = e.target.closest('[data-ticker]');
    if (!b || b.dataset.ticker === state.selected) return;
    selectTwin(b.dataset.ticker);
    track('finder_select', { ticker: b.dataset.ticker });
  });
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
  // Reklama může poslat konkrétní ticker: ?utm_content=VT
  const fromAd = context.utm_content?.toUpperCase();
  if (fromAd && fromAd !== state.selected && data.pairs.some((p) => p.us.ticker === fromAd)) selectTwin(fromAd);
}

/* ---------- Kalkulačka ---------- */
function wireCalc() {
  const inputs = $$('[data-in]');
  const paintTrack = (i) => i.style.setProperty('--p', `${((i.value - i.min) / (i.max - i.min)) * 100}%`);
  inputs.forEach(paintTrack);
  let debounce;
  inputs.forEach((i) => i.addEventListener('input', () => {
    state.calc[i.dataset.in] = Number(i.value);
    paintTrack(i);
    const v = calcView(data, state.calc);
    for (const [k, text] of Object.entries(v.text)) {
      const el = $(`[data-out="${k}"]`);
      if (el) el.textContent = text;
    }
    $('[data-bar="etf"]').style.width = `${v.etfBarPct}%`;
    state.calcTouched = true;
    clearTimeout(debounce);
    debounce = setTimeout(() => track('calc_change', { ...state.calc }), 600);
  }));
}

/* ---------- Odemčení přehledu ---------- */
const isUnlocked = () => { try { return localStorage.getItem(UNLOCK_KEY) === '1'; } catch { return false; } };

function unlock({ persist = true } = {}) {
  $('[data-preview]').classList.add('is-unlocked');
  $('[data-preview-table]').innerHTML = previewHtml(data, { unlocked: true });
  if (!$('[data-report-link]')) {
    $('[data-preview]').insertAdjacentHTML('beforeend', '<div class="preview__open"><a class="btn btn--primary btn--block" href="/prehled.html" data-report-link data-open-report>Otevřít celý přehled s daněmi</a></div>');
  }
  $('[data-cta="sticky"]').innerHTML = '<span>Otevřít celý přehled</span>';
  if (persist) {
    try { localStorage.setItem(UNLOCK_KEY, '1'); } catch { /* bez storage OK */ }
  }
}

/* ---------- Bottom sheet + formuláře ---------- */
function setSheetStep(step) {
  $$('[data-sheet-step]', sheet).forEach((el) => { el.hidden = el.dataset.sheetStep !== step; });
}

function openSheet(source) {
  if (isUnlocked()) {
    location.href = '/prehled.html';
    return;
  }
  if (!hasDialog) {
    // Fallback: místo sheetu sjedeme k formuláři pod náhledem přehledu
    $('#prehled').scrollIntoView({ behavior: 'smooth' });
    $('#email-inline').focus({ preventScroll: true });
    return;
  }
  sheet.dataset.source = source;
  setSheetStep('form');
  if (!sheet.open) sheet.showModal();
  track('form_view', { form: 'sheet', source });
  $('#email-sheet').focus(); // v rámci gesta → na iOS se otevře klávesnice
}

/* Klávesnice na iOS zmenší jen visual viewport – sheet posuneme nad ni, ať je tlačítko vidět */
function wireKeyboardOffset() {
  const vv = window.visualViewport;
  if (!vv) return;
  const update = () => sheet.style.setProperty('--kb', `${Math.max(0, innerHeight - vv.height - vv.offsetTop)}px`);
  vv.addEventListener('resize', update);
  vv.addEventListener('scroll', update);
}

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
        err.textContent = msg;
        err.hidden = false;
        input.setAttribute('aria-invalid', 'true');
        input.focus();
        track('form_error', { form: name, reason });
      };
      if (!EMAIL_RE.test(email)) return showError('Zkontrolujte prosím e-mail – chybí zavináč nebo doména.', 'invalid');

      const source = name === 'sheet' ? sheet.dataset.source || 'sheet' : name;
      track('form_submit', { form: name, source });
      btn.disabled = true;
      const label = btn.innerHTML;
      btn.textContent = 'Odemykám…';
      try {
        const r = await fetch('/api/lead', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            email, hp_f7: form.hp_f7.value, source, ...context,
            interest: state.selected,
            calc_monthly: state.calcTouched ? state.calc.monthly : null,
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
        form.reset();
        if (!hasDialog) return $('#prehled').scrollIntoView({ behavior: 'smooth' });
        setSheetStep('done');
        if (!sheet.open) sheet.showModal();
      } catch {
        showError('Nepodařilo se připojit. Zkontrolujte internet a zkuste to znovu.', 'network');
      } finally {
        btn.disabled = false;
        btn.innerHTML = label;
      }
    });
  });

  // Kvalifikace po odeslání – jedno klepnutí, nepovinné
  $$('[data-q]').forEach((b) => b.addEventListener('click', () => {
    track('qualify', { monthly: b.dataset.q });
    fetch('/api/lead', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ action: 'qualify', email: state.email, monthly: b.dataset.q }),
    }).catch(() => {});
    $('[data-qualify]').hidden = true;
    $('[data-qualify-thanks]').hidden = false;
  }));
  document.addEventListener('click', (e) => { if (e.target.closest('[data-open-report]')) track('report_open'); });
  $$('[data-faq] details').forEach((d) => d.addEventListener('toggle', () => d.open && track('faq_open', { q: d.dataset.faqI }, { once: true })));
}

/* ---------- Sticky CTA (jen mobil) ---------- */
function wireSticky() {
  const sticky = $('[data-sticky]');
  sticky.hidden = false;
  if (context.variant === 'fees') $('[data-cta="sticky"]').innerHTML = '<span>Poslat výpočet + přehled ETF zdarma</span>';
  // Schová se, když je na očích jiné CTA nebo formulář – nikdy dvě výzvy naráz
  const blockers = [$('.hero [data-cta]'), $('[data-form="inline"]'), $('[data-form="final"]')].filter(Boolean);
  const visible = new Set();
  const update = () => {
    const show = visible.size === 0 && !sheet.open;
    sticky.classList.toggle('is-visible', show);
    sticky.inert = !show; // skrytý pruh nesmí být dosažitelný klávesnicí ani čtečkou
    if (show) track('sticky_view', {}, { once: true });
  };
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) e.isIntersecting ? visible.add(e.target) : visible.delete(e.target);
    update();
  }, { rootMargin: '0px 0px -90px 0px' }); // spodní pás zakrývá sám sticky pruh – CTA v něm se nepočítá jako viditelné
  blockers.forEach((el) => io.observe(el));
  sheet.addEventListener('close', update);
  $$('[data-cta]').forEach((b) => b.addEventListener('click', () => requestAnimationFrame(update)));
}

/* ---------- Start ---------- */
wireFinder();
wireCalc();
wireForms();
wireSticky();
wireKeyboardOffset();
if (isUnlocked()) unlock({ persist: false });

track('page_view', { path: location.pathname, ref: document.referrer ? new URL(document.referrer).hostname : null });
trackScrollDepth();
trackVisible($('[data-form="inline"]'), 'form_view', { form: 'inline' });
trackVisible($('[data-form="final"]'), 'form_view', { form: 'final' });
initPosthog();
