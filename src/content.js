/* Texty, které stojí na ověřených faktech z data/etfs.json (facts.*). Každé tvrzení má odkaz na zdroj. */

const src = (f) => (f?.url ? ` <a class="faq__src" href="${f.url}" target="_blank" rel="noopener">Zdroj: ${f.label}</a>` : '');

export function faq(data) {
  const f = data.facts;
  return [
    {
      q: 'Proč si VOO nebo SPY nekoupím u evropského brokera?',
      a: `<p>Evropská regulace PRIIPs vyžaduje, aby fond prodávaný drobným investorům měl dokument KID (sdělení klíčových informací). Americké fondy ho nevydávají, takže je evropský broker běžnému klientovi nabídnout nesmí.${src(f.priips)}</p>
          <p>${f.priips_broker?.cs || ''}${src(f.priips_broker)}</p>
          <p>Výjimka: ${f.elective_pro?.cs || ''} Přicházíte tím ale o část ochrany drobného investora.${src(f.elective_pro)}</p>`,
    },
    {
      q: 'Je evropské dvojče opravdu to samé?',
      a: `<p>U ${data.pairs.filter((p) => p.match === 'exact').map((p) => p.us.ticker).join(', ')} ano – dvojče sleduje <b>stejný index</b>, často od stejného správce. U ostatních jde o nejbližší dostupnou alternativu a v přehledu vždy píšeme, v čem se liší.</p>
          <p>Rozdíl je v „obalu“: dvojče sídlí v Irsku, má KID v češtině a obvykle si můžete vybrat akumulační verzi, která dividendy sama reinvestuje.</p>`,
    },
    {
      q: 'Jak je to s daněmi v Česku?',
      a: `<p><b>Časový test:</b> ${f.time_test?.cs || 'Pokud ETF držíte déle než 3 roky, zisk z prodeje je osvobozený od daně.'}${src(f.time_test)}</p>
          <p><b>Malé prodeje:</b> ${f.value_limit?.cs || ''}${src(f.value_limit)}</p>
          <p><b>Dividendy:</b> ${f.dividends?.cs || 'U akumulačního irského fondu dividendy nepřiznáváte – fond je reinvestuje sám.'}${src(f.dividends)}</p>`,
    },
    {
      q: 'Kde dvojče koupím a kolik to stojí?',
      a: `<p>${f.brokers?.cs || 'U většiny brokerů dostupných v Česku. ISIN zkopírujte do vyhledávání v aplikaci.'}${src(f.brokers)}</p>
          <p>Než nakoupíte, ověřte si v aplikaci, že fond u vás má KID a jaký je poplatek za nákup.</p>`,
    },
    {
      q: 'Kdo za stránkou stojí a co uděláte s mým e-mailem?',
      a: `<p>Přehled je zdarma. E-mail použijeme k zaslání přehledu a občasných tipů k ETF – odhlásíte se jedním klikem. Nic neprodáváme a nejsme broker. Nejde o investiční doporučení.</p>`,
    },
  ];
}

export function howToBuy() {
  return `<ol class="steps">
    <li><b>Otevřete aplikaci brokera</b> (XTB, Trading 212, DEGIRO, Interactive Brokers, Fio…).</li>
    <li><b>Do vyhledávání vložte ISIN</b> dvojčete – je jednoznačný, ticker se mezi burzami liší.</li>
    <li><b>Vyberte burzu Xetra a měnu EUR</b> (případně Londýn v USD). Akumulační verze („Acc“) dividendy sama reinvestuje.</li>
  </ol>`;
}

export function taxSection(data) {
  const f = data.facts;
  const items = [
    ['Časový test 3 roky', f.time_test],
    ['Příjmy z prodeje do limitu', f.value_limit],
    ['Strop osvobození', f.cap],
    ['Dividendy a akumulační fondy', f.dividends],
  ].filter(([, x]) => x?.cs);
  if (!items.length) return '';
  return `<h2>Daně v Česku stručně</h2>
    <ol class="steps">${items.map(([t, x]) => `<li><b>${t}.</b> ${x.cs}${src(x)}</li>`).join('')}</ol>
    <p class="muted">Zjednodušeno pro fyzické osoby, které neobchodují v rámci podnikání. U vlastní situace se poraďte s daňovým poradcem.</p>`;
}
