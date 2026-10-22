import { notFound } from 'next/navigation';
import { SEQUENCE, type SequenceStep } from '@/lib/pipeline/sequence';
import { renderPreview, subjectFor } from '@/lib/server/email';

export const metadata = { robots: { index: false } };

/** Náhled šablony e-mailu (vlastní HTML šablona, žádný uživatelský vstup) */
export default async function EmailPreview({ params }: { params: Promise<{ step: string }> }) {
  const { step } = await params;
  if (!SEQUENCE.some((s) => s.step === step)) notFound();
  return (
    <main className="min-h-dvh bg-paper py-8">
      <div className="wrap max-w-[640px]">
        <a href="/admin" className="text-[14px] text-teal-700 hover:underline">← Pipeline</a>
        <p className="mt-4 text-[13px] text-muted">Předmět</p>
        <h1 className="text-[20px] font-bold text-ink">{subjectFor(step as SequenceStep)}</h1>
        <div className="card mt-4 p-6" dangerouslySetInnerHTML={{ __html: renderPreview(step as SequenceStep) }} />
      </div>
    </main>
  );
}
