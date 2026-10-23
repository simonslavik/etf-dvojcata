import type { Variant } from '@etfd/shared';
import { LeadProvider } from './LeadProvider';
import { LeadSheet } from './LeadSheet';
import { MagnetPreview } from './MagnetPreview';
import { FeeCalculator } from './FeeCalculator';
import { FinalCta } from './FinalCta';
import { Faq, Footer, Hero, HowItWorks, ProofStrip, SecondTool } from './Sections';
import { TwinFinder } from './TwinFinder';
import { SiteHeader } from './SiteHeader';
import { RevealOnScroll } from '@/components/RevealOnScroll';

/**
 * Pořadí sekcí (zdůvodnění v README): hero = slib reklamy + jeden nástroj → důkaz a důvěra → druhý nástroj
 * → jak to funguje (3 kroky) → magnet + formulář → FAQ → kompaktní závěrečná výzva. Varianta B jen prohodí nástroje.
 */
export function Landing({ variant }: { variant: Variant }) {
  const [first, second] =
    variant === 'fees' ? [<FeeCalculator key="c" />, <TwinFinder key="f" />] : [<TwinFinder key="f" />, <FeeCalculator key="c" />];
  return (
    <LeadProvider variant={variant}>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-lg focus:bg-white focus:px-4 focus:py-2"
      >
        Přeskočit na obsah
      </a>
      <SiteHeader />
      <main id="main" data-variant={variant}>
        <Hero variant={variant} tool={first} />
        <ProofStrip />
        <SecondTool variant={variant} tool={second} />
        <HowItWorks />
        <MagnetPreview />
        <Faq />
        <FinalCta />
      </main>
      <Footer />
      <LeadSheet />
      <RevealOnScroll />
    </LeadProvider>
  );
}
