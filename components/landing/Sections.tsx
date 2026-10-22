/* Serverové sekce landing page. Interaktivní části (nástroje, formuláře) jsou klientské ostrůvky. */
import { data, exactTickers } from '@/lib/data';
import { FAQ } from '@/lib/content';
import { fmtDate, formatPct, host } from '@/lib/format';
import type { Variant } from '@/lib/events';
import { ArrowRight, Ban, Calculator, Chart, Check, Database, Layers, Link, Mail, Pointer, Search, ShieldCheck, Target } from '@/components/ui/icons';
import { Term } from '@/components/ui/Term';
import { FaqList } from './FaqList';
import { HeaderCta } from './HeaderCta';
import { LeadForm } from './LeadForm';

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

export function Header() {
  return (
    <header className="border-b border-line/70 bg-white">
      <div className="wrap flex h-16 items-center justify-between gap-4 sm:h-20">
        <Logo />
        <div className="flex items-center gap-4">
          <span className="hidden items-center gap-2 rounded-full bg-paper px-3 py-1.5 text-[13px] text-muted sm:inline-flex">
            <span className="h-2 w-2 rounded-full bg-ok shadow-[0_0_0_3px_var(--color-ok-50)]" aria-hidden="true" />
            Data k {fmtDate(data.as_of)}
          </span>
          <HeaderCta />
        </div>
      </div>
    </header>
  );
}

const HERO: Record<Variant, { eyebrow: string; title: [string, string]; lead: React.ReactNode }> = {
  twin: {
    eyebrow: 'ETF · UCITS · pro investory z Česka',
    title: ['VOO si v Česku nekoupíte.', 'Jeho dvojče ano.'],
    lead: <>Evropský broker vám americká ETF kvůli regulaci <Term k="PRIIPs" /> neprodá. Ukážeme vám jejich evropskou verzi se stejným indexem – i&nbsp;s&nbsp;<Term k="ISIN" />, který zadáte do aplikace.</>,
  },
  fees: {
    eyebrow: 'Poplatky · pro investory z Česka',
    title: [`Fond z banky si bere až ${formatPct(Math.round(data.calc.bank.ter_pct * 10) / 10)} ročně.`, `ETF jen ${formatPct(data.calc.etf.ter_pct)}.`],
    lead: <>Spočítejte si, kolik vám fond z banky za 20 let sebere – a které evropské <Term k="UCITS">ETF</Term> na S&amp;P&nbsp;500 si místo něj koupíte.</>,
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
      <div className="wrap relative grid grid-cols-1 items-center gap-7 pt-6 pb-10 sm:pt-10 lg:grid-cols-[1.02fr_1fr] lg:gap-14 lg:pt-16 lg:pb-20">
        <div>
          <p className="eyebrow">{h.eyebrow}</p>
          <h1 id="hero-title" className="mt-3 font-display text-[clamp(34px,6.4vw,64px)] leading-[1.04] font-bold tracking-[-0.015em] text-ink text-balance">
            {h.title[0]} <span className="text-brick">{h.title[1]}</span>
          </h1>
          <p className="mt-4 max-w-[34em] text-[16.5px] leading-relaxed text-muted sm:text-[19px]">{h.lead}</p>
          <ul className="mt-6 hidden gap-x-6 gap-y-2 text-[15px] text-text lg:flex lg:flex-wrap">
            {['Zdarma, bez registrace', 'Každý údaj se zdrojem', 'Nejsme broker'].map((x) => (
              <li key={x} className="flex items-center gap-2"><Check className="h-4 w-4 text-ok" />{x}</li>
            ))}
          </ul>
        </div>
        <div className="relative">{tool}</div>
      </div>
    </section>
  );
}

export function Stats() {
  const minTer = Math.min(...data.pairs.map((p) => p.twin.ter_pct));
  const items = [
    { icon: <Layers />, v: String(data.pairs.length), l: 'amerických ETF z NYSE s evropským dvojčetem' },
    { icon: <Target />, v: String(exactTickers.length), l: 'dvojčat sleduje přesně stejný index' },
    { icon: <Chart />, v: formatPct(minTer), l: 'nejnižší roční poplatek dvojčete' },
    { icon: <Link />, v: '100 %', l: 'údajů má odkaz na zdroj a datum' },
  ];
  return (
    <section aria-label="Přehled v číslech" className="bg-paper pb-12 sm:pb-16">
      <div className="wrap grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {items.map((s) => (
          <div key={s.l} className="card border-t-[3px] border-t-teal-700 p-4 sm:p-6">
            <span className="icon-tile !h-10 !w-10 sm:!h-12 sm:!w-12">{s.icon}</span>
            <p className="mt-3 text-[28px] leading-none font-bold text-ink sm:mt-4 sm:text-[36px]">{s.v}</p>
            <p className="mt-1.5 text-[13px] leading-snug text-muted sm:text-[14.5px]">{s.l}</p>
          </div>
        ))}
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
      <div className="wrap relative grid grid-cols-1 items-center gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:gap-14">
        <div>
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

export function Why() {
  const flow = ['Americké ETF', 'Nemá KID', 'Broker nesmí prodat', 'Evropské dvojče'];
  const steps = [
    { icon: <ShieldCheck />, t: 'Regulace PRIIPs', d: <>Fond prodávaný drobným investorům v&nbsp;EU musí mít dokument <Term k="KID" /> v&nbsp;češtině.</> },
    { icon: <Ban />, t: 'Americké fondy ho nemají', d: <>Emitenti VOO, SPY či IVV evropský KID nevydávají, takže je broker drobnému investorovi nesmí prodat.</> },
    { icon: <Pointer />, t: 'Řešení je evropské dvojče', d: <>Stejný nebo podobný index, často stejný správce, sídlo v&nbsp;Irsku – a&nbsp;KID má. Koupíte ho na burze Xetra nebo v&nbsp;Londýně.</> },
  ];
  return (
    <section aria-labelledby="why-title" className="bg-white py-14 sm:py-20">
      <div className="wrap">
        <p className="eyebrow">Proč to v aplikaci nenajdete</p>
        <h2 id="why-title" className="h2 mt-3 max-w-[18em]">Proč vám evropský broker VOO neprodá</h2>

        {/* „Pipeline“ řetězec jako v dashboardu Clientela */}
        <ol className="mt-8 flex flex-wrap items-center gap-2 text-[14px]" aria-label="Postup">
          {flow.map((x, i) => (
            <li key={x} className="flex items-center gap-2">
              <span className={`rounded-full border px-3.5 py-1.5 font-medium ${i === flow.length - 1 ? 'border-teal-800 bg-teal-800 text-white' : 'border-line bg-white text-ink'}`}>{x}</span>
              {i < flow.length - 1 && <ArrowRight className="h-4 w-4 text-teal-200" />}
            </li>
          ))}
        </ol>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {steps.map((s, i) => (
            <div key={s.t} className="card p-6 shadow-none">
              <div className="flex items-center justify-between">
                <span className="icon-tile">{s.icon}</span>
                <span className="font-display text-[34px] font-bold text-teal-100">0{i + 1}</span>
              </div>
              <h3 className="mt-5 text-[19px] font-bold text-ink">{s.t}</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-muted">{s.d}</p>
            </div>
          ))}
        </div>
        <p className="mt-5 text-[13px] text-muted">Zdroj: <a className="src-link" href={data.facts.priips.url} target="_blank" rel="noopener">{data.facts.priips.label}</a></p>
      </div>
    </section>
  );
}

export function Trust() {
  const cards = [
    { icon: <ShieldCheck />, t: 'Nejsme broker ani poradce', d: 'Nic neprodáváme a od brokerů ani správců fondů nebereme provize. Ukazujeme, co si můžete koupit a kolik to stojí – rozhodnutí je vaše.' },
    { icon: <Link />, t: 'Každé číslo má zdroj', d: `Poplatky, ISIN i daňová pravidla jsme ověřili u emitentů, na justETF a v zákonech. U každého údaje je odkaz a datum (${fmtDate(data.as_of)}).` },
    { icon: <Mail />, t: 'E-mail jen na přehled a tipy', d: 'Pošleme přehled a pár tipů během dvou týdnů. E-mail nikomu neprodáváme, odhlásíte se jedním klikem v každém e-mailu.' },
    { icon: <Database />, t: 'Data podle GDPR', d: 'Bez reklamních cookies. Návštěvu měříme anonymně a telefon chceme jen tehdy, když sami požádáte o pomoc.' },
  ];
  return (
    <section aria-labelledby="trust-title" className="bg-paper py-14 sm:py-20">
      <div className="wrap">
        <p className="eyebrow">Férově</p>
        <h2 id="trust-title" className="h2 mt-3 max-w-[16em]">Kdo za tím stojí a co s vaším e-mailem</h2>
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {cards.map((c) => (
            <div key={c.t} className="card p-6 shadow-none transition-colors hover:border-teal-500 sm:p-8">
              <span className="icon-tile">{c.icon}</span>
              <h3 className="mt-5 text-[19px] font-bold text-ink sm:text-[21px]">{c.t}</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-muted sm:text-[16px]">{c.d}</p>
            </div>
          ))}
        </div>
        <p className="mt-6 rounded-2xl border border-line bg-white px-5 py-4 text-[15px] text-muted sm:px-6">
          <b className="text-ink">Nejde o investiční doporučení.</b> Investice nesou riziko, minulé výnosy nezaručují budoucí. Před nákupem si údaje ověřte v dokumentu KID u svého brokera.
        </p>
      </div>
    </section>
  );
}

export function Faq() {
  return (
    <section aria-labelledby="faq-title" className="bg-white py-14 sm:py-20">
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
    <section aria-labelledby="final-title" className="bg-white pb-16 sm:pb-24">
      <div className="wrap">
        <div className="relative overflow-hidden rounded-[28px] bg-teal-900 px-5 py-10 text-white sm:px-12 sm:py-14">
          <div className="facets" aria-hidden="true" />
          <div className="relative max-w-[640px]">
            <p className="eyebrow eyebrow-light">Zdarma · hned na obrazovce</p>
            <h2 id="final-title" className="mt-3 font-display text-[clamp(28px,4.4vw,44px)] leading-[1.08] font-bold text-balance">Ušetřete si hodiny hledání na justETF.</h2>
            <p className="mt-3 text-[16.5px] text-white/75">Všech {data.pairs.length} dvojčat, ISIN a poplatky na jedné stránce. Hned po odeslání.</p>
            <div className="mt-6"><LeadForm name="final" cta="Chci přehled" tone="dark" /></div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-line bg-paper py-10 pb-28 text-[13.5px] text-muted sm:pb-10">
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
        <p><a className="src-link" href="/soukromi">Ochrana osobních údajů</a></p>
      </div>
    </footer>
  );
}
