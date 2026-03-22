/**
 * PDF generation using browser print API — no external dependencies.
 * Opens a styled print window that the browser saves as PDF.
 */

const BRAND = '#1B6B7B'
const NAVY  = '#0D2B33'

function printHTML(html, filename) {
  const win = window.open('', '_blank', 'width=900,height=700')
  if (!win) { alert('Please allow popups to download reports.'); return }
  win.document.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>${filename}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, sans-serif; font-size: 13px; color: #1a1a2e; background: #fff; }
    .header { background: ${BRAND}; color: #fff; padding: 18px 28px; display: flex; justify-content: space-between; align-items: center; }
    .header-left h1 { font-size: 20px; font-weight: 800; letter-spacing: 1px; }
    .header-left p  { font-size: 11px; opacity: 0.8; margin-top: 2px; }
    .header-right   { font-size: 11px; text-align: right; opacity: 0.85; }
    .body { padding: 24px 28px; }
    .title { font-size: 18px; font-weight: 700; color: ${NAVY}; margin-bottom: 4px; }
    .subtitle { font-size: 12px; color: #666; margin-bottom: 6px; }
    .meta { font-size: 11px; color: #888; margin-bottom: 20px; padding-bottom: 12px; border-bottom: 2px solid ${BRAND}; }
    .stat-row { display: flex; gap: 14px; margin-bottom: 24px; }
    .stat-box { flex: 1; border-radius: 8px; padding: 14px 10px; text-align: center; color: #fff; }
    .stat-box .val { font-size: 26px; font-weight: 800; }
    .stat-box .lbl { font-size: 10px; margin-top: 4px; opacity: 0.9; }
    .section-title { font-size: 13px; font-weight: 700; color: ${NAVY}; margin: 20px 0 8px; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; }
    th { background: ${BRAND}; color: #fff; padding: 9px 12px; text-align: left; font-weight: 600; }
    td { padding: 8px 12px; border-bottom: 1px solid #e8ecf4; }
    tr:nth-child(even) td { background: #f5f8ff; }
    .badge-red    { color: #dc2626; font-weight: 700; }
    .badge-green  { color: #16a34a; font-weight: 700; }
    .badge-yellow { color: #d97706; font-weight: 700; }
    .footer { margin-top: 32px; padding-top: 12px; border-top: 1px solid #e5e7eb; font-size: 10px; color: #aaa; text-align: center; }
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="header-left">
      <h1>MARGDARSHAK</h1>
      <p>Rural Health Triage System</p>
    </div>
    <div class="header-right">
      Generated: ${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}<br/>
      Confidential — Official Use Only
    </div>
  </div>
  <div class="body">
    ${html}
    <div class="footer">Margdarshak Health System &nbsp;|&nbsp; ${filename} &nbsp;|&nbsp; Confidential</div>
  </div>
  <div class="no-print" style="text-align:center;padding:16px;background:#E8F4F7;">
    <button onclick="window.print()" style="background:${BRAND};color:#fff;border:none;padding:10px 28px;border-radius:6px;font-size:14px;cursor:pointer;font-weight:600;">
      Save as PDF / Print
    </button>
    <p style="font-size:11px;color:#888;margin-top:8px;">In the print dialog, choose "Save as PDF" as the destination.</p>
  </div>
</body>
</html>`)
  win.document.close()
  setTimeout(() => win.print(), 600)
}

function statBoxHTML(value, label, color) {
  return `<div class="stat-box" style="background:${color}"><div class="val">${value}</div><div class="lbl">${label}</div></div>`
}

function tableHTML(headers, rows, colorCol) {
  const head = headers.map(h => `<th>${h}</th>`).join('')
  const body = rows.map(row => {
    const cells = row.map((cell, i) => {
      let cls = ''
      if (colorCol && i === colorCol.index) {
        const v = String(cell).toUpperCase()
        if (v === 'RED' || v === 'OVERLOADED' || v === 'INACTIVE' || v === 'CRITICAL') cls = 'badge-red'
        else if (v === 'GREEN' || v === 'NORMAL' || v === 'ACTIVE') cls = 'badge-green'
        else if (v === 'YELLOW' || v === 'MODERATE' || v === 'LOW' || v === 'HIGH') cls = 'badge-yellow'
      }
      return `<td class="${cls}">${cell ?? '—'}</td>`
    }).join('')
    return `<tr>${cells}</tr>`
  }).join('')
  return `<table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>`
}

// ── Weekly / Custom Summary ──────────────────────────────────────────────────
export function generateSummaryPDF(data, title = 'Weekly District Summary') {
  const { total_assessments: total = 0, triage_breakdown: tb = {}, top_symptoms = [], opd_deflection_estimate = 0, district = 'Beed', period = {} } = data

  const html = `
    <div class="title">${title}</div>
    <div class="subtitle">${period.from || ''} to ${period.to || ''}</div>
    <div class="meta">District: ${district}</div>
    <div class="stat-row">
      ${statBoxHTML(total, 'Total Assessments', BRAND)}
      ${statBoxHTML(tb.RED || 0, 'Emergency (RED)', '#dc2626')}
      ${statBoxHTML(tb.YELLOW || 0, 'Clinic (YELLOW)', '#d97706')}
      ${statBoxHTML(opd_deflection_estimate, 'OPD Deflected', '#16a34a')}
    </div>
    <div class="section-title">Triage Distribution</div>
    ${tableHTML(
      ['Triage Level', 'Count', '% of Total'],
      [
        ['RED — Emergency',    tb.RED || 0,    total ? `${Math.round((tb.RED||0)/total*100)}%` : '0%'],
        ['YELLOW — Visit Clinic', tb.YELLOW || 0, total ? `${Math.round((tb.YELLOW||0)/total*100)}%` : '0%'],
        ['GREEN — Self Care',  tb.GREEN || 0,  total ? `${Math.round((tb.GREEN||0)/total*100)}%` : '0%'],
      ]
    )}
    ${top_symptoms.length > 0 ? `
    <div class="section-title">Top Reported Symptoms</div>
    ${tableHTML(['#', 'Symptom', 'Cases'], top_symptoms.map((s, i) => [i+1, s.symptom, s.count]))}
    ` : ''}
  `
  printHTML(html, `${title.replace(/\s+/g,'_')}_${new Date().toISOString().slice(0,10)}`)
}

// ── ASHA Performance ─────────────────────────────────────────────────────────
export function generateAshaPerformancePDF(ashas = [], district = 'Beed') {
  const total   = ashas.length
  const active  = ashas.filter(a => (a.assessments_this_week || 0) > 0).length
  const avgRate = total > 0 ? Math.round(ashas.reduce((s, a) => s + (a.followup_rate || 0), 0) / total) : 0

  const html = `
    <div class="title">ASHA Performance Report</div>
    <div class="subtitle">Worker activity and follow-up metrics — This Week</div>
    <div class="meta">District: ${district}</div>
    <div class="stat-row">
      ${statBoxHTML(total, 'Total ASHAs', BRAND)}
      ${statBoxHTML(active, 'Active This Week', '#16a34a')}
      ${statBoxHTML(`${avgRate}%`, 'Avg Follow-up Rate', '#d97706')}
    </div>
    <div class="section-title">Worker Activity</div>
    ${tableHTML(
      ['Name', 'Block', 'This Week', 'Follow-ups Done', 'Follow-up Rate', 'Status'],
      ashas.map(a => [
        a.name || '—', a.block || '—',
        a.assessments_this_week || 0,
        a.followups_completed || 0,
        `${a.followup_rate || 0}%`,
        (a.assessments_this_week || 0) === 0 ? 'INACTIVE' : (a.assessments_this_week || 0) < 5 ? 'LOW' : 'ACTIVE',
      ]),
      { index: 5 }
    )}
  `
  printHTML(html, `ASHA_Performance_${new Date().toISOString().slice(0,10)}`)
}

// ── PHC Load ─────────────────────────────────────────────────────────────────
export function generatePHCLoadPDF(phcs = [], district = 'Beed') {
  const overloaded = phcs.filter(f => f.status === 'OVERLOADED').length
  const total = phcs.reduce((s, f) => s + (f.referrals_today || 0), 0)

  const html = `
    <div class="title">PHC Load Analysis</div>
    <div class="subtitle">Referral distribution and facility load — Today</div>
    <div class="meta">District: ${district}</div>
    <div class="stat-row">
      ${statBoxHTML(phcs.length, 'Total Facilities', BRAND)}
      ${statBoxHTML(total, 'Total Referrals Today', '#16a34a')}
      ${statBoxHTML(overloaded, 'Overloaded', '#dc2626')}
    </div>
    <div class="section-title">Facility Load</div>
    ${tableHTML(
      ['Facility', 'Block', 'Referrals Today', 'Status'],
      phcs.map(f => [f.name || '—', f.block || '—', f.referrals_today || 0, f.status || '—']),
      { index: 3 }
    )}
  `
  printHTML(html, `PHC_Load_${new Date().toISOString().slice(0,10)}`)
}

// ── Outbreak Log ─────────────────────────────────────────────────────────────
export function generateOutbreakPDF(alerts = [], district = 'Beed') {
  const active   = alerts.filter(a => a.status === 'ACTIVE').length
  const critical = alerts.filter(a => a.severity === 'CRITICAL').length

  const html = `
    <div class="title">Outbreak History Log</div>
    <div class="subtitle">All alerts with status and actions taken</div>
    <div class="meta">District: ${district}</div>
    <div class="stat-row">
      ${statBoxHTML(alerts.length, 'Total Alerts', BRAND)}
      ${statBoxHTML(active, 'Active', '#dc2626')}
      ${statBoxHTML(critical, 'Critical', '#d97706')}
    </div>
    <div class="section-title">Alert Details</div>
    ${tableHTML(
      ['Block', 'Symptoms', 'Cases', 'Severity', 'Status', 'Reported'],
      alerts.map(a => [
        a.block || '—',
        Array.isArray(a.symptom_cluster) ? a.symptom_cluster.join(', ') : '—',
        a.case_count || 0,
        a.severity || '—',
        a.status || '—',
        a.first_reported ? new Date(a.first_reported).toLocaleDateString('en-IN') : '—',
      ]),
      { index: 3 }
    )}
  `
  printHTML(html, `Outbreak_Log_${new Date().toISOString().slice(0,10)}`)
}

// ── Monthly CMO ───────────────────────────────────────────────────────────────
export function generateMonthlyCMOPDF(data, ashas = [], district = 'Beed') {
  const { total_assessments: total = 0, triage_breakdown: tb = {}, top_symptoms = [], opd_deflection_estimate = 0 } = data
  const month = new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })

  const html = `
    <div class="title">Monthly CMO Report</div>
    <div class="subtitle">${month}</div>
    <div class="meta">District: ${district} &nbsp;|&nbsp; Prepared for Chief Medical Officer</div>
    <div class="stat-row">
      ${statBoxHTML(total, 'Total Assessments', BRAND)}
      ${statBoxHTML(tb.RED || 0, 'Emergency', '#dc2626')}
      ${statBoxHTML(tb.YELLOW || 0, 'Clinic Referrals', '#d97706')}
      ${statBoxHTML(opd_deflection_estimate, 'OPD Deflected', '#16a34a')}
    </div>
    <div class="section-title">Triage Summary</div>
    ${tableHTML(
      ['Level', 'Count', '%'],
      [
        ['RED',    tb.RED || 0,    total ? `${Math.round((tb.RED||0)/total*100)}%` : '0%'],
        ['YELLOW', tb.YELLOW || 0, total ? `${Math.round((tb.YELLOW||0)/total*100)}%` : '0%'],
        ['GREEN',  tb.GREEN || 0,  total ? `${Math.round((tb.GREEN||0)/total*100)}%` : '0%'],
      ]
    )}
    ${top_symptoms.length > 0 ? `
    <div class="section-title">Top Symptoms This Month</div>
    ${tableHTML(['#', 'Symptom', 'Cases'], top_symptoms.map((s, i) => [i+1, s.symptom, s.count]))}
    ` : ''}
    ${ashas.length > 0 ? `
    <div class="section-title">ASHA Worker Summary</div>
    ${tableHTML(
      ['Name', 'Block', 'Assessments', 'Follow-up Rate'],
      ashas.map(a => [a.name, a.block, a.assessments_this_week || 0, `${a.followup_rate || 0}%`])
    )}
    ` : ''}
  `
  printHTML(html, `Monthly_CMO_Report_${new Date().toISOString().slice(0,7)}`)
}
