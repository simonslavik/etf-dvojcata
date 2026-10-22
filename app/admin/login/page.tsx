import type { Metadata } from 'next';
import { Logo } from '@/components/landing/Sections';
import { LoginForm } from './LoginForm';

export const metadata: Metadata = { title: 'Admin – ETF dvojčata', robots: { index: false } };

export default function Login() {
  return (
    <main className="grid min-h-dvh place-items-center bg-paper px-4">
      <div className="card w-full max-w-[400px] p-8">
        <Logo />
        <h1 className="mt-6 text-[22px] font-bold text-ink">Přihlášení do adminu</h1>
        <p className="mt-1 text-[14px] text-muted">Zadejte ADMIN_TOKEN z nastavení projektu.</p>
        <LoginForm />
      </div>
    </main>
  );
}
