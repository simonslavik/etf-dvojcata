'use client';

import { useState } from 'react';
import type { Variant } from '@etfd/shared';
import { track } from '@/lib/track';
import { FeeCalculator } from './FeeCalculator';
import { TwinFinder } from './TwinFinder';

type Tool = 'finder' | 'calc';
const TABS: { id: Tool; label: string }[] = [
  { id: 'finder', label: 'Najít dvojče' },
  { id: 'calc', label: 'Spočítat poplatky' },
];

/**
 * Oba nástroje v jedné kartě s přepínačem – místo samostatné sekce s druhým nástrojem (kratší stránka).
 * Varianta reklamy určuje výchozí záložku; obě zůstávají namountované, takže se stav při přepnutí neztratí.
 */
export function HeroTools({ variant }: { variant: Variant }) {
  const [tool, setTool] = useState<Tool>(variant === 'fees' ? 'calc' : 'finder');
  const idx = TABS.findIndex((t) => t.id === tool);

  const pick = (t: Tool) => {
    if (t === tool) return;
    setTool(t);
    track('tool_switch', { to: t });
  };

  return (
    <div>
      <div role="tablist" aria-label="Nástroj" className="relative mb-3 grid grid-cols-2 rounded-2xl border border-line bg-white p-1 shadow-card">
        {/* posuvný „pill“ pod aktivní záložkou */}
        <span
          aria-hidden="true"
          className="absolute top-1 bottom-1 left-1 w-[calc(50%-4px)] rounded-xl bg-teal-800 transition-transform duration-300 [transition-timing-function:var(--ease-out-soft)]"
          style={{ transform: `translateX(${idx * 100}%)` }}
        />
        {TABS.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tool === t.id}
            aria-controls={`tool-${t.id}`}
            onClick={() => pick(t.id)}
            data-tab={t.id}
            className="relative z-10 min-h-11 rounded-xl text-[14.5px] font-semibold text-ink transition-colors duration-300 aria-selected:text-white"
          >
            {t.label}
          </button>
        ))}
      </div>
      <div id="tool-finder" role="tabpanel" hidden={tool !== 'finder'} className={tool === 'finder' ? 'animate-rise' : ''}><TwinFinder /></div>
      <div id="tool-calc" role="tabpanel" hidden={tool !== 'calc'} className={tool === 'calc' ? 'animate-rise' : ''}><FeeCalculator /></div>
    </div>
  );
}
