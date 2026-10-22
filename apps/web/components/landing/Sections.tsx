/* Serverové sekce landing page. Interaktivní části (nástroje, formuláře) jsou klientské ostrůvky. */
import { data, exactTickers } from '@etfd/shared';
import { FAQ } from '@/lib/content';
import { fmtDate, formatPct, host } from '@etfd/shared';
import type { Variant } from '@etfd/shared';
import { Calculator, Chart, Check, Layers, Link, Mail, Search, ShieldCheck, Target } from '@/components/ui/icons';
import { Term } from '@/components/ui/Term';
import { FaqList } from './FaqList';
import { LeadForm } from './LeadForm';
import { ReportCover } from './ReportCover';
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

/** Důkaz hned pod hero: čtyři velká čísla (dopočítají se při zobrazení) + odkud data jsou */
export function ProofStrip() {
  const minTer = Math.min(...data.pairs.map((p) => p.twin.ter_pct));
  return (
    <section aria-labelledby="proof-title" className="bg-paper py-12 sm:py-16">
      <div className="wrap">
        <div className="reveal flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="eyebrow">Ověřená data</p>
            <h2 id="proof-title" className="mt-2 font-display text-[26px] leading-tight font-bold text-ink sm:text-[32px]">Žádné odhady. Každé číslo má zdroj.</h2>
          </div>
          <p className="text-[14px] text-muted">Data k {fmtDate(data.as_of)}</p>
        </div>
        <div className="stagger mt-6 grid grid-cols-2 gap-3 sm:mt-8 sm:gap-4 lg:grid-cols-4">
          <StatCard icon={<Layers />} value={data.pairs.length} label="amerických ETF z NYSE s evropským dvojčetem" />
          <StatCard icon={<Target />} value={exactTickers.length} label="dvojčat sleduje přesně stejný index" />
          <StatCard icon={<Chart />} value={minTer} decimals={2} suffix={'\u00a0%'} label="nejnižší roční poplatek dvojčete" />
          <StatCard icon={<Link />} value={data.sources.length} label="ověřených zdrojů s odkazem a datem" />
        </div>
        <div className="reveal mt-6 flex flex-wrap items-center gap-x-2.5 gap-y-2 text-[13px] text-muted sm:mt-8">
          <span className="mr-1 font-medium text-text">Data přímo od</span>
          {['Vanguard', 'iShares', 'SPDR', 'justETF', 'zákony ČR'].map((x) => (
            <span key={x} className="rounded-full border border-line bg-white px-3 py-1.5 font-semibold text-ink transition-colors hover:border-teal-500">{x}</span>
          ))}
        </div>
      </div>
    </section>
  );
}

const SECOND: Record<Variant, { eyebrow: string; title: string; lead: string; points: [React.ReactNode, string][] }> = {
  // varianta A má v hero vyhledávač → druhý nástroj je kalkulačka
  twin: {
    eyebrow: 'Kalkulačka poplatků',
    title: 'Kolik vás stojí fond z banky oproti ETF?',
    lead: 'Akciový fond z banky a ETF na stejný trh se liší hlavně cenou. Za 20 let z toho jsou statisíce.',
    points: [[<Calculator key="c" />, 'Vstupní poplatek i roční náklady podle KID'], [<Chart key="ch" />, 'Včetně ušlého zhodnocení, ne jen součet poplatků'], [<ShieldCheck key="s" />, 'Transakční náklady fondu nepočítáme – srovnání nenafukujeme']],
  },
  fees: {
    eyebrow: 'Vyhledávač dvojčat',
    title: 'Chtěli jste VOO nebo SPY? Tady je jejich evropská verze.',
    lead: 'Na YouTube radí americká ETF, v aplikaci je nenajdete. Klepněte na ticker a uvidíte dvojče, které si koupíte.',
    points: [[<Search key="se" />, 'ISIN ke zkopírování do aplikace brokera'], [<Target key="t" />, 'Stejný, nebo nejbližší index – vždy s vysvětlením'], [<Link key="l" />, 'Zdroj u každého čísla']],
  },
};

export function SecondTool({ variant, tool }: { variant: Variant; tool: React.ReactNode }) {
  const s = SECOND[variant];
  return (
    <section id="nastroj" aria-labelledby="second-title" className="relative overflow-hidden bg-teal-900 py-14 text-white sm:py-20">
      <div className="facets" aria-hidden="true" />
      <div className="reveal wrap relative grid grid-cols-1 items-start gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:gap-14">
        <div className="lg:sticky lg:top-28 lg:pt-6">
          <p className="eyebrow eyebrow-light">{s.eyebrow}</p>
          <h2 id="second-title" className="mt-3 font-display text-[clamp(28px,4.2vw,44px)] leading-[1.08] font-bold text-balance">{s.title}</h2>
          <p className="mt-4 max-w-[30em] text-[16.5px] leading-relaxed text-white/75">{s.lead}</p>
          <ul className="mt-6 hidden space-y-3 sm:block">
            {s.points.map(([icon, text]) => (
              <li key={text} className="flex items-center gap-3 text-[15px] text-white/90">
                <span className="grid h-10 w-10 flex-none place-items-center rounded-xl bg-white/8 text-[#9fd1cb] [&_svg]:h-5 [&_svg]:w-5">{icon}</span>{text}
              </li>
            ))}
          </ul>
        </div>
        <div className="text-text">{tool}</div>
      </div>
    </section>
  );
}

export function Trust() {
  const items = [
    { icon: <ShieldCheck />, t: 'Nejsme broker ani poradce', d: 'Nic neprodáváme a od brokerů ani správců fondů nebereme provize. Ukazujeme, co si můžete koupit a kolik to stojí – rozhodnutí je vaše.' },
    { icon: <Link />, t: 'Každé číslo má zdroj', d: `Poplatky a ISIN od emitentů a z justETF, daňová pravidla ze zákona. U každého údaje je odkaz a datum (${fmtDate(data.as_of)}).` },
    { icon: <Mail />, t: 'E-mail jen na přehled a tipy', d: 'Pošleme přehled a pár tipů během dvou týdnů. E-mail nikomu neprodáváme, odhlásíte se jedním klikem. Bez reklamních cookies.' },
  ];
  return (
    <section aria-labelledby="trust-title" className="bg-white py-14 sm:py-20">
      <div className="wrap">
        <div className="reveal">
          <p className="eyebrow">Férově</p>
          <h2 id="trust-title" className="h2 mt-3 max-w-[16em]">Proč nám můžete věřit</h2>
        </div>
        <ul className="stagger mt-8 grid gap-4 md:grid-cols-3 md:gap-5">
          {items.map((c, i) => (
            <li key={c.t} className="lift card group relative overflow-hidden p-6 shadow-none sm:p-8">
              <div className="flex items-center justify-between">
                <span className="icon-tile transition-colors duration-300 group-hover:bg-teal-800 group-hover:text-white">{c.icon}</span>
                <span className="font-display text-[34px] leading-none font-bold text-teal-100 transition-colors duration-300 group-hover:text-teal-200">0{i + 1}</span>
              </div>
              <h3 className="mt-6 text-[19px] font-bold text-ink sm:text-[21px]">{c.t}</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-muted sm:text-[16px]">{c.d}</p>
              <span aria-hidden="true" className="absolute inset-x-0 bottom-0 h-[3px] origin-left scale-x-0 bg-gradient-to-r from-teal-700 to-brick transition-transform duration-500 group-hover:scale-x-100" />
            </li>
          ))}
        </ul>
        <p className="reveal mt-6 text-[13.5px] text-muted"><b className="text-ink">Nejde o investiční doporučení.</b> Investice nesou riziko, minulé výnosy nezaručují budoucí.</p>
      </div>
    </section>
  );
}

export function Faq() {
  return (
    <section aria-labelledby="faq-title" className="bg-paper py-14 sm:py-20">
      <div className="wrap max-w-[820px]">
        <p className="eyebrow">FAQ</p>
        <h2 id="faq-title" className="h2 mt-3">Časté otázky</h2>
        <FaqList items={FAQ} />
      </div>
    </section>
  );
}

export function FinalCta() {
  return (
    <section aria-labelledby="final-title" className="bg-paper pb-16 sm:pb-24">
      <div className="wrap">
        <div className="reveal relative overflow-hidden rounded-[28px] bg-teal-900 px-5 py-10 text-white sm:px-12 sm:py-14">
          <div className="facets" aria-hidden="true" />
          <div className="absolute top-1/2 right-14 hidden -translate-y-1/2 lg:block"><div className="animate-float"><ReportCover /></div></div>
          <div className="relative max-w-[640px]">
            <p className="eyebrow eyebrow-light">Zdarma · hned na obrazovce</p>
            <h2 id="final-title" className="mt-3 font-display text-[clamp(28px,4.4vw,44px)] leading-[1.08] font-bold text-balance">Ušetřete si hodiny hledání na justETF.</h2>
            <p className="mt-3 text-[16.5px] text-white/75">Všech {data.pairs.length} dvojčat s ISIN a poplatky + návod na první nákup. Hned po odeslání.</p>
            <div className="mt-6"><LeadForm name="final" cta="Chci přehled" tone="dark" /></div>
          </div>
        </div>
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
