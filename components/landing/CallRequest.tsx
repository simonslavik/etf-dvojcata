'use client';

import { useState } from 'react';
import { CALL_CONSENT, CONSENTS } from '@/lib/consent';
import { Check, Phone } from '@/components/ui/icons';

/** Předání: nepovinný telefon + výslovný souhlas → /api/call → webhook do CRM / call centra */
export function CallRequest({ token, onDone, onSkip }: { token: string; onDone?: () => void; onSkip?: () => void }) {
  const [state, setState] = useState<'idle' | 'busy' | 'done'>('idle');
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = e.currentTarget;
    const consent = (f.elements.namedItem('consent') as HTMLInputElement).checked;
    if (!consent) return setError('Potvrďte prosím souhlas, jinak vám nesmíme zavolat.');
    setState('busy');
    const r = await fetch('/api/call', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ token, phone: (f.elements.namedItem('phone') as HTMLInputElement).value, consent: true, consent_id: CALL_CONSENT }),
    }).catch(() => null);
    const res = await r?.json().catch(() => ({}));
    if (!r?.ok) {
      setState('idle');
      return setError(res?.message || 'Nepodařilo se odeslat. Zkuste to prosím znovu.');
    }
    setState('done');
    onDone?.();
  }

  if (state === 'done') {
    return (
      <div className="flex items-start gap-3 rounded-2xl bg-ok-50 p-4 text-[15px] text-ok" role="status">
        <Check className="mt-0.5 h-5 w-5 flex-none" />
        <p><b>Díky, ozveme se do 2 pracovních dnů.</b> Volat budeme z běžného českého čísla, hovor trvá asi 10 minut.</p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="rounded-2xl border border-line bg-paper p-4" data-form="call">
      <div className="flex items-start gap-3">
        <span className="icon-tile !h-10 !w-10 !bg-white"><Phone /></span>
        <div>
          <p className="font-semibold text-ink">Chcete pomoct s prvním nákupem?</p>
          <p className="text-[14px] text-muted">Zavoláme vám a za 10 minut spolu najdete dvojče v aplikaci a nastavíte pravidelný nákup. Zdarma, nic neprodáváme.</p>
        </div>
      </div>
      <label htmlFor="call-phone" className="sr-only">Telefon</label>
      <input id="call-phone" name="phone" type="tel" inputMode="tel" autoComplete="tel" placeholder="777 123 456" className="input mt-3" aria-invalid={error ? true : undefined} onInput={() => setError(null)} />
      <label className="mt-3 flex items-start gap-2.5 text-[13px] leading-snug text-muted">
        <input name="consent" type="checkbox" className="mt-0.5 h-5 w-5 flex-none accent-brick" />
        <span>{CONSENTS[CALL_CONSENT]} <a href="/soukromi" className="src-link">Ochrana údajů</a></span>
      </label>
      {error && <p role="alert" className="mt-2 text-[14px] font-medium text-brick">{error}</p>}
      <div className="mt-3 flex gap-2">
        <button type="submit" className="btn btn-primary flex-1" disabled={state === 'busy'}>{state === 'busy' ? 'Odesílám…' : 'Zavolejte mi'}</button>
        {onSkip && <button type="button" className="btn btn-ghost" onClick={onSkip}>Ne, díky</button>}
      </div>
    </form>
  );
}
