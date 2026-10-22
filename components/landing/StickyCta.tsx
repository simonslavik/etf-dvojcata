'use client';

import { useEffect, useState } from 'react';
import { data } from '@/lib/data';
import { track } from '@/lib/track';
import { ArrowRight } from '@/components/ui/icons';
import { useLead } from './LeadProvider';

/** Lepkavé CTA na mobilu. Schová se, když je na očích jiné CTA nebo formulář – nikdy dvě výzvy naráz. */
export function StickyCta() {
  const { openSheet, sheet, unlocked, variant } = useLead();
  const [blocked, setBlocked] = useState(true);

  useEffect(() => {
    const blockers = document.querySelectorAll('[data-hero] [data-cta], [data-form="inline"], [data-form="final"]');
    const visible = new Set<Element>();
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.isIntersecting) visible.add(e.target);
        else visible.delete(e.target);
      }
      setBlocked(visible.size > 0);
    }, { rootMargin: '0px 0px -90px 0px' }); // spodní pás zakrývá sám sticky pruh – CTA v něm se nepočítá jako viditelné
    blockers.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  const show = !blocked && !sheet.open;
  useEffect(() => { if (show) track('sticky_view', {}, { once: true }); }, [show]);

  return (
    <div
      inert={!show}
      data-sticky
      className={`fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white/92 px-4 pt-3 pb-[max(12px,env(safe-area-inset-bottom))] backdrop-blur-md transition-[transform,opacity] duration-300 sm:hidden ${show ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'}`}
    >
      <button className="btn btn-primary w-full" onClick={() => openSheet('sticky')} data-cta="sticky">
        {unlocked ? 'Otevřít celý přehled' : variant === 'fees' ? 'Přehled levných ETF zdarma' : `Poslat přehled ${data.pairs.length} dvojčat zdarma`}
        <ArrowRight />
      </button>
    </div>
  );
}
