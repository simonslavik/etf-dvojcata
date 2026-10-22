'use client';

import { useState } from 'react';

/** Odhlášení až po kliknutí (POST) – skenery odkazů v poště by GET „odklikly“ samy */
export function Unsubscribe({ token }: { token: string }) {
  const [state, setState] = useState<'idle' | 'done' | 'error'>('idle');
  if (state === 'done') return <p className="mt-4 text-[17px] text-text">Hotovo, další e-maily už vám nepošleme.</p>;
  return (
    <div className="mt-4 space-y-4">
      <p className="text-[17px] text-muted">Jedním kliknutím zrušíte všechny další e-maily ze série.</p>
      <button
        className="btn btn-primary"
        disabled={!token}
        onClick={async () => {
          const r = await fetch(`/api/unsubscribe?t=${encodeURIComponent(token)}`, { method: 'POST' }).catch(() => null);
          setState(r?.ok ? 'done' : 'error');
        }}
      >
        Odhlásit se
      </button>
      {(state === 'error' || !token) && <p className="text-brick">Odkaz je neplatný. Napište nám prosím a odhlásíme vás ručně.</p>}
    </div>
  );
}
