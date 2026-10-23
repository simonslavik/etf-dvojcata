import { data, fmtDate } from '@etfd/shared';

/** Obálka lead magnetu – návštěvník vidí konkrétní „věc“, kterou dostane (čisté CSS, žádný obrázek) */
export function ReportCover({ size = 'md' }: { size?: 'sm' | 'md' }) {
  const sm = size === 'sm';
  return (
    <div aria-hidden="true" className={`relative ${sm ? 'w-[92px]' : 'w-[200px] sm:w-[230px]'}`}>
      {/* druhý list za obálkou */}
      <div className="absolute inset-0 translate-x-2 translate-y-2 rotate-[3deg] rounded-xl border border-line bg-white shadow-card" />
      <div className={`relative overflow-hidden rounded-xl border border-line bg-white shadow-float ${sm ? 'p-2' : 'p-4'} rotate-[-2deg]`}>
        <div className={`flex items-center justify-between rounded-lg bg-teal-900 text-white ${sm ? 'px-1.5 py-1' : 'px-3 py-2'}`}>
          <span className={`font-semibold ${sm ? 'text-[7px]' : 'text-[11px]'}`}>
            ETF <span className="text-[#9fd1cb]">dvojčata</span>
          </span>
          <span className={`rounded bg-brick font-bold ${sm ? 'px-1 text-[6px]' : 'px-1.5 py-0.5 text-[9px]'}`}>PDF</span>
        </div>
        <p className={`font-display leading-tight font-bold text-ink ${sm ? 'mt-1.5 text-[9px]' : 'mt-3 text-[17px]'}`}>
          {data.pairs.length} ETF dvojčat + první nákup
        </p>
        {!sm && <p className="mt-1 text-[10px] text-muted">Data k {fmtDate(data.as_of)}</p>}
        <div className={`space-y-1 ${sm ? 'mt-1.5' : 'mt-3 space-y-1.5'}`}>
          {data.pairs.slice(0, sm ? 3 : 5).map((p) => (
            <div key={p.us.ticker} className={`flex items-center justify-between rounded bg-paper ${sm ? 'px-1 py-0.5' : 'px-2 py-1'}`}>
              <span className={`font-mono font-bold text-muted line-through ${sm ? 'text-[6px]' : 'text-[9px]'}`}>{p.us.ticker}</span>
              <span className={`font-mono font-bold text-ink ${sm ? 'text-[6px]' : 'text-[9px]'}`}>{p.twin.ticker}</span>
            </div>
          ))}
        </div>
        {!sm && (
          <div className="mt-3 flex gap-1.5 text-[9px] font-semibold">
            <span className="rounded-full bg-teal-50 px-2 py-0.5 text-teal-700">ISIN</span>
            <span className="rounded-full bg-teal-50 px-2 py-0.5 text-teal-700">Poplatky</span>
            <span className="rounded-full bg-brick-50 px-2 py-0.5 text-brick">Daně v ČR</span>
          </div>
        )}
      </div>
    </div>
  );
}
