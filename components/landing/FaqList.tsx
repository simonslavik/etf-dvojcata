'use client';

import type { ReactNode } from 'react';
import { track } from '@/lib/track';

export function FaqList({ items }: { items: { q: string; a: ReactNode }[] }) {
  return (
    <div className="mt-8 space-y-3">
      {items.map((f, i) => (
        <details
          key={f.q}
          className="group rounded-2xl border border-line bg-white open:border-teal-200 open:bg-teal-50/40"
          onToggle={(e) => (e.currentTarget as HTMLDetailsElement).open && track('faq_open', { q: i }, { once: true })}
        >
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 text-[16px] font-semibold text-ink sm:px-6 sm:py-5 sm:text-[17px] [&::-webkit-details-marker]:hidden">
            {f.q}
            <span className="grid h-8 w-8 flex-none place-items-center rounded-full bg-paper text-teal-700 transition-transform group-open:rotate-45" aria-hidden="true">
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
            </span>
          </summary>
          <div className="space-y-3 px-5 pb-5 text-[15px] leading-relaxed text-muted sm:px-6 [&_b]:text-ink">{f.a}</div>
        </details>
      ))}
    </div>
  );
}
