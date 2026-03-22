import { useState } from 'react'
import AdminLayout from './AdminLayout'
import { useToast } from '../../components/Toast'
import { useAuth } from '../../context/AuthContext'
import { getReportData, getAshaActivity, getPHCLoad, getOutbreakAlerts } from '../../utils/api'
import {
  generateSummaryPDF,
  generateAshaPerformancePDF,
  generatePHCLoadPDF,
  generateOutbreakPDF,
  generateMonthlyCMOPDF,
} from '../../utils/generatePDF'

const today = new Date().toISOString().slice(0, 10)
const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10)
const monthAgo = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10)

const REPORT_TYPES = [
  { id: 'weekly_summary',   icon: '📊', name: 'Weekly District Summary',  desc: 'Total assessments, triage distribution, top symptoms', from: weekAgo,  to: today },
  { id: 'monthly_cmo',      icon: '📋', name: 'Monthly CMO Report',        desc: 'Comprehensive monthly metrics for Chief Medical Officer', from: monthAgo, to: today },
  { id: 'asha_performance', icon: '👩', name: 'ASHA Performance Report',  desc: 'Ranking and activity metrics for all ASHA workers', from: weekAgo,  to: today },
  { id: 'phc_load',         icon: '🏥', name: 'PHC Load Analysis',          desc: 'Referral distribution and overload incidents', from: today,    to: today },
  { id: 'outbreak_log',     icon: '🚨', name: 'Outbreak History Log',       desc: 'All alerts with resolutions and outcomes', from: monthAgo, to: today },
]

export default function Reports() {
  const addToast = useToast()
  const { user } = useAuth()
  const district = user?.district || 'Beed'

  const [downloading, setDownloading] = useState(null)
  const [generating, setGenerating] = useState(false)
  const [progress, setProgress] = useState(0)
  const [reportData, setReportData] = useState(null)
  const [customForm, setCustomForm] = useState({ from: weekAgo, to: today })

  const handleQuickDownload = async (report) => {
    setDownloading(report.id)
    addToast(`Generating ${report.name}...`, 'info')
    try {
      if (report.id === 'weekly_summary') {
        const res = await getReportData(undefined, `${report.from}:${report.to}`)
        generateSummaryPDF({ ...res.data, district }, 'Weekly District Summary')
      } else if (report.id === 'monthly_cmo') {
        const [repRes, ashaRes] = await Promise.all([
          getReportData(undefined, `${report.from}:${report.to}`),
          getAshaActivity(),
        ])
        generateMonthlyCMOPDF({ ...repRes.data, district }, ashaRes.data.ashas || [], district)
      } else if (report.id === 'asha_performance') {
        const res = await getAshaActivity()
        generateAshaPerformancePDF(res.data.ashas || [], district)
      } else if (report.id === 'phc_load') {
        const res = await getPHCLoad()
        generatePHCLoadPDF(res.data.phcs || [], district)
      } else if (report.id === 'outbreak_log') {
        const res = await getOutbreakAlerts()
        generateOutbreakPDF(res.data.alerts || [], district)
      }
      addToast('PDF downloaded successfully', 'success')
    } catch (err) {
      console.error(err)
      addToast('Failed to generate PDF. Try again.', 'error')
    } finally {
      setDownloading(null)
    }
  }

  const handleGenerate = async () => {
    if (!customForm.from || !customForm.to) { addToast('Please select date range', 'error'); return }
    setGenerating(true); setProgress(0); setReportData(null)
    const interval = setInterval(() => setProgress(p => { if (p >= 80) { clearInterval(interval); return 80 } return p + 10 }), 150)
    try {
      const res = await getReportData(undefined, `${customForm.from}:${customForm.to}`)
      clearInterval(interval); setProgress(100)
      setReportData({ ...res.data, district })
      addToast('Report generated', 'success')
    } catch { clearInterval(interval); addToast('Failed to generate report', 'error') }
    finally { setGenerating(false) }
  }

  return (
    <AdminLayout>
      <div className="page-enter">
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--navy)', marginBottom: 4 }}>Reports & Export</h1>
        <p style={{ fontSize: 14, color: 'var(--gray)', marginBottom: 28 }}>Reports — {district} District</p>

        <div style={{ marginBottom: 32 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--gray)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 16 }}>Quick Reports</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 16 }}>
            {REPORT_TYPES.map(r => (
              <div key={r.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ fontSize: 32 }}>{r.icon}</div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--navy)', marginBottom: 4 }}>{r.name}</div>
                  <div style={{ fontSize: 13, color: 'var(--gray)', lineHeight: 1.5 }}>{r.desc}</div>
                </div>
                <button
                  className="btn-primary"
                  style={{ padding: '10px', fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                  onClick={() => handleQuickDownload(r)}
                  disabled={!!downloading}
                >
                  {downloading === r.id ? (
                    <>
                      <div style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                      Generating...
                    </>
                  ) : 'Download PDF'}
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="card" style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--navy)', marginBottom: 20 }}>Custom Report</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            <div>
              <label className="input-label">From Date</label>
              <input type="date" value={customForm.from} onChange={e => setCustomForm(f => ({ ...f, from: e.target.value }))} className="input-field" />
            </div>
            <div>
              <label className="input-label">To Date</label>
              <input type="date" value={customForm.to} onChange={e => setCustomForm(f => ({ ...f, to: e.target.value }))} className="input-field" />
            </div>
          </div>

          {generating && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ height: 8, background: 'var(--border)', borderRadius: 9999, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${progress}%`, background: 'linear-gradient(135deg,var(--teal),var(--blue))', borderRadius: 9999, transition: 'width 0.2s' }} />
              </div>
              <div style={{ fontSize: 12, color: 'var(--gray)', marginTop: 6 }}>Compiling data... {progress}%</div>
            </div>
          )}

          {reportData && (
            <div style={{ background: 'var(--bg)', borderRadius: 12, padding: 16, marginBottom: 16 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--navy)', marginBottom: 12 }}>
                {reportData.period?.from} to {reportData.period?.to}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 12 }}>
                {[
                  { label: 'Total',     value: reportData.total_assessments,           color: 'var(--blue)' },
                  { label: 'Emergency', value: reportData.triage_breakdown?.RED || 0,   color: 'var(--red)' },
                  { label: 'Clinic',    value: reportData.triage_breakdown?.YELLOW || 0,color: 'var(--amber)' },
                  { label: 'Self Care', value: reportData.opd_deflection_estimate || 0, color: 'var(--green)' },
                ].map((s, i) => (
                  <div key={i} style={{ textAlign: 'center', background: '#fff', borderRadius: 8, padding: 12 }}>
                    <div style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.value}</div>
                    <div style={{ fontSize: 11, color: 'var(--gray)' }}>{s.label}</div>
                  </div>
                ))}
              </div>
              {reportData.top_symptoms?.length > 0 && (
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--navy)', marginBottom: 8 }}>Top Symptoms</div>
                  {reportData.top_symptoms.slice(0, 5).map((s, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '4px 0', borderBottom: '1px solid var(--border)' }}>
                      <span style={{ color: 'var(--navy)' }}>{s.symptom}</span>
                      <span style={{ color: 'var(--gray)', fontWeight: 600 }}>{s.count}</span>
                    </div>
                  ))}
                </div>
              )}
              <button className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 8 }}
                onClick={() => { generateSummaryPDF(reportData, 'Custom District Report'); addToast('PDF downloaded', 'success') }}>
                Download as PDF
              </button>
            </div>
          )}

          <button className="btn-primary" onClick={handleGenerate} disabled={generating} style={{ width: '100%' }}>
            {generating ? 'Generating...' : 'Generate Report'}
          </button>
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </AdminLayout>
  )
}
