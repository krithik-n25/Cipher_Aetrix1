import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { getPatientsByAsha } from '../../utils/api'

const TABS = ['All', 'Follow-Up Due', 'RED', 'YELLOW', 'GREEN']

function getFollowUpStatus(p) {
  if (p.follow_up_done) return 'done'
  if (!p.follow_up_due) return 'upcoming'
  const due = new Date(p.follow_up_due)
  const now = new Date()
  if (due < now) return 'overdue'
  const diff = (due - now) / (1000 * 60 * 60 * 24)
  if (diff <= 2) return 'due'
  return 'upcoming'
}

export default function PatientList() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [patients, setPatients] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState('All')

  useEffect(() => {
    if (!user?.id) return
    getPatientsByAsha(user.id)
      .then(res => setPatients(res.data.patients || []))
      .catch(() => setPatients([]))
      .finally(() => setLoading(false))
  }, [user?.id])

  const filtered = patients.filter(p => {
    const symptoms = Array.isArray(p.symptoms) ? p.symptoms.join(', ') : (p.symptoms || '')
    const matchSearch = (p.patient_name || '').toLowerCase().includes(search.toLowerCase()) ||
      symptoms.toLowerCase().includes(search.toLowerCase())
    const fu = getFollowUpStatus(p)
    const matchTab = activeTab === 'All' ? true
      : activeTab === 'Follow-Up Due' ? ['due', 'overdue'].includes(fu)
      : p.triage_level === activeTab
    return matchSearch && matchTab
  })

  const levelColor = { RED: 'var(--red)', YELLOW: 'var(--amber)', GREEN: 'var(--green)' }
  const followUpLabel = {
    due:      { label: 'Follow Up Due', cls: 'badge-yellow' },
    overdue:  { label: 'Overdue',       cls: 'badge-red' },
    upcoming: { label: 'Upcoming',      cls: 'badge-gray' },
    done:     { label: 'Completed ✓',   cls: 'badge-green' },
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <div style={{ background: '#fff', borderBottom: '1px solid var(--border)', padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 12, position: 'sticky', top: 0, zIndex: 50 }}>
        <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: 'var(--gray)' }}>←</button>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--navy)' }}>My Patients <span style={{ fontSize: 13, color: 'var(--gray)' }}>मेरे मरीज़</span></div>
        </div>
        <span className="badge badge-blue">{patients.length}</span>
      </div>

      <div style={{ background: '#fff', padding: '12px 20px', borderBottom: '1px solid var(--border)', position: 'sticky', top: 57, zIndex: 40 }}>
        <div style={{ position: 'relative' }}>
          <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 16 }}>🔍</span>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or symptom..." className="input-field" style={{ paddingLeft: 42 }} />
        </div>
      </div>

      <div style={{ background: '#fff', borderBottom: '1px solid var(--border)', padding: '0 20px', display: 'flex', gap: 0, overflowX: 'auto' }}>
        {TABS.map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} style={{
            padding: '12px 14px', background: 'none', border: 'none', cursor: 'pointer', whiteSpace: 'nowrap',
            fontSize: 13, fontWeight: 500, color: activeTab === tab ? 'var(--blue)' : 'var(--gray)',
            borderBottom: activeTab === tab ? '2px solid var(--blue)' : '2px solid transparent',
          }}>
            {tab}
          </button>
        ))}
      </div>

      <div className="mobile-container page-enter" style={{ paddingTop: 16, paddingBottom: 40 }}>
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[1,2,3].map(i => <div key={i} className="card" style={{ height: 80, background: 'var(--border)', animation: 'pulse 1.5s infinite' }} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', paddingTop: 60 }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>📋</div>
            <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--navy)', marginBottom: 8 }}>No patients found</div>
            <button className="btn-primary" onClick={() => navigate('/asha/assess')}>Assess New Patient →</button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {filtered.map(p => {
              const fu = followUpLabel[getFollowUpStatus(p)]
              const symptoms = Array.isArray(p.symptoms) ? p.symptoms.slice(0, 2).join(', ') : (p.symptoms || 'N/A')
              const dateStr = p.created_at ? new Date(p.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : ''
              return (
                <div key={p.id} className="card" style={{ padding: '16px', cursor: 'pointer' }} onClick={() => navigate(`/asha/follow-up/${p.id}`)}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: levelColor[p.triage_level] || 'var(--gray)', marginTop: 6, flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--navy)' }}>{p.patient_name || 'Unknown'}</div>
                      <div style={{ fontSize: 12, color: 'var(--gray)', marginBottom: 6 }}>
                        {p.patient_age ? `${p.patient_age}yrs` : ''}{p.patient_age && p.patient_gender ? ' · ' : ''}{p.patient_gender === 'M' ? 'Male' : p.patient_gender === 'F' ? 'Female' : p.patient_gender || ''}
                      </div>
                      <span style={{ background: 'var(--light-blue)', color: 'var(--blue)', borderRadius: 9999, padding: '3px 10px', fontSize: 12, fontWeight: 500 }}>{symptoms}</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                      <span className={`badge ${fu.cls}`} style={{ fontSize: 10 }}>{fu.label}</span>
                      <span style={{ fontSize: 11, color: 'var(--gray)' }}>{dateStr}</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
