'use client';

import { useCopy } from '@/hooks/useCopy';
import { track } from '@/lib/track';
import { Check, Copy } from './icons';

/** Tlačítko „Kopírovat“ u ISIN – stejné ve vyhledávači i v přehledu (měří isin_copy se zdrojem) */
export function CopyIsinButton({ isin, from, size = 'md' }: { isin: string; from: 'finder' | 'report'; size?: 'sm' | 'md' }) {
  const { copied, copy } = useCopy();
  const sm = size === 'sm';
  return (
    <button
      type="button"
      onClick={() => { copy(isin); track('isin_copy', { isin, from }); }}
      data-copy-isin
      data-copied={copied || undefined}
      aria-label={`Kopírovat ISIN ${isin}`}
      className={`inline-flex flex-none items-center gap-1.5 rounded-lg bg-teal-900 font-semibold text-white transition-colors hover:bg-teal-700 data-[copied]:bg-ok print:hidden ${sm ? 'min-h-9 px-2.5 text-[12.5px]' : 'min-h-10 px-3 text-[13px]'}`}
    >
      {copied
        ? <span className="animate-pop inline-flex items-center gap-1.5"><Check className="h-4 w-4" /> Zkopírováno</span>
        : <><Copy className="h-4 w-4" /> Kopírovat</>}
    </button>
  );
}
