/* Šablony e-mailové sekvence. Továrna dostane veřejnou adresu webu z konfigurace (odkazy, odhlášení). */
import { data, fmtDate, formatPct, type SequenceStep } from '@etfd/shared';

export function createTemplates(site: string) {
  const C = { ink: '#163b3b', text: '#24302f', muted: '#5d6f6e', brick: '#a63d36', line: '#dfe7e5', mint: '#eef4f2' };

  /** Odkaz přes /api/r změří klik (skóre leadu) a přesměruje jen na cestu v rámci webu */
  const link = (token: string, step: string, to: string) =>
    `${site}/api/r?t=${encodeURIComponent(token)}&s=${step}&to=${encodeURIComponent(to)}`;

  const button = (href: string, label: string) =>
    `<p style="margin:28px 0"><a href="${href}" style="background:${C.brick};color:#fff;padding:14px 22px;border-radius:12px;text-decoration:none;font-weight:bold;display:inline-block">${label}</a></p>`;

  const src = (f: { url: string; label: string }) => ` <a href="${f.url}" style="color:${C.muted};font-size:12px">(zdroj: ${f.label})</a>`;

  function layout(token: string, body: string) {
    return `<div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:auto;color:${C.text};font-size:16px;line-height:1.55">
      <p style="font-weight:bold;color:${C.ink};font-size:15px;margin:0 0 24px">ETF <span style="color:${C.brick}">dvojčata</span></p>
      ${body}
      <hr style="border:0;border-top:1px solid ${C.line};margin:32px 0 16px">
      <p style="font-size:12px;color:${C.muted}">Data k ${fmtDate(data.as_of)}. Nejde o investiční doporučení – investice nesou riziko.<br>
      Tento e-mail jste dostali, protože jste si na webu vyžádali přehled ETF dvojčat.
      <a href="${site}/unsubscribe?t=${encodeURIComponent(token)}" style="color:${C.muted}">Odhlásit se jedním klikem</a> · <a href="${site}/privacy" style="color:${C.muted}">Ochrana údajů</a></p>
    </div>`;
  }

  const h1 = (t: string) => `<h1 style="font-family:Georgia,serif;color:${C.ink};font-size:26px;line-height:1.2;margin:0 0 16px">${t}</h1>`;

  const templates: Record<SequenceStep, (token: string) => string> = {
    d0_report: (token) => {
      const rows = data.pairs
        .map(
          (p) => `
        <tr>
          <td style="padding:10px 6px;border-bottom:1px solid ${C.line};color:${C.muted};text-decoration:line-through">${p.us.ticker}</td>
          <td style="padding:10px 6px;border-bottom:1px solid ${C.line}"><b>${p.twin.ticker}</b><br><span style="font-family:monospace;font-size:13px;color:${C.muted}">${p.twin.isin}</span></td>
          <td style="padding:10px 6px;border-bottom:1px solid ${C.line};text-align:right">${formatPct(p.twin.ter_pct)}</td>
        </tr>`,
        )
        .join('');
      return `${h1('Vaše ETF dvojčata')}
        <p>Tady je slíbený přehled. ISIN zkopírujte do vyhledávání ve své aplikaci (XTB, Trading 212, DEGIRO…) – je jednoznačný, ticker se mezi burzami liší.</p>
        <table style="width:100%;border-collapse:collapse;font-size:14px">
          <tr style="text-align:left;color:${C.muted};font-size:12px"><th style="padding:6px">USA</th><th style="padding:6px">Dvojče v EU</th><th style="padding:6px;text-align:right">TER</th></tr>${rows}
        </table>
        ${button(link(token, 'd0_report', '/report'), 'Celý přehled s daněmi a zdroji')}
        <p style="color:${C.muted};font-size:14px">Za dva dny vám pošleme krátký návod, jak dvojče koupit za 3 minuty.</p>`;
    },
    d2_howto: (token) => `${h1('Jak koupit ETF dvojče za 3 minuty')}
      <ol style="padding-left:20px">
        <li style="margin-bottom:10px"><b>Otevřete aplikaci brokera</b> a dejte vyhledat <b>ISIN</b>, ne ticker. Např. pro S&amp;P 500: <span style="font-family:monospace">${data.pairs[0].twin.isin}</span>.</li>
        <li style="margin-bottom:10px"><b>Vyberte burzu Xetra a měnu EUR</b> (nebo Londýn v USD). Akumulační verze („Acc“) dividendy sama reinvestuje – v přiznání je neřešíte.</li>
        <li style="margin-bottom:10px"><b>Nastavte pravidelný nákup.</b> Pravidelná částka každý měsíc je jednodušší než hledat „správný okamžik“.</li>
      </ol>
      <p style="background:${C.mint};padding:14px 16px;border-radius:12px;font-size:14px">${data.facts.brokers.cs}${src(data.facts.brokers)}</p>
      ${button(link(token, 'd2_howto', '/report'), 'Najít ISIN svého dvojčete')}`,
    d5_tax: (token) => `${h1('Daně z ETF v Česku: 3 pravidla')}
      <p><b>1. Časový test.</b> ${data.facts.time_test.cs}${src(data.facts.time_test)}</p>
      <p><b>2. Malé prodeje.</b> ${data.facts.value_limit.cs}${src(data.facts.value_limit)}</p>
      <p><b>3. Dividendy.</b> ${data.facts.dividends.cs}${src(data.facts.dividends)}</p>
      <p style="color:${C.muted};font-size:14px">Zjednodušeno pro fyzické osoby mimo podnikání. U vlastní situace se poraďte s daňovým poradcem.</p>
      ${button(link(token, 'd5_tax', '/report#taxes'), 'Daně v přehledu')}`,
    d9_check: (token) => `${h1('Už máte první ETF?')}
      <p>Většina lidí, kteří si přehled stáhnou, se zasekne u stejné věci: aplikace brokera ukazuje 5 verzí téhož fondu a nevědí, kterou vybrat.</p>
      <p>Když chcete, <b>projdeme to s vámi po telefonu</b> – 10 minut, zdarma a nezávazně. Nic neprodáváme, jen pomůžeme dvojče najít a nastavit pravidelný nákup.</p>
      ${button(link(token, 'd9_check', `/help?t=${encodeURIComponent(token)}`), 'Chci pomoct s prvním nákupem')}
      <p style="color:${C.muted};font-size:14px">Nepotřebujete? V pořádku – tohle je poslední e-mail ze série.</p>`,
  };

  return { layout, templates };
}
