'use client';

import { useEffect, useState } from 'react';
import { ArrowRight } from '@/components/ui/icons';
import { useLead } from './LeadProvider';
import { Logo } from '@/components/ui/Logo';

/**
 * Lepkavý header: výzva „Přehled zdarma“ je na očích po celou dobu scrollování (i na mobilu).
 * Po odscrollování se zúží a dostane stín – obsah pod ním zůstane čitelný.
 */
export function SiteHeader() {
  const { openSheet, unlocked } = useLead();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    addEventListener('scroll', onScroll, { passive: true });
    return () => removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      data-scrolled={scrolled || undefined}
      className="sticky top-0 z-40 border-b border-transparent bg-white/85 backdrop-blur-md transition-[box-shadow,border-color,background-color] duration-300 data-[scrolled]:border-line/70 data-[scrolled]:bg-white/92 data-[scrolled]:shadow-[0_8px_24px_-16px_rgb(22_59_59/0.35)]"
    >
      <div
        className={`wrap flex items-center justify-between gap-3 transition-[height] duration-300 ${scrolled ? 'h-14 sm:h-16' : 'h-16 sm:h-20'}`}
      >
        <Logo />
        <div className="flex items-center gap-3 sm:gap-4">
          <button
            className={`btn btn-primary group !gap-2 !px-3.5 !text-[14px] sm:!px-5 sm:!text-[15px] ${scrolled ? '!min-h-10 sm:!min-h-11' : '!min-h-11 sm:!min-h-12'}`}
            onClick={() => openSheet('header')}
            data-cta="header"
          >
            {unlocked ? 'Otevřít přehled' : 'Přehled zdarma'}
            <ArrowRight className="!h-4 !w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
          </button>
        </div>
      </div>
    </header>
  );
}
