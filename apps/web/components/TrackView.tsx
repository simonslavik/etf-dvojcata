'use client';

import { useEffect } from 'react';
import { VARIANT_COOKIE, type EventName } from '@etfd/shared';
import { initTracking, track } from '@/lib/track';

/** Jedna událost při zobrazení podstránky; varianta se bere z cookie z proxy.ts */
export function TrackView({ event }: { event: EventName }) {
  useEffect(() => {
    const variant = document.cookie.includes(`${VARIANT_COOKIE}=fees`) ? 'fees' : 'twin';
    initTracking(variant);
    track(event, { from: new URLSearchParams(location.search).get('utm_source') || 'page' });
  }, [event]);
  return null;
}
