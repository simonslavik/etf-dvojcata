'use client';

import { useEffect } from 'react';

/**
 * Jemné vynoření sekcí při scrollu. Skrývá jen prvky, které jsou při načtení POD první obrazovkou –
 * co je vidět hned, se nikdy nezprůhlední (dřív scroll-driven animace nechávala obsah u spodní hrany
 * poloprůhledný, dokud uživatel nezačal scrollovat). Bez JS / s „omezit pohyb“ je vše vidět hned.
 */
export function RevealOnScroll() {
  useEffect(() => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const els: HTMLElement[] = [];
    document.querySelectorAll<HTMLElement>('.reveal').forEach((el) => els.push(el));
    document.querySelectorAll<HTMLElement>('.stagger').forEach((parent) =>
      [...parent.children].forEach((child, i) => {
        (child as HTMLElement).style.setProperty('--reveal-delay', `${i * 70}ms`);
        els.push(child as HTMLElement);
      }));

    const below = els.filter((el) => el.getBoundingClientRect().top > innerHeight);
    below.forEach((el) => el.classList.add('pre-reveal'));
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        e.target.classList.add('revealed');
        e.target.classList.remove('pre-reveal');
        io.unobserve(e.target);
      }
    }, { rootMargin: '0px 0px -8% 0px' });
    below.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
  return null;
}
