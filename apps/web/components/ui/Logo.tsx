import Link from 'next/link';

/** Značka „dvojčata“: dva překrývající se čtverce (americký originál + evropské dvojče) */
export function LogoMark({ className = 'h-8 w-8' }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <rect x="3" y="6" width="17" height="17" rx="5" fill="var(--color-teal-800)" />
      <rect x="12" y="10" width="17" height="17" rx="5" fill="var(--color-brick)" fillOpacity=".92" />
    </svg>
  );
}

export function Logo() {
  return (
    <Link href="/" className="inline-flex items-center gap-2.5 text-[19px] font-bold tracking-tight text-ink">
      <LogoMark />
      <span>ETF <span className="text-teal-600">dvojčata</span></span>
    </Link>
  );
}
