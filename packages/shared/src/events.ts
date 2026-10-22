/* Jediný seznam událostí – sdílí ho prohlížeč (track), API (validace) i dashboard (popisky). */
export const EVENTS = [
  'page_view', 'scroll', 'finder_select', 'isin_copy', 'calc_change', 'cta_click', 'sticky_view',
  'form_view', 'form_start', 'form_error', 'form_submit', 'report_open', 'report_view',
  'faq_open', 'term_open', 'tool_switch',
] as const;
export type EventName = (typeof EVENTS)[number];
/** Události, které zapisuje jen server – z prohlížeče je nejde podvrhnout */
export type ServerEvent = 'lead_ok' | 'qualify' | 'call_request' | 'handoff' | 'email_click' | 'unsubscribe';

export const VARIANTS = ['twin', 'fees'] as const;
export type Variant = (typeof VARIANTS)[number];
export const isVariant = (v: unknown): v is Variant => VARIANTS.includes(v as Variant);
export const VARIANT_LABEL: Record<Variant, string> = { twin: 'A · Dvojče', fees: 'B · Poplatky' };

/** Kroky lievika na dashboardu: unikátní relace, které daným krokem prošly */
export const FUNNEL: { key: string; label: string; events: string[] }[] = [
  { key: 'visit', label: 'Návštěva', events: ['page_view'] },
  { key: 'interact', label: 'Interakce s nástrojem', events: ['finder_select', 'calc_change', 'isin_copy'] },
  { key: 'cta', label: 'Klik na CTA', events: ['cta_click'] },
  { key: 'form_view', label: 'Viděl formulář', events: ['form_view'] },
  { key: 'form_start', label: 'Začal psát', events: ['form_start'] },
  { key: 'lead', label: 'Lead (uložen serverem)', events: ['lead_ok'] },
  { key: 'qualify', label: 'Odpověděl na kvalifikaci', events: ['qualify'] },
  { key: 'handoff', label: 'Předán k hovoru', events: ['handoff'] },
];
