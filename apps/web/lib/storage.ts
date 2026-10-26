/**
 * Úložiště prohlížeče pro drobný stav návštěvníka (odemčený přehled, token leadu, žádost o hovor).
 * Každý přístup v try/catch – v anonymním okně nebo s blokovaným úložištěm stránka funguje dál.
 */
export const KEYS = {
  unlocked: 'etfd_unlocked', // localStorage – přehled zůstane odemčený i po zavření záložky
  leadToken: 'etfd_lead', // sessionStorage – token jen pro tuto relaci (kvalifikace, hovor)
  called: 'etfd_called', // sessionStorage – o hovor už požádal, další nabídky se nezobrazí
  sid: 'etfd_sid', // sessionStorage – anonymní ID relace pro měření
  fbc: 'etfd_fbc', // sessionStorage – Meta click ID z reklamy (fbclid), odejde jen s leadem
} as const;

export const storage = {
  get(key: string): string | null {
    try {
      return sessionStorage.getItem(key) ?? localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  set(key: string, value: string, { persist = false } = {}) {
    try {
      (persist ? localStorage : sessionStorage).setItem(key, value);
    } catch {
      /* bez úložiště OK */
    }
    notifyStorage();
  },
};

/* Odběr změn pro useSyncExternalStore: zápis přes storage.set (i v jiné záložce) překreslí komponenty, které hodnotu čtou */
const listeners = new Set<() => void>();
export function subscribeStorage(onChange: () => void) {
  listeners.add(onChange);
  addEventListener('storage', onChange);
  return () => {
    listeners.delete(onChange);
    removeEventListener('storage', onChange);
  };
}
const notifyStorage = () => listeners.forEach((l) => l());
