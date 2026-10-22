const LABELS = {
  page_view: 'Příchod na stránku', finder_select: 'Klik na ETF', calc_change: 'Použil kalkulačku', cta_click: 'Klik na CTA',
  form_view: 'Viděl formulář', form_start: 'Začal psát e-mail', form_submit: 'Odeslal formulář', lead_ok: 'Lead uložen', qualify: 'Odpověděl na kvalifikaci',
};
const el = document.getElementById('stats');
const token = new URLSearchParams(location.search).get('token') || '';

fetch(`/api/stats?token=${encodeURIComponent(token)}`)
  .then((r) => r.json())
  .then((s) => {
    if (s.error) { el.innerHTML = `<p class="warn">Chyba: ${s.error}</p>`; return; }
    const pct = (a, b) => (b ? `${((a / b) * 100).toFixed(1)} %` : '–');
    const rows = s.funnel.map((e) => {
      const all = s.counts.all[e] || 0;
      const base = s.counts.all.page_view || 0;
      return `<tr><td>${LABELS[e] || e}</td>
        <td><span class="fbar" style="width:${base ? Math.round((all / base) * 120) : 0}px"></span>${all}</td>
        <td>${pct(all, base)}</td>
        <td>${s.counts.twin[e] || 0} <small>(${pct(s.counts.twin[e], s.counts.twin.page_view)})</small></td>
        <td>${s.counts.fees[e] || 0} <small>(${pct(s.counts.fees[e], s.counts.fees.page_view)})</small></td></tr>`;
    }).join('');
    el.innerHTML = `
      <h1>Funnel</h1>
      <p class="muted">Unikátní relace v každém kroku · leadů celkem: <b>${s.leads}</b> · vygenerováno ${new Date(s.generated).toLocaleString('cs-CZ')}</p>
      ${s.mode === 'memory' ? '<p class="warn">Úložiště běží v paměti (chybí UPSTASH_REDIS_REST_URL/TOKEN) – čísla se ztratí při restartu.</p>' : ''}
      ${s.emailEnabled ? '' : '<p class="warn">Odesílání e-mailů je vypnuté (chybí RESEND_API_KEY / RESEND_FROM).</p>'}
      <table><thead><tr><th>Krok</th><th>Relace</th><th>% z příchodů</th><th>Varianta A – dvojčata</th><th>Varianta B – poplatky</th></tr></thead><tbody>${rows}</tbody></table>`;
  })
  .catch(() => { el.innerHTML = '<p class="warn">Nepodařilo se načíst /api/stats.</p>'; });
