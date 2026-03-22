import { useState, useEffect } from 'react'
import AdminLayout from './AdminLayout'
import { getPHCLoad } from '../../utils/api'

const STATUS_CONFIG = {
  NORMAL:     { label: 'Normal',    cls: 'badge-green', color: 'var(--green)' },
  MODERATE:   { label: 'Moderate',  cls: 'badge-yellow', color: 'var(--amber)' },
  OVERLOADED: { label: 'Overloaded',cls: 'badge-red',   color: 'var(--red)' },
}

export default function PHCMonitor() {
  const [phcs, setPhcs] = useState([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(null)

  const load = () => {
    setLoading(true)
    getPHCLoad()
      .then(res => setPhcs(res.data.phcs || []))
      .catch(() => setPhcs([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const overloaded = phcs.filter(f => f.status === 'OVERLOADED')
  const avgReferrals = phcs.length > 0 ? Math.round(phcs.reduce((s, f) => s + f.referrals_today, 0) / phcs.length) : 0
  const busiest = phcs.length > 0 ? [...phcs].sort((a,b) => b.referrals_today - a.referrals_today)[0] : null
  const quietest = phcs.length > 0 ? [...phcs].sort((a,b) => a.referrals_today - b.referrals_today)[0] : null

  return (
    <AdminLayout>
      <div className="page-enter">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--navy)', marginBottom: 4 }}>PHC Load Monitor</h1>
            <p style={{ fontSize: 13, color: 'var(--gray)' }}>Last updated: {new Date().toLocaleTimeString()}</p>
          </div>
          <button className="btn-secondary" style={{ padding: '8px 16px', fontSize: 13 }} onClick={load}>Refresh</button>
        </div>

        {overloaded.length > 0 && (
          <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 12, padding: '14px 18px', marginBottom: 24 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#92400E', marginBottom: 4 }}>Overload Alert</div>
            {overloaded.map(f => (
              <div key={f.facility_id} style={{ fontSize: 13, color: '#B45309', marginBottom: 4 }}>
                {f.name} has {f.referrals_today} referrals today
              </div>
            ))}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 24 }}>
          {[
            { label: 'Total Facilities', value: phcs.length, icon: '🏥' },
            { label: 'Avg Referrals/Day', value: avgReferrals, icon: '📊' },
            { label: 'Busiest', value: busiest?.name || '—', icon: '🔴' },
            { label: 'Quietest', value: quietest?.name || '—', icon: '🟢' },
          ].map((s, i) => (
            <div key={i} className="card" style={{ textAlign: 'center', padding: 16 }}>
              <div style={{ fontSize: 20, marginBottom: 6 }}>{s.icon}</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--navy)' }}>{s.value}</div>
              <div style={{ fontSize: 12, color: 'var(--gray)' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {loading ? (
          <div className="card" style={{ height: 200, background: 'var(--border)', animation: 'pulse 1.5s infinite' }} />
        ) : (
          <div className="card" style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr>
                  {['Facility Name','Block','Referrals Today','Status'].map(h => (
                    <th key={h} style={{ padding: '12px 16px', textAlign: 'left', color: 'var(--gray)', fontWeight: 600, borderBottom: '1px solid var(--border)', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {phcs.length === 0 ? (
                  <tr><td colSpan={4} style={{ padding: 32, textAlign: 'center', color: 'var(--gray)' }}>No referrals recorded today</td></tr>
                ) : phcs.map(f => {
                  const sc = STATUS_CONFIG[f.status] || STATUS_CONFIG.NORMAL
                  return (
                    <tr key={f.facility_id} onClick={() => setExpanded(expanded === f.facility_id ? null : f.facility_id)} style={{ cursor: 'pointer', transition: 'background 0.2s' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--bg)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <td style={{ padding: '14px 16px', fontWeight: 600, color: 'var(--navy)', borderBottom: '1px solid var(--border)' }}>{f.name}</td>
                      <td style={{ padding: '14px 16px', color: 'var(--gray)', borderBottom: '1px solid var(--border)' }}>{f.block}</td>
                      <td style={{ padding: '14px 16px', fontWeight: 700, color: f.status === 'OVERLOADED' ? 'var(--red)' : 'var(--navy)', borderBottom: '1px solid var(--border)' }}>{f.referrals_today}</td>
                      <td style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)' }}><span className={`badge ${sc.cls}`}>{sc.label}</span></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
