'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';

/** Velké číslo, které se při prvním zobrazení dopočítá od nuly (jednou, ~1 s, ease-out) */
export function StatCard({ value, decimals = 0, prefix = '', suffix = '', label, icon }: {
  value: number; decimals?: number; prefix?: string; suffix?: string; label: string; icon: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(value);

  useEffect(() => {
    const el = ref.current;
    if (!el || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    setShown(0);
    let raf = 0;
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      const start = performance.now();
      const tick = (now: number) => {
        const t = Math.min(1, (now - start) / 1000);
        setShown(value * (1 - Math.pow(1 - t, 3)));
        if (t < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    }, { threshold: 0.4 });
    io.observe(el);
    return () => { io.disconnect(); cancelAnimationFrame(raf); };
  }, [value]);

  const text = shown.toLocaleString('cs-CZ', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  return (
    <div ref={ref} className="lift card group relative overflow-hidden border-t-[3px] border-t-teal-700 p-5 sm:p-7">
      <span className="icon-tile transition-colors duration-300 group-hover:bg-teal-800 group-hover:text-white">{icon}</span>
      <p className="num mt-5 font-display text-[34px] leading-none font-bold text-ink sm:text-[46px]">
        {prefix}{text}{suffix}
      </p>
      <p className="mt-2 text-[14px] leading-snug text-muted sm:text-[15px]">{label}</p>
      {/* jemná záře v rohu při najetí */}
      <span aria-hidden="true" className="pointer-events-none absolute -top-16 -right-16 h-40 w-40 rounded-full bg-teal-100/0 blur-2xl transition-colors duration-500 group-hover:bg-teal-100/70" />
    </div>
  );
}
