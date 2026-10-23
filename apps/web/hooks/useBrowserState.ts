'use client';

import { useSyncExternalStore } from 'react';
import { storage, subscribeStorage } from '@/lib/storage';

const noopSubscribe = () => () => {};

/**
 * Hodnota z úložiště prohlížeče. Server (statické HTML) vidí null, prohlížeč skutečnou hodnotu –
 * bez setState v efektu a bez hydration mismatch.
 */
export function useStoredValue(key: string) {
  return useSyncExternalStore(subscribeStorage, () => storage.get(key), () => null);
}

/** Uživatel má zapnuté „omezit pohyb“ */
export function useReducedMotion() {
  return useSyncExternalStore(
    (onChange) => {
      const mq = matchMedia('(prefers-reduced-motion: reduce)');
      mq.addEventListener('change', onChange);
      return () => mq.removeEventListener('change', onChange);
    },
    () => matchMedia('(prefers-reduced-motion: reduce)').matches,
    () => false,
  );
}

/** Parametr z URL (?utm_content=VT) – stránky jsou statické, takže se čte až v prohlížeči */
export function useSearchParam(name: string) {
  return useSyncExternalStore(noopSubscribe, () => new URLSearchParams(location.search).get(name), () => null);
}
