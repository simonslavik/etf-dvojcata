import { notFound } from 'next/navigation';
import { SEQUENCE } from '@etfd/shared';
import { apiGet } from '@/lib/api';
import { AdminHeader } from '@/components/admin/ui';

export const metadata = { robots: { index: false } };
export const dynamic = 'force-dynamic';

/** Náhled šablony e-mailu (vlastní HTML šablona z API, žádný uživatelský vstup) */
export default async function EmailPreviewPage({ params }: { params: Promise<{ step: string }> }) {
  const { step } = await params;
  if (!SEQUENCE.some((s) => s.step === step)) notFound();
  const { subject, html } = await apiGet<{ subject: string; html: string }>(`/admin/email/${step}`);
  const s = SEQUENCE.find((x) => x.step === step)!;
  return (
    <div className="min-h-dvh bg-paper">
      <AdminHeader back />
      <main className="wrap max-w-[680px] py-6 sm:py-8">
        <p className="text-[13px] text-muted">Náhled e-mailu · den {s.day} po registraci · ukázková data</p>
        <h1 className="mt-1 text-[20px] font-bold text-ink">{subject}</h1>
        <div className="card mt-4 overflow-x-auto p-4 sm:p-6" dangerouslySetInnerHTML={{ __html: html }} />
      </main>
    </div>
  );
}
