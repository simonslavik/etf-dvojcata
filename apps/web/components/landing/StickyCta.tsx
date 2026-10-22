'use client';

import { useEffect, useState } from 'react';
import { data, formatKc, pairByTicker } from '@etfd/shared';
import { track } from '@/lib/track';
import { ArrowRight } from '@/components/ui/icons';
import { feeView } from './FeeCalculator';
import { useLead } from './LeadProvider';

/**
 * Lepkavé CTA na mobilu. Objeví se až po odscrollování za hero (na první obrazovce by zakrylo hodnotu – ISIN),
 * a schová se, když je na očích formulář – nikdy dvě výzvy naráz.
 */
export function StickyCta() {
  const { openSheet, sheet, unlocked, variant, selected, calc } = useLead();
  const [pastHero, setPastHero] = useState(false);
  const [formVisible, setFormVisible] = useState(false);

  useEffect(() => {
    const hero = document.querySelector('[data-hero]');
    const forms = document.querySelectorAll('[data-form="inline"], [data-form="final"]');
    const visible = new Set<Element>();
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.target === hero) setPastHero(!e.isIntersecting && e.boundingClientRect.top < 0);
        else if (e.isIntersecting) visible.add(e.target);
        else visible.delete(e.target);
      }
      setFormVisible(visible.size > 0);
    }, { rootMargin: '0px 0px -90px 0px' }); // spodní pás zakrývá sám sticky pruh
    if (hero) io.observe(hero);
    forms.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  const show = pastHero && !formVisible && !sheet.open;
  useEffect(() => { if (show) track('sticky_view', {}, { once: true }); }, [show]);

  const label = unlocked
    ? 'Otevřít celý přehled'
    : variant === 'fees'
      ? `Chci ušetřit ${formatKc(feeView(calc.monthly, calc.years).saved)}`
      : `Poslat ${pairByTicker(selected)?.twin.ticker ?? ''} + ${data.pairs.length - 1} dalších`;

  return (
    <div
      inert={!show}
      data-sticky
      className={`fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white/92 px-4 pt-3 pb-[max(12px,env(safe-area-inset-bottom))] backdrop-blur-md transition-[transform,opacity] duration-300 sm:hidden ${show ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'}`}
    >
      <button className="btn btn-primary w-full" onClick={() => openSheet('sticky')} data-cta="sticky">
        {label}
        <ArrowRight />
      </button>
    </div>
  );
}
