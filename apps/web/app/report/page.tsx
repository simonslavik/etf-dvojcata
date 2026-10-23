import type { Metadata } from 'next';
import { data, exactTickers, fmtDate, formatPct } from '@etfd/shared';
import { HOW_TO_BUY, Src } from '@/lib/content';
import { Shell } from '@/components/Shell';
import { PrintButton } from '@/components/ui/PrintButton';
import { TrackView } from '@/components/TrackView';
import { CallOffer } from '@/components/report/CallOffer';
import { ReportNav } from '@/components/report/ReportNav';
import { TwinList } from '@/components/report/TwinList';
import { Check, Phone, Search } from '@/components/ui/icons';

export const metadata: Metadata = { title: `Přehled ${data.pairs.length} ETF dvojčat`, robots: { index: false } };

const f = data.facts;
const minTer = Math.min(...data.pairs.map((p) => p.twin.ter_pct));
// otevřít aplikaci · vyhledat ISIN · vybrat burzu a koupit
const STEP_ICONS = [<Phone key="p" />, <Search key="s" />, <Check key="c" />];

/* Daně: klíčové číslo velkým písmem, vysvětlení a zdroj pod ním */
const TAX = [
  { big: '3 roky', t: 'Časový test', d: f.time_test.cs, f: f.time_test },
  { big: '100 000 Kč', t: 'Malé prodeje', d: f.value_limit.cs, f: f.value_limit },
  { big: 'Acc', t: 'Dividendy', d: f.dividends.cs, f: f.dividends },
];

export default function ReportPage() {
  return (
    <Shell action={<PrintButton />}>
      <TrackView event="report_view" />

      {/* Úvod */}
      <p className="eyebrow">Váš přehled · data k {fmtDate(data.as_of)}</p>
      <h1 className="mt-3 font-display text-[clamp(30px,5vw,48px)] leading-[1.05] font-bold text-ink">
        {data.pairs.length} ETF dvojčat <span className="text-brick">+ návod na první nákup</span>
      </h1>
      <p className="mt-3 max-w-[40em] text-[16.5px] leading-relaxed text-muted">Evropské verze amerických ETF z burzy NYSE, které si jako investor z Česka koupíte. Najděte své ETF, zkopírujte ISIN a vložte ho do aplikace brokera.</p>
      <dl className="mt-6 grid grid-cols-3 gap-2.5 sm:max-w-[560px]">
        {[[String(data.pairs.length), 'dvojčat'], [String(exactTickers.length), 'se stejným indexem'], [formatPct(minTer), 'nejnižší TER']].map(([v, l]) => (
          <div key={l} className="card flex flex-col-reverse border-t-[3px] border-t-teal-700 p-3 shadow-none sm:p-4">
            <dt className="mt-1 text-[12.5px] text-muted">{l}</dt>
            <dd className="num font-display text-[24px] leading-none font-bold text-ink sm:text-[28px]">{v}</dd>
          </div>
        ))}
      </dl>

      {/* Přilepená navigace po sekcích */}
      <ReportNav />

      {/* Jak koupit */}
      <section id="navod" aria-labelledby="navod-title" className="mt-10">
        <h2 id="navod-title" className="font-display text-[26px] font-bold text-ink sm:text-[30px]">Jak dvojče koupit</h2>
        <ol className="mt-4 grid gap-3 sm:grid-cols-3">
          {HOW_TO_BUY.map((s, i) => (
            <li key={s.t} className="card flex items-start gap-4 p-4 shadow-none sm:flex-col sm:p-5">
              <span className="relative grid h-12 w-12 flex-none place-items-center rounded-2xl bg-teal-800 text-white [&_svg]:h-5 [&_svg]:w-5">
                {STEP_ICONS[i]}
                <span className="absolute -top-2 -right-2 grid h-5 w-5 place-items-center rounded-full bg-brick text-[11px] font-bold text-white ring-2 ring-white">{i + 1}</span>
              </span>
              <div>
                <p className="font-semibold text-ink">{s.t}</p>
                <p className="mt-1 text-[14px] leading-snug text-muted">{s.d}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* Dvojčata */}
      <section id="dvojcata" aria-labelledby="dvojcata-title" className="mt-12">
        <h2 id="dvojcata-title" className="font-display text-[26px] font-bold text-ink sm:text-[30px]">Všechna dvojčata</h2>
        <p className="mt-1 mb-4 text-[14.5px] text-muted">Najděte své americké ETF a zkopírujte ISIN jeho evropské verze.</p>
        <TwinList />
      </section>

      {/* Daně */}
      <section id="dane" aria-labelledby="dane-title" className="mt-12">
        <h2 id="dane-title" className="font-display text-[26px] font-bold text-ink sm:text-[30px]">Daně v Česku stručně</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {TAX.map((x) => (
            <div key={x.t} className="card p-5 shadow-none">
              <p className="font-display text-[28px] leading-none font-bold text-brick">{x.big}</p>
              <p className="mt-2 font-semibold text-ink">{x.t}</p>
              <p className="mt-1 text-[14px] leading-relaxed text-muted">{x.d}<Src f={x.f} /></p>
            </div>
          ))}
        </div>
        <p className="mt-3 text-[13px] text-muted">Zjednodušeno pro fyzické osoby mimo podnikání. U vlastní situace se poraďte s daňovým poradcem.</p>
      </section>

      <CallOffer />

      <p className="mt-12 border-t border-line pt-5 text-[13px] text-muted">
        <b className="text-ink">Co v přehledu není:</b> {data.excluded.map((e) => e.ticker).join(', ')} – obchodují se na burze Nasdaq, ne na NYSE. Údaje jsou orientační, před nákupem si je ověřte v dokumentu KID u svého brokera. Nejde o investiční doporučení.
      </p>
    </Shell>
  );
}
