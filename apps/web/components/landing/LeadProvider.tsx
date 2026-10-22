'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { data } from '@etfd/shared';
import type { Variant } from '@etfd/shared';
import { initPosthog, initTracking, track, trackContext, trackScrollDepth } from '@/lib/track';

const UNLOCK_KEY = 'etfd_unlocked';
const TOKEN_KEY = 'etfd_lead';
export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

type SheetStep = 'form' | 'done';
interface SubmitResult { ok: boolean; message?: string }

interface LeadState {
  variant: Variant;
  selected: string;
  select: (ticker: string) => void;
  calc: { monthly: number; years: number };
  setCalc: (c: { monthly: number; years: number }) => void;
  unlocked: boolean;
  token: string | null;
  emailSent: boolean;
  sheet: { open: boolean; step: SheetStep; source: string };
  openSheet: (source: string) => void;
  closeSheet: () => void;
  submitLead: (email: string, opts: { form: string; consentId: string; hp: string }) => Promise<SubmitResult>;
}

const Ctx = createContext<LeadState | null>(null);
export const useLead = () => {
  const v = useContext(Ctx);
  if (!v) throw new Error('useLead mimo LeadProvider');
  return v;
};

const store = {
  get: (k: string) => { try { return sessionStorage.getItem(k) ?? localStorage.getItem(k); } catch { return null; } },
  set: (k: string, v: string, persist = false) => { try { (persist ? localStorage : sessionStorage).setItem(k, v); } catch { /* bez storage OK */ } },
};

export function LeadProvider({ variant, children }: { variant: Variant; children: ReactNode }) {
  const [selected, setSelected] = useState(data.pairs[0].us.ticker);
  const [calc, setCalcState] = useState({ monthly: 3000, years: 20 });
  const calcTouched = useRef(false);
  const calcDebounce = useRef<ReturnType<typeof setTimeout>>(undefined);
  const [unlocked, setUnlocked] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [emailSent, setEmailSent] = useState(false);
  const [sheet, setSheet] = useState<{ open: boolean; step: SheetStep; source: string }>({ open: false, step: 'form', source: '' });

  useEffect(() => {
    const ctx = initTracking(variant);
    if (store.get(UNLOCK_KEY) === '1') setUnlocked(true);
    setToken(store.get(TOKEN_KEY));
    // Reklama může poslat konkrétní ticker: ?utm_content=VT
    const fromAd = ctx.utm_content?.toUpperCase();
    if (fromAd && data.pairs.some((p) => p.us.ticker === fromAd)) setSelected(fromAd);
    track('page_view', { path: location.pathname });
    initPosthog();
    return trackScrollDepth();
  }, [variant]);

  const select = useCallback((ticker: string) => {
    if (ticker === selected) return;
    track('finder_select', { ticker });
    setSelected(ticker);
  }, [selected]);

  const setCalc = useCallback((c: { monthly: number; years: number }) => {
    setCalcState(c);
    calcTouched.current = true;
    clearTimeout(calcDebounce.current);
    calcDebounce.current = setTimeout(() => track('calc_change', c), 600);
  }, []);

  const openSheet = useCallback((source: string) => {
    track('cta_click', { source });
    if (store.get(UNLOCK_KEY) === '1') {
      location.href = '/report';
      return;
    }
    setSheet({ open: true, step: 'form', source });
    track('form_view', { form: 'sheet', source });
  }, []);

  const closeSheet = useCallback(() => setSheet((s) => ({ ...s, open: false })), []);

  const submitLead = useCallback(async (email: string, { form, consentId, hp }: { form: string; consentId: string; hp: string }): Promise<SubmitResult> => {
    const fail = (message: string, reason: string) => {
      track('form_error', { form, reason });
      return { ok: false, message };
    };
    if (!EMAIL_RE.test(email)) return fail('Zkontrolujte prosím e-mail – chybí zavináč nebo doména.', 'invalid');
    const source = form === 'sheet' ? sheet.source || 'sheet' : form;
    track('form_submit', { form, source });
    try {
      const r = await fetch('/api/lead', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          email, hp_f7: hp, source, ...trackContext(),
          interest: selected,
          calc_monthly: calcTouched.current ? calc.monthly : null,
          consent_id: consentId,
        }),
      });
      const res = await r.json().catch(() => ({}));
      if (!r.ok) return fail(res.message || 'Něco se pokazilo. Zkuste to prosím znovu.', `http_${r.status}`);
      setUnlocked(true);
      store.set(UNLOCK_KEY, '1', true);
      setEmailSent(Boolean(res.emailSent));
      if (res.token) {
        setToken(res.token);
        store.set(TOKEN_KEY, res.token);
      }
      // Po odeslání vždy sheet s poděkováním + kvalifikací (i když se odesílalo z formuláře na stránce)
      setSheet({ open: true, step: 'done', source });
      return { ok: true };
    } catch {
      return fail('Nepodařilo se připojit. Zkontrolujte internet a zkuste to znovu.', 'network');
    }
  }, [calc.monthly, selected, sheet.source]);

  const value = useMemo<LeadState>(() => ({
    variant, selected, select, calc, setCalc, unlocked, token, emailSent, sheet, openSheet, closeSheet, submitLead,
  }), [variant, selected, select, calc, setCalc, unlocked, token, emailSent, sheet, openSheet, closeSheet, submitLead]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
