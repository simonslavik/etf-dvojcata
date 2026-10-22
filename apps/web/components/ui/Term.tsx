'use client';

import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { track } from '@/lib/track';

/* Slovníček – pojem s otazníkem (jako „leadgeneraci?“ na clientelo.cz). Začátečník nemusí odcházet googlit. */
export const GLOSSARY = {
  UCITS: 'Evropská pravidla pro fondy pro drobné investory. Fond UCITS má dokument KID v češtině, takže ho evropský broker smí prodat.',
  TER: 'Celkové roční náklady fondu v % z investované částky. Strhávají se průběžně z hodnoty fondu – na výpisu je neuvidíte.',
  ISIN: 'Dvanáctimístný kód cenného papíru. Na rozdíl od tickeru je jednoznačný: vložte ho do vyhledávání v aplikaci brokera.',
  KID: 'Sdělení klíčových informací – krátký dokument o rizicích a nákladech fondu. Bez něj broker fond drobnému investorovi prodat nesmí.',
  PRIIPs: 'Nařízení EU 1286/2014. Vyžaduje KID u investičních produktů pro drobné investory – proto v EU nekoupíte americká ETF.',
  Acc: 'Akumulační fond dividendy nevyplácí, ale sám je reinvestuje. V Česku je nemusíte danit ani přiznávat.',
} as const;
export type GlossaryKey = keyof typeof GLOSSARY;

export function Term({ k, children, tone = 'light' }: { k: GlossaryKey; children?: ReactNode; tone?: 'light' | 'dark' }) {
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const btn = useRef<HTMLButtonElement>(null);
  const id = useId();

  useEffect(() => {
    if (!pos) return;
    const close = (e: Event) => { if (!(e.target instanceof Node && btn.current?.contains(e.target))) setPos(null); };
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setPos(null);
    addEventListener('pointerdown', close);
    addEventListener('scroll', () => setPos(null), { once: true, passive: true });
    addEventListener('keydown', esc);
    return () => { removeEventListener('pointerdown', close); removeEventListener('keydown', esc); };
  }, [pos]);

  const toggle = () => {
    if (pos) return setPos(null);
    const r = btn.current!.getBoundingClientRect();
    const w = Math.min(300, innerWidth - 24);
    setPos({ top: r.bottom + 8, left: Math.min(Math.max(12, r.left + r.width / 2 - w / 2), innerWidth - w - 12) });
    track('term_open', { term: k }, { once: true });
  };

  return (
    <>
      <button
        ref={btn}
        type="button"
        onClick={toggle}
        aria-expanded={Boolean(pos)}
        aria-describedby={pos ? id : undefined}
        className={`inline cursor-help border-b border-dotted font-[inherit] ${tone === 'dark' ? 'border-white/50' : 'border-current/50'}`}
      >
        {children ?? k}
        <sup className="ml-px text-[0.6em] font-semibold opacity-60">?</sup>
      </button>
      {pos && (
        <span
          id={id}
          role="tooltip"
          style={{ top: pos.top, left: pos.left, width: Math.min(300, innerWidth - 24) }}
          className="fixed z-50 rounded-2xl bg-teal-900 p-4 text-left font-sans text-[14px] leading-snug font-normal tracking-normal text-white normal-case shadow-xl [animation:fade-in_.15s_both]"
        >
          <b className="mb-1 block text-[13px] font-semibold text-[#e9a9a2]">{k}</b>
          {GLOSSARY[k]}
        </span>
      )}
    </>
  );
}
