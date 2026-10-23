import type { Metadata } from 'next';
import { Shell } from '@/components/Shell';
import { CallRequest } from '@/components/lead/CallRequest';

export const metadata: Metadata = { title: 'Pomoc s prvním nákupem – ETF dvojčata', robots: { index: false } };

/** Cíl posledního e-mailu sekvence (D9): z péče zpět do předání */
export default async function HelpPage({ searchParams }: { searchParams: Promise<{ t?: string }> }) {
  const { t } = await searchParams;
  return (
    <Shell narrow>
      <p className="eyebrow">Zdarma · 10 minut · nezávazně</p>
      <h1 className="h2 mt-3">Pomůžeme vám s prvním nákupem</h1>
      <p className="mt-4 text-[17px] text-muted">Zavoláme vám, spolu najdeme dvojče ve vaší aplikaci a nastavíme pravidelný nákup. Nic neprodáváme a nejde o investiční poradenství.</p>
      <div className="mt-6">{t ? <CallRequest token={t} /> : <p className="text-brick">Odkaz je neplatný – otevřete ho prosím znovu z e-mailu.</p>}</div>
    </Shell>
  );
}
