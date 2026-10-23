'use client';

import { CallRequest } from '@/components/lead/CallRequest';
import { useStoredValue } from '@/hooks/useBrowserState';
import { KEYS, storage } from '@/lib/storage';

/** Pokračování trychtýře na konci přehledu: kdo zadal e-mail, dostane nabídku pomoci s prvním nákupem (předání) */
export function CallOffer() {
  const token = useStoredValue(KEYS.leadToken);
  const called = useStoredValue(KEYS.called) === '1';
  // kdo už o hovor požádal (na landing page), nabídku znovu nedostane
  if (!token || called) return null;
  return (
    <section aria-label="Pomoc s nákupem" className="mt-12 max-w-[640px] print:hidden">
      <CallRequest token={token} onDone={() => storage.set(KEYS.called, '1')} />
    </section>
  );
}
