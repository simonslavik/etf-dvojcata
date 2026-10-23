'use client';

import type { ReactNode } from 'react';
import { useCountUpOnView } from '@/hooks/useCountUp';

/** Velké číslo, které se při prvním zobrazení dopočítá od nuly */
export function StatCard({
  value,
  decimals = 0,
  suffix = '',
  label,
  icon,
}: {
  value: number;
  decimals?: number;
  suffix?: string;
  label: string;
  icon: ReactNode;
}) {
  const [ref, shown] = useCountUpOnView<HTMLDivElement>(value);

  const text = shown.toLocaleString('cs-CZ', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  return (
    <div
      ref={ref}
      className="lift card group relative flex items-center gap-3 overflow-hidden border-t-[3px] border-t-teal-700 p-3.5 shadow-none sm:gap-4 sm:p-5"
    >
      <span className="icon-tile hidden transition-colors duration-300 group-hover:bg-teal-800 group-hover:text-white sm:grid">{icon}</span>
      <div className="min-w-0">
        <p className="num font-display text-[26px] leading-none font-bold text-ink sm:text-[32px]">
          {text}
          {suffix}
        </p>
        <p className="mt-1 text-[12.5px] leading-tight text-muted sm:text-[14px]">{label}</p>
      </div>
      {/* jemná záře v rohu při najetí */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -top-16 -right-16 h-40 w-40 rounded-full bg-teal-100/0 blur-2xl transition-colors duration-500 group-hover:bg-teal-100/70"
      />
    </div>
  );
}
