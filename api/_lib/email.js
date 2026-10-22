/** E-mail s přehledem přes Resend (volitelné – bez RESEND_API_KEY se nic neodešle). */
export const emailEnabled = Boolean(process.env.RESEND_API_KEY && process.env.RESEND_FROM);

export async function sendReport(to, { origin, pairs, asOf }) {
  if (!emailEnabled) return { sent: false, reason: 'disabled' };
  const rows = pairs.map((p) => `
    <tr>
      <td style="padding:8px 6px;border-bottom:1px solid #eee;font-family:monospace;color:#8a8273;text-decoration:line-through">${p.us.ticker}</td>
      <td style="padding:8px 6px;border-bottom:1px solid #eee"><b style="font-family:monospace">${p.twin.ticker}</b><br><span style="font-size:12px;color:#5b6764">${p.twin.isin}</span></td>
      <td style="padding:8px 6px;border-bottom:1px solid #eee;text-align:right">${String(p.twin.ter_pct).replace('.', ',')} %</td>
    </tr>`).join('');
  const html = `
  <div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;color:#1b2624">
    <h1 style="font-family:Georgia,serif;color:#0f2f2c;font-size:24px">Vaše ETF dvojčata</h1>
    <p>Tady je slíbený přehled. ISIN zkopírujte do vyhledávání ve své aplikaci (XTB, Trading 212, DEGIRO…).</p>
    <table style="width:100%;border-collapse:collapse;font-size:14px">
      <tr style="text-align:left;color:#5b6764;font-size:12px"><th style="padding:6px">USA</th><th style="padding:6px">Dvojče v EU</th><th style="padding:6px;text-align:right">TER</th></tr>
      ${rows}
    </table>
    <p style="margin:24px 0"><a href="${origin}/prehled.html?utm_source=email&utm_medium=report" style="background:#b23a2e;color:#fff;padding:12px 18px;border-radius:10px;text-decoration:none;font-weight:bold">Celý přehled s daněmi a zdroji</a></p>
    <p style="font-size:12px;color:#5b6764">Data k ${asOf}. Nejde o investiční doporučení. <a href="${origin}/soukromi.html">Odhlásit / ochrana údajů</a></p>
  </div>`;
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'content-type': 'application/json' },
    body: JSON.stringify({ from: process.env.RESEND_FROM, to, subject: 'Vaše ETF dvojčata – přehled', html }),
  });
  return { sent: r.ok, reason: r.ok ? null : `resend ${r.status}` };
}
