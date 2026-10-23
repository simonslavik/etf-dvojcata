'use client';

import { useState } from 'react';

/** Zkopírování textu do schránky + krátké potvrzení. Starší prohlížeče bez Clipboard API: text je vidět vedle. */
export function useCopy(resetMs = 1800) {
  const [copied, setCopied] = useState(false);
  const copy = async (text: string) => {
    try { await navigator.clipboard.writeText(text); } catch { /* bez Clipboard API */ }
    setCopied(true);
    setTimeout(() => setCopied(false), resetMs);
  };
  return { copied, copy };
}
