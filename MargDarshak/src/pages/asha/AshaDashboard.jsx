import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import OutbreakBadge from '../../components/OutbreakBadge'
import SkeletonCard from '../../components/SkeletonCard'
import { getPatientsByAsha, getFollowUpsDue, getAdminSummary } from '../../utils/api'

function BottomNav({ active }) {
  const navigate = useNavigate()
  const tabs = [
    { id: 'home',     icon: '🏠', label: 'Home',     path: '/asha/dashboard' },
    { id: 'patients', icon: '📋', label: 'Patients', path: '/asha/patients' },
    { id: 'assess',   icon: '➕', label: 'Assess',   path: '/asha/assess' },
    { id: 'report',   icon: '📊', label: 'Report',   path: '/asha/report' },
  ]
  return (
    <div className="bottom-nav">
      {tabs.map(t => (
        <button key={t.id} className={`bottom-nav-item${active === t.id ? ' active' : ''}`} onClick={() => navigate(t.path)}>
          <span style={{ fontSize: 20 }}>{t.icon}</span>
          <span>{t.label}</span>
        </button>
      ))}
    </div>
  )
}

export default function AshaDashboard() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ total: 0, red: 0, yellow: 0, green: 0, allTime: 0 })
  const [followUps, setFollowUps] = useState([])
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!user?.id) return
    setLoading(true)
    Promise.all([
      getPatientsByAsha(user.id).catch(() => null),
      getFollowUpsDue(user.id).catch(() => null),
    ]).then(([patientsRes, followRes]) => {
      if (patientsRes?.data) {
        const patients = patientsRes.data.patients || []
        // Count today's assessments
        const today = new Date().toISOString().slice(0, 10)
        const todayPatients = patients.filter(p => p.created_at?.startsWith(today))
        setStats({
          total: todayPatients.length,
          red:    todayPatients.filter(p => p.triage_level === 'RED').length,
          yellow: todayPatients.filter(p => p.triage_level === 'YELLOW').length,
          green:  todayPatients.filter(p => p.triage_level === 'GREEN').length,
          allTime: patients.length,
        })
      }
      if (followRes?.data) {
        setFollowUps(followRes.data.patients || [])
      }
    }).catch(() => setError('Could not load data'))
      .finally(() => setLoading(false))
  }, [user?.id])

  const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', paddingBottom: 80 }}>
      <div style={{ background: '#fff', borderBottom: '1px solid var(--border)', padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 18 }}>🏥</span>
          <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--teal)' }}>Margdarshak</span>
        </div>
        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--navy)' }}>Namaste, {user?.name?.split(' ')[0]} 👋</div>
        <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--blue)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 14, fontWeight: 700 }}>
          {user?.name?.[0] || 'A'}
        </div>
      </div>

      <div style={{ background: 'linear-gradient(135deg,#0D2B33,#1B6B7B)', padding: '24px 20px 80px', color: '#fff' }}>
        <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>Good Morning 🌅</div>
        <div style={{ fontSize: 13, opacity: 0.7, marginBottom: 4 }}>{today}</div>
        <div style={{ fontSize: 13, opacity: 0.6 }}>{user?.block}, {user?.district}</div>
      </div>

      <div className="mobile-container" style={{ marginTop: -56 }}>
        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
            {[1,2,3,4].map(i => <SkeletonCard key={i} lines={2} height={16} />)}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
            {[
              { label: 'Total Assessed', value: stats.total,   icon: '📋', color: 'var(--blue)', sub: 'Today' },
              { label: 'All Patients',   value: stats.allTime, icon: '👥', color: 'var(--navy)', sub: 'All time' },
              { label: 'Emergencies',    value: stats.red,     icon: '🔴', color: 'var(--red)',  sub: 'Today — 108', pulse: stats.red > 0 },
              { label: 'Clinic Visits',  value: stats.yellow,  icon: '🟡', color: 'var(--amber)',sub: 'Today — PHC' },
            ].map((s, i) => (
              <div key={i} style={{ background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(12px)', borderRadius: 16, padding: 16, boxShadow: 'var(--shadow-md)', position: 'relative' }}>
                {s.pulse && <div style={{ position: 'absolute', top: 12, right: 12, width: 8, height: 8, borderRadius: '50%', background: 'var(--red)', animation: 'pulse-ring 1s infinite' }} />}
                <div style={{ fontSize: 20, marginBottom: 6 }}>{s.icon}</div>
                <div style={{ fontSize: 28, fontWeight: 800, color: s.color, fontFamily: 'Poppins' }}>{s.value}</div>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--navy)' }}>{s.label}</div>
                <div style={{ fontSize: 11, color: 'var(--gray)' }}>{s.sub}</div>
              </div>
            ))}
          </div>
        )}

        <div style={{ marginBottom: 20 }}>
          <OutbreakBadge count={0} block={user?.block} />
        </div>

        {/* Follow-ups from DB */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--navy)' }}>
              Follow-Ups Due 🔔
              {followUps.length > 0 && <span className="badge badge-red" style={{ marginLeft: 8 }}>{followUps.length}</span>}
            </div>
            <button onClick={() => navigate('/asha/patients')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--blue)', fontSize: 13, fontWeight: 500 }}>View All →</button>
          </div>
          {followUps.length === 0 && !loading ? (
            <div className="card" style={{ textAlign: 'center', padding: 24, color: 'var(--gray)', fontSize: 14 }}>
              ✅ No follow-ups due right now
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {followUps.slice(0, 5).map(p => (
                <div key={p.id} className="card" style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: p.triage_level === 'RED' ? 'var(--red)' : p.triage_level === 'YELLOW' ? 'var(--amber)' : 'var(--green)', flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--navy)' }}>{p.patient_name || 'Patient'}</div>
                    <div style={{ fontSize: 12, color: 'var(--gray)' }}>{p.triage_level}</div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                    <span className="badge badge-red" style={{ fontSize: 10 }}>Overdue</span>
                    <button onClick={() => navigate(`/asha/follow-up/${p.id}`)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--blue)', fontSize: 12, fontWeight: 500 }}>Follow Up →</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
          <button onClick={() => navigate('/asha/assess')} style={{ background: 'linear-gradient(135deg,#1B6B7B,#2A8FA3)', borderRadius: 16, padding: '20px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 16, textAlign: 'left', boxShadow: '0 4px 16px rgba(27,107,123,0.35)' }}>
            <span style={{ fontSize: 28, background: 'rgba(255,255,255,0.2)', borderRadius: 12, padding: 8 }}>➕</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>Assess New Patient</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>नया मरीज़ जाँचें</div>
            </div>
            <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 18 }}>→</span>
          </button>
          <button onClick={() => navigate('/asha/patients')} style={{ background: '#fff', borderRadius: 16, padding: '20px', border: '1px solid var(--border)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 16, textAlign: 'left', boxShadow: 'var(--shadow-sm)' }}>
            <span style={{ fontSize: 28, background: 'var(--light-blue)', borderRadius: 12, padding: 8 }}>📋</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--navy)' }}>My Patients</div>
              <div style={{ fontSize: 13, color: 'var(--gray)' }}>मेरे मरीज़</div>
            </div>
            <span style={{ color: 'var(--gray)', fontSize: 18 }}>→</span>
          </button>
        </div>
      </div>
      <BottomNav active="home" />
    </div>
  )
}
