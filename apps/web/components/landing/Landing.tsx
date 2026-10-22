import type { Variant } from '@etfd/shared';
import { LeadProvider } from './LeadProvider';
import { LeadSheet } from './LeadSheet';
import { MagnetPreview } from './MagnetPreview';
import { Faq, Footer, Hero, HowItWorks, ProofStrip } from './Sections';
import { HeroTools } from './HeroTools';
import { SiteHeader } from './SiteHeader';

/**
 * 5 krátkých sekcí (zdůvodnění v README): hero = slib reklamy + oba nástroje v jedné kartě → důkaz a důvěra v jednom pásu
 * → jak to funguje (3 kroky) → magnet + formulář → FAQ. Výzva „Přehled zdarma“ je navíc stále v lepkavém headeru.
 */
export function Landing({ variant }: { variant: Variant }) {
  return (
    <LeadProvider variant={variant}>
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-lg focus:bg-white focus:px-4 focus:py-2">Přeskočit na obsah</a>
      <SiteHeader />
      <main id="main" data-variant={variant}>
        <Hero variant={variant} tool={<HeroTools variant={variant} />} />
        <ProofStrip />
        <HowItWorks />
        <MagnetPreview />
        <Faq />
      </main>
      <Footer />
      <LeadSheet />
    </LeadProvider>
  );
}
