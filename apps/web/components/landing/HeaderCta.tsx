'use client';

import { useLead } from './LeadProvider';

export function HeaderCta() {
  const { openSheet, unlocked } = useLead();
  return (
    <button className="btn btn-primary hidden !min-h-12 !px-5 !text-[15px] md:inline-flex" onClick={() => openSheet('header')} data-cta="header">
      {unlocked ? 'Otevřít přehled' : 'Přehled zdarma'}
    </button>
  );
}
