'use client';

import { useEffect, useRef, useState } from 'react';

/** Plynulý přechod čísla na novou hodnotu (ease-out, ~450 ms). Při „omezit pohyb“ skočí rovnou. */
export function useCountUp(target: number, duration = 450) {
  const [value, setValue] = useState(target);
  const from = useRef(target);
  const raf = useRef(0);

  useEffect(() => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
      from.current = target;
      setValue(target);
      return;
    }
    const start = performance.now();
    const a = from.current;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const v = a + (target - a) * (1 - Math.pow(1 - t, 3));
      setValue(v);
      from.current = v;
      if (t < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [target, duration]);

  return value;
}
