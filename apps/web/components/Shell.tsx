import type { ReactNode } from 'react';
import { Logo } from '@/components/ui/Logo';

/** Rám podstránek (přehled, soukromí, odhlášení…) */
export function Shell({ children, action, narrow = false }: { children: ReactNode; action?: ReactNode; narrow?: boolean }) {
  return (
    <>
      <header className="border-b border-line/70 bg-white print:hidden">
        <div className="wrap flex h-16 items-center justify-between sm:h-20">
          <Logo />
          {action}
        </div>
      </header>
      <main className={`wrap py-10 sm:py-14 ${narrow ? 'max-w-[720px]' : 'max-w-[980px]'}`}>{children}</main>
    </>
  );
}
