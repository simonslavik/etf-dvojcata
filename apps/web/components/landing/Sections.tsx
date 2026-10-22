/* Serverové sekce landing page. Interaktivní části (nástroje, formuláře) jsou klientské ostrůvky. */
import { data, exactTickers, fmtDate, formatPct, host, type Variant } from '@etfd/shared';
import { FAQ } from '@/lib/content';
import { Chart, Check, Layers, Link, Mail, ShieldCheck, Target } from '@/components/ui/icons';
import { Term } from '@/components/ui/Term';
import { FaqList } from './FaqList';
import { StatCard } from './StatCard';

export function Logo() {
  return (
    <a href="/" className="inline-flex items-center gap-2.5 text-[19px] font-bold tracking-tight text-ink">
      <svg viewBox="0 0 32 32" className="h-8 w-8" aria-hidden="true">
        <rect x="3" y="6" width="17" height="17" rx="5" fill="var(--color-teal-800)" />
        <rect x="12" y="10" width="17" height="17" rx="5" fill="var(--color-brick)" fillOpacity=".92" />
      </svg>
      <span>ETF <span className="text-teal-600">dvojčata</span></span>
    </a>
  );
}

const HERO: Record<Variant, { eyebrow: string; title: [string, string]; lead: React.ReactNode; short: React.ReactNode }> = {
  twin: {
    eyebrow: 'ETF · UCITS · pro investory z Česka',
    title: ['VOO si v Česku nekoupíte.', 'Jeho dvojče ano.'],
    lead: <>Evropský broker vám americká ETF kvůli regulaci <Term k="PRIIPs" /> neprodá. Ukážeme vám jejich evropskou verzi se stejným indexem – i&nbsp;s&nbsp;<Term k="ISIN" />, který zadáte do aplikace.</>,
    short: <>Americká ETF vám evropský broker neprodá. Tady je jejich evropská verze – i&nbsp;s&nbsp;<Term k="ISIN" /> do aplikace.</>,
  },
  fees: {
    eyebrow: 'Poplatky · pro investory z Česka',
    title: [`Fond z banky si bere až ${formatPct(Math.round(data.calc.bank.ter_pct * 10) / 10)} ročně.`, `ETF jen ${formatPct(data.calc.etf.ter_pct)}.`],
    lead: <>Spočítejte si, kolik vám fond z banky za 20 let sebere – a které evropské <Term k="UCITS">ETF</Term> na S&amp;P&nbsp;500 si místo něj koupíte.</>,
    short: <>Spočítejte si, kolik vám fond z banky sebere – a které <Term k="UCITS">ETF</Term> koupit místo něj.</>,
  },
};

export function Hero({ variant, tool }: { variant: Variant; tool: React.ReactNode }) {
  const h = HERO[variant];
  return (
    <section data-hero aria-labelledby="hero-title" className="relative overflow-hidden bg-gradient-to-b from-white to-paper">
      {/* Šikmé plochy v pozadí – světlá verze motivu z clientelo.cz */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 hidden lg:block">
        <div className="absolute -top-20 right-[-8%] h-[130%] w-[46%] skew-x-[-24deg] bg-teal-50/80" />
        <div className="absolute top-[30%] right-[-12%] h-[90%] w-[30%] skew-x-[-24deg] bg-teal-100/40" />
      </div>
      <div className="wrap relative grid grid-cols-1 items-center gap-5 pt-5 pb-8 sm:gap-7 sm:pt-10 sm:pb-10 lg:grid-cols-[1.02fr_1fr] lg:gap-14 lg:pt-16 lg:pb-20">
        <div>
          <p className="eyebrow">{h.eyebrow}</p>
          <h1 id="hero-title" className="mt-2.5 font-display text-[clamp(31px,6.4vw,64px)] leading-[1.04] font-bold tracking-[-0.015em] text-ink text-balance">
            {h.title[0]} <span className="text-brick">{h.title[1]}</span>
          </h1>
          <p className="mt-3 text-[16px] leading-snug text-muted sm:hidden">{h.short}</p>
          <p className="mt-4 hidden max-w-[34em] text-[19px] leading-relaxed text-muted sm:block">{h.lead}</p>
          <ul className="mt-6 hidden gap-x-6 gap-y-2 text-[15px] text-text lg:flex lg:flex-wrap">
            {['Zdarma, bez registrace', 'Každý údaj se zdrojem', 'Nejsme broker'].map((x) => (
              <li key={x} className="flex items-center gap-2"><Check className="h-4 w-4 text-ok" />{x}</li>
            ))}
          </ul>
        </div>
        <div className="animate-rise-late relative">{tool}</div>
      </div>
    </section>
  );
}

/** Důkaz hned pod hero: čtyři čísla (dopočítají se při zobrazení) + odkud data jsou. Kompaktní – jen to podstatné. */
export function ProofStrip() {
  const minTer = Math.min(...data.pairs.map((p) => p.twin.ter_pct));
  return (
    <section aria-labelledby="proof-title" className="bg-paper py-8 sm:py-12">
      <div className="wrap">
        <h2 id="proof-title" className="reveal text-[15px] font-semibold text-ink sm:text-[17px]">
          Žádné odhady – <span className="text-brick">každé číslo má zdroj</span>
        </h2>
        <div className="stagger mt-4 grid grid-cols-2 gap-2.5 sm:gap-4 lg:grid-cols-4">
          <StatCard icon={<Layers />} value={data.pairs.length} label="ETF dvojčat" />
          <StatCard icon={<Target />} value={exactTickers.length} label="se stejným indexem" />
          <StatCard icon={<Chart />} value={minTer} decimals={2} suffix={'\u00a0%'} label="nejnižší poplatek" />
          <StatCard icon={<Link />} value={data.sources.length} label="ověřených zdrojů" />
        </div>
        <ul className="reveal mt-4 flex flex-wrap gap-x-5 gap-y-2 text-[13.5px] text-text sm:text-[14.5px]">
          {[
            [<ShieldCheck key="s" />, 'Nejsme broker, nebereme provize'],
            [<Mail key="m" />, 'Žádný spam, odhlášení 1 klikem'],
            [<Link key="l" />, `Zdroje: Vanguard, iShares, SPDR, justETF, zákony ČR · k ${fmtDate(data.as_of)}`],
          ].map(([icon, t]) => (
            <li key={String(t)} className="flex items-center gap-2 [&_svg]:h-4 [&_svg]:w-4 [&_svg]:flex-none [&_svg]:text-teal-600">{icon}{t}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export function Faq() {
  return (
    <section aria-labelledby="faq-title" className="bg-paper py-10 sm:py-16">
      <div className="wrap max-w-[820px]">
        <p className="eyebrow">FAQ</p>
        <h2 id="faq-title" className="h2 mt-3">Časté otázky</h2>
        <FaqList items={FAQ} />
      </div>
    </section>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-line bg-paper py-10 text-[13.5px] text-muted">
      <div className="wrap space-y-4">
        <Logo />
        <p className="max-w-[60em]"><b className="text-ink">Nejde o investiční doporučení.</b> Informace mají vzdělávací charakter. Investice nesou riziko, minulé výnosy nezaručují budoucí. Poplatky a údaje se mohou měnit – u každého údaje uvádíme zdroj a datum.</p>
        <details className="group">
          <summary className="cursor-pointer font-semibold text-ink">Zdroje dat ({data.sources.length})</summary>
          <ul className="mt-3 grid gap-1.5 sm:grid-cols-2">
            {data.sources.map((s) => (
              <li key={s.url + s.label}>{s.label} – <a className="src-link" href={s.url} target="_blank" rel="noopener">{host(s.url)}</a> ({fmtDate(s.accessed)})</li>
            ))}
          </ul>
        </details>
        <p><a className="src-link" href="/privacy">Ochrana osobních údajů</a></p>
      </div>
    </footer>
  );
}
