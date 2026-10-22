'use client';

import { useRef, useState } from 'react';
import { CONSENTS, EMAIL_CONSENT } from '@/lib/consent';
import { track } from '@/lib/track';
import { useLead } from './LeadProvider';

/** E-mailový formulář s jedním polem. Použitý v sheetu, pod náhledem přehledu i v závěrečném CTA. */
export function LeadForm({ name, cta, tone = 'light', stacked = false, autoFocus = false, id }: {
  name: string; cta: string; tone?: 'light' | 'dark'; stacked?: boolean; autoFocus?: boolean; id?: string;
}) {
  const { submitLead } = useLead();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const started = useRef(false);
  const inputId = id ?? `email-${name}`;

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = e.currentTarget;
    setBusy(true);
    const res = await submitLead((f.elements.namedItem('email') as HTMLInputElement).value.trim(), {
      form: name, consentId: EMAIL_CONSENT, hp: (f.elements.namedItem('hp_f7') as HTMLInputElement).value,
    });
    setBusy(false);
    if (res.ok) {
      f.reset();
      setError(null);
    } else {
      setError(res.message ?? 'Něco se pokazilo.');
      (f.elements.namedItem('email') as HTMLInputElement).focus();
    }
  }

  const dark = tone === 'dark';
  return (
    <form onSubmit={onSubmit} noValidate data-form={name}>
      <label htmlFor={inputId} className="sr-only">E-mail</label>
      <div className={`flex gap-2 ${stacked ? 'flex-col' : 'flex-col sm:flex-row'}`}>
        <input
          id={inputId} name="email" type="email" inputMode="email" autoComplete="email" placeholder="vas@email.cz" required
          autoFocus={autoFocus}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${inputId}-err` : undefined}
          onInput={() => {
            if (!started.current) { started.current = true; track('form_start', { form: name }); }
            if (error) setError(null);
          }}
          className={`input ${stacked ? 'min-h-14 text-[17px]' : ''} ${dark ? 'border-white/15' : ''}`}
        />
        <button type="submit" className={`btn btn-primary ${stacked ? 'min-h-14 w-full text-[17px]' : 'sm:flex-none'}`} disabled={busy}>
          {busy ? 'Odemykám…' : cta}
        </button>
      </div>
      {/* Honeypot: nesmyslný název, autofill ho nevyplní */}
      <input className="hidden" type="text" name="hp_f7" tabIndex={-1} autoComplete="off" aria-hidden="true" />
      {error && <p id={`${inputId}-err`} role="alert" className={`mt-2 text-[14px] font-medium ${dark ? 'text-[#f3b2aa]' : 'text-brick'}`}>{error}</p>}
      <p className={`mt-2.5 text-[12.5px] ${dark ? 'text-white/60' : 'text-muted'}`}>
        {CONSENTS[EMAIL_CONSENT]} <a href="/soukromi" className="src-link">Ochrana údajů</a>
      </p>
    </form>
  );
}
