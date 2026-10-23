'use client';

import { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from './useBrowserState';

/** Animace čísla from → to (ease-out cubic). Vrací funkci pro zrušení. */
function animateNumber(from: number, to: number, duration: number, onFrame: (v: number) => void) {
  const start = performance.now();
  let raf = 0;
  const tick = (now: number) => {
    const t = Math.min(1, (now - start) / duration);
    onFrame(from + (to - from) * (1 - Math.pow(1 - t, 3)));
    if (t < 1) raf = requestAnimationFrame(tick);
  };
  raf = requestAnimationFrame(tick);
  return () => cancelAnimationFrame(raf);
}

/** Plynulý přechod čísla na novou hodnotu (kalkulačka). Při „omezit pohyb“ rovnou cílová hodnota. */
export function useCountUp(target: number, duration = 450) {
  const reduced = useReducedMotion();
  const [value, setValue] = useState(target);
  const current = useRef(target);

  useEffect(() => {
    if (reduced) return;
    return animateNumber(current.current, target, duration, (v) => {
      current.current = v;
      setValue(v);
    });
  }, [target, duration, reduced]);

  return reduced ? target : value;
}

/**
 * Číslo se dopočítá od nuly, když se prvek objeví na obrazovce (jednou).
 * Server a prohlížeč bez JS ukazují rovnou cílovou hodnotu.
 */
export function useCountUpOnView<T extends HTMLElement>(value: number, duration = 1000) {
  const reduced = useReducedMotion();
  const ref = useRef<T>(null);
  const [shown, setShown] = useState(value);

  useEffect(() => {
    const el = ref.current;
    if (!el || reduced) return;
    let cancel = () => {};
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        io.disconnect();
        cancel = animateNumber(0, value, duration, setShown);
      },
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      cancel();
    };
  }, [value, duration, reduced]);

  return [ref, reduced ? value : shown] as const;
}
