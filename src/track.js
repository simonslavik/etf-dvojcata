/**
 * Měření cesty návštěvníka. Bez cookies: anonymní ID relace v sessionStorage,
 * události jdou přes sendBeacon na /api/track (vlastní funnel) a volitelně do PostHogu.
 */
const KEY = 'etfd_sid';
const ENDPOINT = '/api/track';
const sent = new Set();

function sid() {
  try {
    let id = sessionStorage.getItem(KEY);
    if (!id) {
      id = (crypto.randomUUID?.() || String(Math.random()).slice(2));
      sessionStorage.setItem(KEY, id);
    }
    return id;
  } catch {
    return 'nostorage';
  }
}

const params = new URLSearchParams(location.search);
export const context = {
  sid: sid(),
  variant: document.body.dataset.variant || 'twin',
  utm_source: params.get('utm_source') || (document.referrer ? new URL(document.referrer).hostname : 'direct'),
  utm_campaign: params.get('utm_campaign') || null,
  utm_content: params.get('utm_content') || params.get('ad') || null,
  device: matchMedia('(max-width: 640px)').matches ? 'mobile' : 'desktop',
};
const t0 = performance.now();

/** track('cta_click', { source: 'finder' }); once=true pošle událost za relaci jen jednou */
export function track(event, props = {}, { once = false } = {}) {
  const dedupeKey = once ? event + JSON.stringify(props) : null;
  if (dedupeKey) {
    if (sent.has(dedupeKey)) return;
    sent.add(dedupeKey);
  }
  const payload = { event, ...context, props, t: Math.round(performance.now() - t0), ts: Date.now() };
  const body = JSON.stringify(payload);
  try {
    if (!navigator.sendBeacon?.(ENDPOINT, new Blob([body], { type: 'application/json' }))) {
      fetch(ENDPOINT, { method: 'POST', body, headers: { 'content-type': 'application/json' }, keepalive: true }).catch(() => {});
    }
  } catch { /* měření nikdy nesmí rozbít stránku */ }
  window.posthog?.capture?.(event, { ...props, variant: context.variant });
  if (import.meta.env.DEV) console.debug('[track]', event, props);
}

/** Hloubka scrollu 25/50/75/100 % */
export function trackScrollDepth() {
  const marks = [25, 50, 75, 100];
  const onScroll = () => {
    const h = document.documentElement;
    const pct = ((h.scrollTop + innerHeight) / h.scrollHeight) * 100;
    while (marks.length && pct >= marks[0] - 1) track('scroll', { depth: marks.shift() }, { once: true });
    if (!marks.length) removeEventListener('scroll', onScroll);
  };
  addEventListener('scroll', onScroll, { passive: true });
}

/** Událost, když je prvek z poloviny vidět (např. form_view) */
export function trackVisible(el, event, props) {
  if (!el) return;
  const io = new IntersectionObserver((entries) => {
    if (entries.some((e) => e.isIntersecting)) {
      track(event, props, { once: true });
      io.disconnect();
    }
  }, { threshold: 0.5 });
  io.observe(el);
}

/** Volitelný PostHog (cookieless) – zapne se jen když je nastavený VITE_POSTHOG_KEY */
export function initPosthog() {
  const key = import.meta.env.VITE_POSTHOG_KEY;
  if (!key) return;
  const host = import.meta.env.VITE_POSTHOG_HOST || 'https://eu.i.posthog.com';
  import('posthog-js')
    .then(({ default: posthog }) => {
      posthog.init(key, { api_host: host, persistence: 'memory', autocapture: false, capture_pageview: true });
      posthog.register({ variant: context.variant, sid: context.sid });
      window.posthog = posthog;
    })
    .catch(() => {});
}
