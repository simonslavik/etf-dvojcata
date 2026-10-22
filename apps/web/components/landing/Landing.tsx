import type { Variant } from '@etfd/shared';
import { FeeCalculator } from './FeeCalculator';
import { LeadProvider } from './LeadProvider';
import { LeadSheet } from './LeadSheet';
import { MagnetPreview } from './MagnetPreview';
import { Faq, FinalCta, Footer, Header, Hero, SecondTool, Stats, Trust, Why } from './Sections';
import { StickyCta } from './StickyCta';
import { TwinFinder } from './TwinFinder';

/**
 * Pořadí sekcí (zdůvodnění v README):
 * hero = slib reklamy + funkční nástroj → čísla → druhý nástroj → náhled magnetu + formulář → proč → důvěra → FAQ → závěrečné CTA
 * Varianta B (poplatky) jen prohodí nástroje: kalkulačka v hero, vyhledávač níž.
 */
export function Landing({ variant }: { variant: Variant }) {
  const [first, second] = variant === 'fees' ? [<FeeCalculator key="c" title="Kolik vás stojí fond z banky oproti ETF?" />, <TwinFinder key="f" />] : [<TwinFinder key="f" />, <FeeCalculator key="c" />];
  return (
    <LeadProvider variant={variant}>
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-lg focus:bg-white focus:px-4 focus:py-2">Přeskočit na obsah</a>
      <Header />
      <main id="main" data-variant={variant}>
        <Hero variant={variant} tool={first} />
        <Stats />
        <SecondTool variant={variant} tool={second} />
        <MagnetPreview />
        <Why />
        <Trust />
        <Faq />
        <FinalCta />
      </main>
      <Footer />
      <StickyCta />
      <LeadSheet />
    </LeadProvider>
  );
}
