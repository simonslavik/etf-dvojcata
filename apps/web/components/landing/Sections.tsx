import type { ReactNode } from 'react';
import Link from 'next/link';
/* Serverové sekce landing page. Interaktivní části (nástroje, formuláře) jsou klientské ostrůvky. */
import { data, exactTickers, fmtDate, formatPct, host, type Variant } from '@etfd/shared';
import { FAQ } from '@/lib/content';
import { Chart, Check, Copy, Layers, LinkIcon, Mail, Pointer, Search, ShieldCheck, Target } from '@/components/ui/icons';
import { Logo } from '@/components/ui/Logo';
import { Term } from '@/components/ui/Term';
import { FaqList } from './FaqList';
import { StatCard } from './StatCard';

const HERO: Record<Variant, { eyebrow: string; title: [string, string]; lead: ReactNode; short: ReactNode }> = {
  twin: {
    eyebrow: 'ETF · UCITS · pro investory z Česka',
    title: ['VOO si v Česku nekoupíte.', 'Jeho dvojče ano.'],
    lead: (
      <>
        Evropský broker vám americká ETF kvůli regulaci <Term k="PRIIPs" /> neprodá. Ukážeme vám jejich evropskou verzi se stejným indexem –
        i&nbsp;s&nbsp;
        <Term k="ISIN" />, který zadáte do aplikace.
      </>
    ),
    short: (
      <>
        Americká ETF vám evropský broker neprodá. Tady je jejich evropská verze – i&nbsp;s&nbsp;
        <Term k="ISIN" /> do aplikace.
      </>
    ),
  },
  fees: {
    eyebrow: 'Poplatky · pro investory z Česka',
    title: [
      `Fond z banky si bere až ${formatPct(Math.round(data.calc.bank.ter_pct * 10) / 10)} ročně.`,
      `ETF jen ${formatPct(data.calc.etf.ter_pct)}.`,
    ],
    lead: (
      <>
        Spočítejte si, kolik vám fond z banky za roky sebere na poplatcích – a které evropské <Term k="UCITS">ETF</Term> na S&amp;P&nbsp;500
        si místo něj koupíte.
      </>
    ),
    short: (
      <>
        Posuňte posuvníky a uvidíte, kolik vám s <Term k="UCITS">ETF</Term> zůstane navíc.
      </>
    ),
  },
};

export function Hero({ variant, tool }: { variant: Variant; tool: ReactNode }) {
  const h = HERO[variant];
  return (
    <section data-hero aria-labelledby="hero-title" className="relative overflow-hidden bg-gradient-to-b from-white to-paper">
      {/* Šikmé plochy v pozadí – světlá verze motivu z clientelo.cz */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 hidden lg:block">
        <div className="absolute -top-20 right-[-8%] h-[130%] w-[46%] skew-x-[-24deg] bg-teal-50/80" />
        <div className="absolute top-[30%] right-[-12%] h-[90%] w-[30%] skew-x-[-24deg] bg-teal-100/40" />
      </div>
      <div className="wrap relative grid grid-cols-1 items-center gap-5 pt-5 pb-8 sm:gap-7 sm:pt-8 sm:pb-10 lg:grid-cols-[1fr_minmax(0,500px)] lg:gap-14 lg:pt-10 lg:pb-14">
        <div>
          <p className="eyebrow">{h.eyebrow}</p>
          <h1
            id="hero-title"
            className="mt-2.5 font-display text-[clamp(31px,5.2vw,56px)] leading-[1.05] font-bold tracking-[-0.015em] text-balance text-ink"
          >
            {h.title[0]} <span className="text-brick">{h.title[1]}</span>
          </h1>
          <p className="mt-3 text-[16px] leading-snug text-muted sm:hidden">{h.short}</p>
          <p className="mt-4 hidden max-w-[34em] text-[19px] leading-relaxed text-muted sm:block">{h.lead}</p>
          <p className="mt-6 hidden items-center gap-2 text-[14.5px] text-muted lg:flex">
            <Check className="h-4 w-4 text-ok" />
            Zdarma, bez registrace · výsledek hned
          </p>
        </div>
        <div className="relative animate-rise-late">{tool}</div>
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
          <StatCard icon={<LinkIcon />} value={data.sources.length} label="ověřených zdrojů" />
        </div>
        <ul className="reveal mt-4 flex flex-wrap gap-x-5 gap-y-2 text-[13.5px] text-text sm:text-[14.5px]">
          {[
            [<ShieldCheck key="s" />, 'Nejsme broker, nebereme provize'],
            [<Mail key="m" />, 'Žádný spam, odhlášení 1 klikem'],
            [<LinkIcon key="l" />, `Zdroje: Vanguard, iShares, SPDR, justETF, zákony ČR · k ${fmtDate(data.as_of)}`],
          ].map(([icon, t]) => (
            <li key={String(t)} className="flex items-center gap-2 [&_svg]:h-4 [&_svg]:w-4 [&_svg]:flex-none [&_svg]:text-teal-600">
              {icon}
              {t}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

const SECOND: Record<Variant, { eyebrow: string; title: string; lead: string }> = {
  // varianta A má v hero vyhledávač → tady kalkulačka; varianta B naopak
  twin: {
    eyebrow: 'Kalkulačka poplatků',
    title: 'Máte peníze ve fondu z banky?',
    lead: 'Spočítejte si, kolik vás za roky stojí oproti ETF na stejný trh.',
  },
  fees: {
    eyebrow: 'Vyhledávač dvojčat',
    title: 'Chtěli jste VOO nebo SPY?',
    lead: 'V aplikaci je nenajdete. Klepněte na ticker a uvidíte evropskou verzi, kterou koupíte.',
  },
};

/** Druhý nástroj jako vlastní kompaktní sekce – v hero je vždy jen jeden (podle reklamy), bez přepínače */
export function SecondTool({ variant, tool }: { variant: Variant; tool: ReactNode }) {
  const s = SECOND[variant];
  return (
    <section id="tool-2" aria-labelledby="second-title" className="relative overflow-hidden bg-teal-900 py-10 text-white sm:py-14">
      <div className="facets" aria-hidden="true" />
      <div className="reveal wrap relative grid grid-cols-1 items-center gap-6 lg:grid-cols-[1fr_minmax(0,500px)] lg:gap-14">
        <div>
          <p className="eyebrow eyebrow-light">{s.eyebrow}</p>
          <h2 id="second-title" className="mt-2 font-display text-[clamp(26px,4vw,40px)] leading-[1.08] font-bold text-balance">
            {s.title}
          </h2>
          <p className="mt-3 max-w-[30em] text-[15.5px] leading-relaxed text-white/75 sm:text-[17px]">{s.lead}</p>
        </div>
        <div className="text-text">{tool}</div>
      </div>
    </section>
  );
}

/** Jak to funguje: 3 kroky od tickeru k nákupu. Odpovídá na „a co s tím udělám?“ a navazuje na návod v přehledu. */
export function HowItWorks() {
  const steps = [
    { icon: <Search />, t: 'Najděte dvojče', d: 'Klepněte na americké ETF a uvidíte jeho evropskou verzi.' },
    { icon: <Copy />, t: 'Zkopírujte ISIN', d: 'Jednoznačný kód fondu – ticker se mezi burzami liší.' },
    { icon: <Pointer />, t: 'Kupte v aplikaci', d: 'XTB, Trading 212, DEGIRO… vložte ISIN a hotovo.' },
  ];
  return (
    <section aria-labelledby="how-title" className="bg-white py-10 sm:py-14">
      <div className="wrap">
        <div className="reveal flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="eyebrow">Jak to funguje</p>
            <h2 id="how-title" className="mt-2 font-display text-[26px] leading-tight font-bold text-ink sm:text-[32px]">
              Od tickeru k nákupu ve 3 krocích
            </h2>
          </div>
          <p className="text-[14px] text-muted">Podrobný návod je v přehledu zdarma.</p>
        </div>
        <ol className="stagger relative mt-6 grid gap-3 sm:mt-8 sm:gap-5 md:grid-cols-3">
          {/* spojnice kroků – na desktopu se při scrollu „nakreslí“ zleva doprava */}
          <span
            aria-hidden="true"
            className="how-line absolute top-[42px] right-[16%] left-[16%] hidden h-[2px] origin-left bg-gradient-to-r from-teal-200 via-teal-500 to-brick md:block"
          />
          {steps.map((s, i) => (
            <li
              key={s.t}
              className="lift card group relative flex items-start gap-4 p-4 shadow-none md:flex-col md:items-center md:p-6 md:text-center"
            >
              <span className="relative grid h-14 w-14 flex-none place-items-center rounded-2xl bg-teal-800 text-white shadow-[0_10px_24px_-12px_rgb(22_59_59/0.6)] transition-transform duration-300 group-hover:-rotate-6 [&_svg]:h-6 [&_svg]:w-6">
                {s.icon}
                <span className="absolute -top-2 -right-2 grid h-6 w-6 place-items-center rounded-full bg-brick text-[12px] font-bold text-white ring-2 ring-white">
                  {i + 1}
                </span>
              </span>
              <div>
                <p className="text-[17px] font-bold text-ink">{s.t}</p>
                <p className="mt-1 text-[14.5px] leading-snug text-muted">{s.d}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

export function Faq() {
  return (
    <section aria-labelledby="faq-title" className="bg-paper pt-10 pb-8 sm:pt-16 sm:pb-10">
      <div className="wrap max-w-[820px]">
        <p className="eyebrow">FAQ</p>
        <h2 id="faq-title" className="h2 mt-3">
          Časté otázky
        </h2>
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
        <p className="max-w-[60em]">
          <b className="text-ink">Nejde o investiční doporučení.</b> Informace mají vzdělávací charakter. Investice nesou riziko, minulé
          výnosy nezaručují budoucí. Poplatky a údaje se mohou měnit – u každého údaje uvádíme zdroj a datum.
        </p>
        <details className="group">
          <summary className="cursor-pointer font-semibold text-ink">Zdroje dat ({data.sources.length})</summary>
          <ul className="mt-3 grid gap-1.5 sm:grid-cols-2">
            {data.sources.map((s) => (
              <li key={s.url + s.label}>
                {s.label} –{' '}
                <a className="src-link" href={s.url} target="_blank" rel="noopener">
                  {host(s.url)}
                </a>{' '}
                ({fmtDate(s.accessed)})
              </li>
            ))}
          </ul>
        </details>
        <p>
          <Link className="src-link" href="/privacy">
            Ochrana osobních údajů
          </Link>
        </p>
      </div>
    </footer>
  );
}
