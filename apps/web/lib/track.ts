/**
 * Měření cesty návštěvníka (jen v prohlížeči). Bez cookies: anonymní ID relace v sessionStorage,
 * události jdou přes sendBeacon na /api/track a volitelně do PostHogu.
 */
import type { EventName, Variant } from '@etfd/shared';

export interface TrackContext {
  sid: string; variant: Variant; utm_source: string; utm_campaign: string | null; utm_content: string | null; device: 'mobile' | 'desktop';
}

const ENDPOINT = '/api/track';
const sent = new Set<string>();
let ctx: TrackContext | null = null;
let t0 = 0;

function sid() {
  try {
    let id = sessionStorage.getItem('etfd_sid');
    if (!id) {
      id = crypto.randomUUID?.() || String(Math.random()).slice(2);
      sessionStorage.setItem('etfd_sid', id);
    }
    return id;
  } catch {
    return `nostorage-${String(Math.random()).slice(2, 10)}`;
  }
}

export function initTracking(variant: Variant) {
  if (ctx) return ctx;
  const p = new URLSearchParams(location.search);
  let ref: string | null = null;
  try { ref = document.referrer ? new URL(document.referrer).hostname : null; } catch { /* neplatný referrer */ }
  ctx = {
    sid: sid(),
    variant,
    utm_source: p.get('utm_source') || ref || 'direct',
    utm_campaign: p.get('utm_campaign'),
    utm_content: p.get('utm_content') || p.get('ad'),
    device: matchMedia('(max-width: 640px)').matches ? 'mobile' : 'desktop',
  };
  t0 = performance.now();
  return ctx;
}

export const trackContext = () => ctx;

/** track('cta_click', { source: 'finder' }); once = jen jednou za načtení stránky */
export function track(event: EventName, props: Record<string, unknown> = {}, { once = false } = {}) {
  if (!ctx) return;
  if (once) {
    const k = event + JSON.stringify(props);
    if (sent.has(k)) return;
    sent.add(k);
  }
  const body = JSON.stringify({ event, ...ctx, props, t: Math.round(performance.now() - t0) });
  // text/plain = „simple request“: sendBeacon ho nikdy neodmítne kvůli CORS; server ho parsuje jako JSON
  const viaFetch = () => fetch(ENDPOINT, { method: 'POST', body, headers: { 'content-type': 'text/plain' }, keepalive: true }).catch(() => {});
  try {
    if (!navigator.sendBeacon?.(ENDPOINT, new Blob([body], { type: 'text/plain' }))) viaFetch();
  } catch {
    viaFetch(); // měření nikdy nesmí rozbít stránku
  }
  (window as unknown as { posthog?: { capture: (e: string, p: object) => void } }).posthog?.capture(event, { ...props, variant: ctx.variant });
}

export function trackScrollDepth() {
  const marks = [25, 50, 75, 100];
  const onScroll = () => {
    const h = document.documentElement;
    const pct = ((h.scrollTop + innerHeight) / h.scrollHeight) * 100;
    while (marks.length && pct >= marks[0] - 1) track('scroll', { depth: marks.shift() }, { once: true });
    if (!marks.length) removeEventListener('scroll', onScroll);
  };
  addEventListener('scroll', onScroll, { passive: true });
  return () => removeEventListener('scroll', onScroll);
}

/** Volitelný PostHog (cookieless) – zapne se jen s NEXT_PUBLIC_POSTHOG_KEY */
export function initPosthog() {
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (!key || !ctx) return;
  const c = ctx;
  import('posthog-js').then(({ default: posthog }) => {
    posthog.init(key, { api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://eu.i.posthog.com', persistence: 'memory', autocapture: false, capture_pageview: true });
    posthog.register({ variant: c.variant, sid: c.sid });
    (window as unknown as { posthog: unknown }).posthog = posthog;
  }).catch(() => {});
}
