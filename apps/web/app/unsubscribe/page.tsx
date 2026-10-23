import type { Metadata } from 'next';
import { Shell } from '@/components/Shell';
import { Unsubscribe } from './Unsubscribe';

export const metadata: Metadata = { title: 'Odhlášení – ETF dvojčata', robots: { index: false } };

export default async function UnsubscribePage({ searchParams }: { searchParams: Promise<{ t?: string }> }) {
  const { t } = await searchParams;
  return (
    <Shell narrow>
      <h1 className="h2">Odhlášení z e-mailů</h1>
      <Unsubscribe token={t ?? ''} />
    </Shell>
  );
}
