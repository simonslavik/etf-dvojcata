'use client';

import { useEffect, useState } from 'react';
import { CallRequest } from '@/components/landing/CallRequest';

/** Pokračování lievika na konci přehledu: kdo zadal e-mail, dostane nabídku pomoci s prvním nákupem (předání) */
export function CallOffer() {
  const [token, setToken] = useState<string | null>(null);
  useEffect(() => {
    try { setToken(sessionStorage.getItem('etfd_lead') ?? localStorage.getItem('etfd_lead')); } catch { /* bez storage */ }
  }, []);
  if (!token) return null;
  return (
    <section aria-label="Pomoc s nákupem" className="mt-12 max-w-[640px] print:hidden">
      <CallRequest token={token} />
    </section>
  );
}
