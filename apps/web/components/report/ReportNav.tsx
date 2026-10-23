'use client';

import { useEffect, useRef, useState } from 'react';
import { Download } from '@/components/ui/icons';

const ITEMS = [
  { id: 'navod', label: 'Jak koupit' },
  { id: 'dvojcata', label: 'Dvojčata' },
  { id: 'dane', label: 'Daně' },
];

/**
 * Přilepená navigace přehledu: po přilepení plná bílá „pilulka“ se stínem a mini logem,
 * aktivní sekce podle scrollu (posuvné zvýraznění) a tenký ukazatel přečtení.
 */
export function ReportNav() {
  const sentinel = useRef<HTMLDivElement>(null);
  const [stuck, setStuck] = useState(false);
  const [active, setActive] = useState(ITEMS[0].id);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // přilepení: sentinel těsně nad navigací zmizí z viewportu
    const stickIo = new IntersectionObserver(([e]) => setStuck(!e.isIntersecting), { threshold: 0 });
    if (sentinel.current) stickIo.observe(sentinel.current);

    // aktivní sekce = poslední, jejíž horní hrana už je v horní třetině okna (po skoku přes kotvu je nadpis ~90 px pod vrchem)
    const onScroll = () => {
      const ACTIVATE_AT = innerHeight * 0.35;
      const h = document.documentElement;
      const pr = Math.min(1, h.scrollTop / Math.max(1, h.scrollHeight - innerHeight));
      setProgress(pr);
      let current = ITEMS[0].id;
      for (const { id } of ITEMS) {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top <= ACTIVATE_AT) current = id;
      }
      // na konci stránky se poslední (krátká) sekce nedostane nahoru – zvýraznit ji ručně
      setActive(pr > 0.98 ? ITEMS[ITEMS.length - 1].id : current);
    };
    onScroll();
    addEventListener('scroll', onScroll, { passive: true });
    return () => { stickIo.disconnect(); removeEventListener('scroll', onScroll); };
  }, []);

  const idx = ITEMS.findIndex((i) => i.id === active);

  return (
    <>
      <div ref={sentinel} aria-hidden="true" className="mt-8 h-px" />
      <nav
        aria-label="Obsah přehledu"
        data-stuck={stuck || undefined}
        className="group sticky top-2 z-30 -mx-1 rounded-2xl border border-line bg-white/70 p-1.5 backdrop-blur-md transition-[background-color,box-shadow,border-color] duration-300 data-[stuck]:border-white data-[stuck]:bg-white data-[stuck]:shadow-[0_14px_34px_-18px_rgb(22_59_59/0.45)] sm:mx-0 print:hidden"
      >
        <div className="flex items-center gap-2">
          {/* mini logo – jen když je navigace přilepená */}
          <span aria-hidden="true" className="ml-1 hidden w-0 overflow-hidden opacity-0 transition-[width,opacity] duration-300 group-data-[stuck]:w-7 group-data-[stuck]:opacity-100 sm:block">
            <svg viewBox="0 0 32 32" className="h-7 w-7"><rect x="3" y="6" width="17" height="17" rx="5" fill="var(--color-teal-800)" /><rect x="12" y="10" width="17" height="17" rx="5" fill="var(--color-brick)" fillOpacity=".92" /></svg>
          </span>
          <ul className="relative grid flex-1 grid-cols-3 sm:flex sm:flex-none">
            {/* posuvné zvýraznění aktivní položky */}
            <span
              aria-hidden="true"
              className="absolute inset-y-0 left-0 w-1/3 rounded-xl bg-teal-800 transition-transform duration-300 [transition-timing-function:var(--ease-out-soft)] sm:w-[124px]"
              style={{ transform: `translateX(${idx * 100}%)` }}
            />
            {ITEMS.map((it) => (
              <li key={it.id} className="relative sm:w-[124px]">
                <a
                  href={`#${it.id}`}
                  aria-current={active === it.id ? 'true' : undefined}
                  onClick={() => setActive(it.id)}
                  className="flex min-h-10 items-center justify-center rounded-xl px-3 text-[14px] font-semibold text-ink transition-colors duration-300 aria-[current]:text-white"
                >
                  {it.label}
                </a>
              </li>
            ))}
          </ul>
          <button onClick={() => print()} className="ml-auto hidden min-h-10 items-center gap-1.5 rounded-xl px-3 text-[13.5px] font-semibold text-teal-700 transition-colors hover:bg-teal-50 sm:inline-flex">
            <Download className="h-4 w-4" /> PDF
          </button>
        </div>
        {/* ukazatel přečtení */}
        <span aria-hidden="true" className="absolute inset-x-3 -bottom-px h-[2px] overflow-hidden rounded-full">
          <span className="block h-full origin-left bg-gradient-to-r from-teal-600 to-brick transition-transform duration-150" style={{ transform: `scaleX(${progress})` }} />
        </span>
      </nav>
    </>
  );
}
