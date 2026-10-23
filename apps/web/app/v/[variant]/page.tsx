import { notFound } from 'next/navigation';
import { Landing } from '@/components/landing/Landing';
import { isVariant, VARIANTS } from '@etfd/shared';

/* Obě varianty se předrenderují při buildu. Návštěvník sem chodí přes proxy.ts (rewrite z „/?ad=…“). */
export const dynamicParams = false;
export const generateStaticParams = () => VARIANTS.map((variant) => ({ variant }));
export const metadata = { alternates: { canonical: '/' } };

export default async function VariantPage({ params }: { params: Promise<{ variant: string }> }) {
  const { variant } = await params;
  if (!isVariant(variant)) notFound();
  return <Landing variant={variant} />;
}
