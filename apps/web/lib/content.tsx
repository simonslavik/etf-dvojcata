/* Texty, které stojí na ověřených faktech z data/etfs.json (facts.*). Každé tvrzení má odkaz na zdroj. */
import type { ReactNode } from 'react';
import { data, exactTickers, type Fact } from '@etfd/shared';

export const Src = ({ f }: { f: Fact }) => (
  <> <a className="src-link text-[0.85em] text-muted" href={f.url} target="_blank" rel="noopener">Zdroj: {f.label}</a></>
);

const f = data.facts;

export const FAQ: { q: string; a: ReactNode }[] = [
  {
    q: 'Proč si VOO nebo SPY nekoupím u evropského brokera?',
    a: <>
      <p>Evropská regulace PRIIPs vyžaduje, aby fond prodávaný drobným investorům měl dokument KID (sdělení klíčových informací). Americké fondy ho nevydávají, takže je evropský broker běžnému klientovi nabídnout nesmí.<Src f={f.priips} /></p>
      <p>{f.priips_broker.cs}<Src f={f.priips_broker} /></p>
      <p>Výjimka: {f.elective_pro.cs} Přicházíte tím ale o část ochrany drobného investora.<Src f={f.elective_pro} /></p>
    </>,
  },
  {
    q: 'Je evropské dvojče opravdu to samé?',
    a: <>
      <p>U {exactTickers.join(', ')} ano – dvojče sleduje <b>stejný index</b>, často od stejného správce. U ostatních jde o nejbližší dostupnou alternativu a v přehledu vždy píšeme, v čem se liší.</p>
      <p>Rozdíl je v „obalu“: dvojče sídlí v Irsku, má KID v češtině a obvykle si můžete vybrat akumulační verzi, která dividendy sama reinvestuje.</p>
    </>,
  },
  {
    q: 'Jak je to s daněmi v Česku?',
    a: <>
      <p><b>Časový test:</b> {f.time_test.cs}<Src f={f.time_test} /></p>
      <p><b>Malé prodeje:</b> {f.value_limit.cs}<Src f={f.value_limit} /></p>
      <p><b>Dividendy:</b> {f.dividends.cs}<Src f={f.dividends} /></p>
    </>,
  },
  {
    q: 'Kde dvojče koupím a kolik to stojí?',
    a: <>
      <p>{f.brokers.cs}<Src f={f.brokers} /></p>
      <p>Než nakoupíte, ověřte si v aplikaci, že fond u vás má KID a jaký je poplatek za nákup.</p>
    </>,
  },
  {
    q: 'Kdo za stránkou stojí a co uděláte s mým e-mailem?',
    a: <p>Přehled je zdarma. E-mail použijeme k zaslání přehledu a několika tipů k ETF během prvních dvou týdnů – odhlásíte se jedním klikem. Telefon chceme jen tehdy, když sami požádáte o pomoc s nákupem. Nejsme broker a nejde o investiční doporučení.</p>,
  },
];

export const HOW_TO_BUY = [
  { t: 'Otevřete aplikaci brokera', d: 'XTB, Trading 212, DEGIRO, Interactive Brokers, Fio…' },
  { t: 'Do vyhledávání vložte ISIN dvojčete', d: 'Je jednoznačný – ticker se mezi burzami liší.' },
  { t: 'Vyberte burzu Xetra a měnu EUR', d: 'Případně Londýn v USD. Akumulační verze („Acc“) dividendy sama reinvestuje.' },
];

export const TAX = [
  { t: 'Časový test 3 roky', f: f.time_test },
  { t: 'Příjmy z prodeje do limitu', f: f.value_limit },
  { t: 'Strop osvobození', f: f.cap },
  { t: 'Dividendy a akumulační fondy', f: f.dividends },
];
