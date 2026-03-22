import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { getPatientsByAsha } from '../../utils/api'

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']

export default function MonthlyReport() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [monthIdx, setMonthIdx] = useState(new Date().getMonth())
  const [allPatients, setAllPatients] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user?.id) return
    getPatientsByAsha(user.id)
      .then(res => setAllPatients(res.data.patients || []))
      .catch(() => setAllPatients([]))
      .finally(() => setLoading(false))
  }, [user?.id])

  // Filter patients for selected month
  const monthPatients = allPatients.filter(p => {
    if (!p.created_at) return false
    return new Date(p.created_at).getMonth() === monthIdx
  })

  const total = monthPatients.length
  const red = monthPatients.filter(p => p.triage_level === 'RED').length
  const green = monthPatients.filter(p => p.triage_level === 'GREEN').length
  const followUpDone = monthPatients.filter(p => p.follow_up_done).length
  const followUpRate = total > 0 ? Math.round((followUpDone / total) * 100) : 0

  // Top symptoms
  const symptomCounts = {}
  monthPatients.forEach(p => {
    const syms = Array.isArray(p.symptoms) ? p.symptoms : []
    syms.forEach(s => { symptomCounts[s] = (symptomCounts[s] || 0) + 1 })
  })
  const topSymptoms = Object.entries(symptomCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, count]) => ({ name, count, pct: total > 0 ? Math.round((count / total) * 100) : 0 }))

  const shareText = `Margdarshak Monthly Report - ${MONTHS[monthIdx]} 2026\nASHA: ${user?.name}\nBlock: ${user?.block}\nTotal Assessed: ${total}\nEmergencies: ${red}\nFollow-up Rate: ${followUpRate}%`

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <div style={{ background: '#fff', borderBottom: '1px solid var(--border)', padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 12, position: 'sticky', top: 0, zIndex: 50 }}>
        <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: 'var(--gray)' }}>←</button>
        <div style={{ flex: 1, fontSize: 16, fontWeight: 700, color: 'var(--navy)' }}>My Report <span style={{ fontSize: 13, color: 'var(--gray)' }}>मेरी रिपोर्ट</span></div>
      </div>

      <div className="mobile-container page-enter" style={{ paddingTop: 24, paddingBottom: 40 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 20, marginBottom: 24 }}>
          <button onClick={() => setMonthIdx(m => Math.max(0, m-1))} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: 'var(--gray)' }}>←</button>
          <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--navy)' }}>{MONTHS[monthIdx]} 2026</span>
          <button onClick={() => setMonthIdx(m => Math.min(11, m+1))} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: 'var(--gray)' }}>→</button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 40, color: 'var(--gray)' }}>Loading...</div>
        ) : (
          <>
            <div style={{ background: 'linear-gradient(135deg,var(--teal),var(--blue))', borderRadius: 20, padding: '28px 24px', color: '#fff', marginBottom: 20, textAlign: 'center' }}>
              <div style={{ fontSize: 13, opacity: 0.8, marginBottom: 4 }}>{MONTHS[monthIdx]} 2026 — {user?.block} Block</div>
              <div style={{ fontSize: 48, fontWeight: 800, fontFamily: 'Poppins', marginBottom: 4 }}>{total}</div>
              <div style={{ fontSize: 16, fontWeight: 600 }}>Patients Assessed</div>
              <div style={{ fontSize: 13, opacity: 0.7, marginTop: 4 }}>by {user?.name}</div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>
              {[
                { icon: '📋', label: 'Total Assessed', value: total, color: 'var(--blue)' },
                { icon: '🔴', label: 'Emergencies Referred', value: red, color: 'var(--red)' },
                { icon: '🟢', label: 'OPD Deflected', value: `~${green}`, color: 'var(--green)' },
                { icon: '✅', label: 'Follow-Up Rate', value: `${followUpRate}%`, color: 'var(--blue)' },
              ].map((s, i) => (
                <div key={i} className="card" style={{ textAlign: 'center', padding: 20 }}>
                  <div style={{ fontSize: 24, marginBottom: 8 }}>{s.icon}</div>
                  <div style={{ fontSize: 28, fontWeight: 800, color: s.color, fontFamily: 'Poppins' }}>{s.value}</div>
                  <div style={{ fontSize: 12, color: 'var(--gray)', marginTop: 4 }}>{s.label}</div>
                </div>
              ))}
            </div>

            {topSymptoms.length > 0 && (
              <div className="card" style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--navy)', marginBottom: 16 }}>Most Reported Symptoms</div>
                {topSymptoms.map((s, i) => (
                  <div key={i} style={{ marginBottom: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--navy)' }}>{s.name}</span>
                      <span style={{ fontSize: 13, color: 'var(--gray)' }}>{s.count}</span>
                    </div>
                    <div style={{ height: 8, background: 'var(--border)', borderRadius: 9999, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${s.pct}%`, background: 'linear-gradient(135deg,var(--teal),var(--blue))', borderRadius: 9999 }} />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {total === 0 && (
              <div className="card" style={{ textAlign: 'center', padding: 32, marginBottom: 20 }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>📭</div>
                <div style={{ fontSize: 14, color: 'var(--gray)' }}>No assessments in {MONTHS[monthIdx]}</div>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <a href={`https://wa.me/?text=${encodeURIComponent(shareText)}`} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: '#25D366', color: '#fff', borderRadius: 10, padding: '14px', fontSize: 14, fontWeight: 600, textDecoration: 'none' }}>
                Share with PHC Doctor
              </a>
              <button className="btn-ghost full" onClick={() => window.print()}>Download Report</button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
