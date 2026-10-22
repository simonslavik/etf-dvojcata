import type { Metadata } from 'next';
import { Shell } from '@/components/Shell';

export const metadata: Metadata = { title: 'Ochrana osobních údajů – ETF dvojčata', robots: { index: false } };

export default function Privacy() {
  return (
    <Shell narrow>
      <article className="space-y-4 text-[16px] leading-relaxed text-text [&_h2]:mt-8 [&_h2]:text-[20px] [&_h2]:font-bold [&_h2]:text-ink [&_li]:ml-5 [&_li]:list-disc">
        <h1 className="h2">Ochrana osobních údajů</h1>
        <p><b>Správce:</b> [doplnit provozovatele – název, IČO, sídlo, kontaktní e-mail]. <em>(Ukázkový projekt – před spuštěním reklamy doplnit a nechat zkontrolovat právníkem.)</em></p>
        <h2>Jaké údaje zpracováváme</h2>
        <ul>
          <li><b>E-mail</b>, který zadáte do formuláře, a volitelně odpověď, kolik měsíčně investujete.</li>
          <li><b>Telefon</b> – jen pokud sami požádáte o pomoc s nákupem a zaškrtnete souhlas.</li>
          <li><b>Kontext návštěvy</b>: zdroj (UTM parametry reklamy), typ zařízení, na které ETF jste klikli, a kliky v našich e-mailech.</li>
          <li><b>Anonymní měření</b> průchodu stránkou bez cookies – náhodné ID platné jen do zavření záložky.</li>
        </ul>
        <h2>Proč</h2>
        <ul>
          <li>Abychom vám poslali vyžádaný přehled (plnění vaší žádosti).</li>
          <li>Abychom vám během dvou týdnů poslali 3 navazující tipy k ETF (oprávněný zájem). Odhlásit se můžete odkazem v každém e-mailu.</li>
          <li>Abychom vám zavolali, pokud o to požádáte (souhlas). Kontakt pro hovor předáváme jen [doplnit – vlastní tým / partner].</li>
        </ul>
        <h2>Jak dlouho</h2>
        <p>Do odhlášení, nejdéle 3 roky od posledního kontaktu. Anonymní statistiky průběžně agregujeme.</p>
        <h2>Vaše práva</h2>
        <p>Máte právo na přístup, opravu, výmaz, omezení zpracování, přenositelnost a vznést námitku. Stížnost můžete podat u Úřadu pro ochranu osobních údajů (uoou.gov.cz).</p>
        <p><a className="src-link" href="/">← Zpět na přehled ETF dvojčat</a></p>
      </article>
    </Shell>
  );
}
