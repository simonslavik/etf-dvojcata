/**
 * Znění souhlasů s verzí. Klient posílá jen ID, server uloží kanonický text –
 * v DB je tak doložitelné, s čím přesně člověk souhlasil (upravený klient nemůže podstrčit jiné znění).
 * Při změně textu přidejte novou verzi, starou nemažte.
 */
export const CONSENTS = {
  email_v1: 'Pošleme přehled a občas tip k ETF. Odhlásíte se jedním klikem.',
  call_v1: 'Souhlasím, aby mi kvůli pomoci s prvním nákupem ETF zavolal člověk z týmu ETF dvojčata. Souhlas můžu kdykoli odvolat.',
} as const;
export type ConsentId = keyof typeof CONSENTS;
export const EMAIL_CONSENT: ConsentId = 'email_v1';
export const CALL_CONSENT: ConsentId = 'call_v1';
export const consentRecord = (id: string) => (Object.hasOwn(CONSENTS, id) ? `${id}: ${CONSENTS[id as ConsentId]}` : null);
