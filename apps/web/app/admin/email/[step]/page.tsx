import Link from 'next/link';
import { notFound } from 'next/navigation';
import { SEQUENCE } from '@etfd/shared';
import { apiGet } from '@/lib/api';

export const metadata = { robots: { index: false } };
export const dynamic = 'force-dynamic';

/** Náhled šablony e-mailu (vlastní HTML šablona z API, žádný uživatelský vstup) */
export default async function EmailPreviewPage({ params }: { params: Promise<{ step: string }> }) {
  const { step } = await params;
  if (!SEQUENCE.some((s) => s.step === step)) notFound();
  const { subject, html } = await apiGet<{ subject: string; html: string }>(`/admin/email/${step}`);
  return (
    <main className="min-h-dvh bg-paper py-8">
      <div className="wrap max-w-[640px]">
        <Link href="/admin" className="text-[14px] text-teal-700 hover:underline">← Pipeline</Link>
        <p className="mt-4 text-[13px] text-muted">Předmět</p>
        <h1 className="text-[20px] font-bold text-ink">{subject}</h1>
        <div className="card mt-4 p-6" dangerouslySetInnerHTML={{ __html: html }} />
      </div>
    </main>
  );
}
