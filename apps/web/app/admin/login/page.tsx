import type { Metadata } from 'next';
import { Logo } from '@/components/landing/Sections';

export const metadata: Metadata = { title: 'Admin – ETF dvojčata', robots: { index: false } };

/** Obyčejný POST formulář → NestJS (/api/admin/login) nastaví httpOnly cookie a přesměruje zpět (bez JS) */
export default async function Login({ searchParams }: { searchParams: Promise<{ e?: string }> }) {
  const { e } = await searchParams;
  return (
    <main className="grid min-h-dvh place-items-center bg-paper px-4">
      <div className="card w-full max-w-[400px] p-8">
        <Logo />
        <h1 className="mt-6 text-[22px] font-bold text-ink">Přihlášení do adminu</h1>
        <p className="mt-1 text-[14px] text-muted">Zadejte ADMIN_TOKEN z nastavení projektu.</p>
        <form action="/api/admin/login" method="post" className="mt-5 space-y-3">
          <label htmlFor="token" className="sr-only">Token</label>
          <input id="token" name="token" type="password" autoComplete="current-password" className="input" placeholder="ADMIN_TOKEN" required />
          {e && <p role="alert" className="text-[14px] text-brick">Neplatný token.</p>}
          <button className="btn btn-primary w-full">Přihlásit</button>
        </form>
      </div>
    </main>
  );
}
