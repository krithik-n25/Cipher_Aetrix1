import { useState, useEffect } from 'react'
import AdminLayout from './AdminLayout'
import { getAshaActivity } from '../../utils/api'

const STATUS_CONFIG = {
  active:   { label: 'Active',       cls: 'badge-green' },
  low:      { label: 'Low Activity', cls: 'badge-yellow' },
  inactive: { label: 'Inactive',     cls: 'badge-red' },
}

function getStatus(a) {
  if (a.assessments_this_week === 0) return 'inactive'
  if (a.assessments_this_week < 5) return 'low'
  return 'active'
}

export default function AshaTracker() {
  const [ashas, setAshas] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(null)
  const [sortBy, setSortBy] = useState('assessments_this_week')

  useEffect(() => {
    getAshaActivity()
      .then(res => setAshas(res.data.ashas || []))
      .catch(() => setAshas([]))
      .finally(() => setLoading(false))
  }, [])

  const filtered = ashas
    .filter(a => a.name?.toLowerCase().includes(search.toLowerCase()) || a.block?.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => (b[sortBy] || 0) - (a[sortBy] || 0))

  const summary = {
    total: ashas.length,
    active: ashas.filter(a => getStatus(a) === 'active').length,
    inactive: ashas.filter(a => getStatus(a) === 'inactive').length,
    avgWeek: ashas.length > 0 ? Math.round(ashas.reduce((s, a) => s + (a.assessments_this_week || 0), 0) / ashas.length) : 0,
  }

  return (
    <AdminLayout>
      <div className="page-enter">
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--navy)', marginBottom: 4 }}>ASHA Worker Activity</h1>
        <p style={{ fontSize: 14, color: 'var(--gray)', marginBottom: 24 }}>आशा कार्यकर्ता गतिविधि</p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 24 }}>
          {[
            { label: 'Total ASHAs', value: summary.total, color: 'var(--navy)' },
            { label: 'Active This Week', value: summary.active, color: 'var(--green)' },
            { label: 'Inactive', value: summary.inactive, color: 'var(--amber)' },
            { label: 'Avg Assessments/Week', value: summary.avgWeek, color: 'var(--blue)' },
          ].map((s, i) => (
            <div key={i} className="card" style={{ textAlign: 'center', padding: 16 }}>
              <div style={{ fontSize: 28, fontWeight: 800, color: s.color, fontFamily: 'Poppins' }}>{s.value}</div>
              <div style={{ fontSize: 12, color: 'var(--gray)', marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
        </div>

        <div style={{ position: 'relative', marginBottom: 16 }}>
          <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }}>🔍</span>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or block..." className="input-field" style={{ paddingLeft: 42 }} />
        </div>

        {loading ? (
          <div className="card" style={{ height: 200, background: 'var(--border)', animation: 'pulse 1.5s infinite' }} />
        ) : (
          <div className="card" style={{ overflowX: 'auto', marginBottom: 24 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr>
                  {[['Name','name'],['Block','block'],['This Week','assessments_this_week'],['Follow-up %','followup_rate'],['Last Active','last_active'],['Status','status']].map(([h, key]) => (
                    <th key={h} onClick={() => setSortBy(key)} style={{ padding: '12px 16px', textAlign: 'left', color: sortBy === key ? 'var(--blue)' : 'var(--gray)', fontWeight: 600, borderBottom: '1px solid var(--border)', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                      {h} {sortBy === key ? '↓' : ''}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(a => {
                  const status = getStatus(a)
                  const sc = STATUS_CONFIG[status]
                  const lastActive = a.last_active ? new Date(a.last_active).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : 'Never'
                  return (
                    <tr key={a.user_id} onClick={() => setSelected(a)} style={{ cursor: 'pointer', background: status === 'inactive' ? '#FFFBEB' : 'transparent', transition: 'background 0.2s' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--bg)'}
                      onMouseLeave={e => e.currentTarget.style.background = status === 'inactive' ? '#FFFBEB' : 'transparent'}
                    >
                      <td style={{ padding: '14px 16px', fontWeight: 600, color: 'var(--navy)', borderBottom: '1px solid var(--border)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--light-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: 'var(--blue)', flexShrink: 0 }}>{(a.name || '?')[0]}</div>
                          {a.name}
                        </div>
                      </td>
                      <td style={{ padding: '14px 16px', color: 'var(--gray)', borderBottom: '1px solid var(--border)' }}>{a.block}</td>
                      <td style={{ padding: '14px 16px', fontWeight: 700, color: 'var(--navy)', borderBottom: '1px solid var(--border)' }}>{a.assessments_this_week || 0}</td>
                      <td style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ flex: 1, height: 6, background: 'var(--border)', borderRadius: 9999, overflow: 'hidden', maxWidth: 60 }}>
                            <div style={{ height: '100%', width: `${a.followup_rate || 0}%`, background: (a.followup_rate || 0) >= 70 ? 'var(--green)' : (a.followup_rate || 0) >= 50 ? 'var(--amber)' : 'var(--red)', borderRadius: 9999 }} />
                          </div>
                          <span style={{ fontSize: 13, fontWeight: 600 }}>{a.followup_rate || 0}%</span>
                        </div>
                      </td>
                      <td style={{ padding: '14px 16px', color: 'var(--gray)', borderBottom: '1px solid var(--border)' }}>{lastActive}</td>
                      <td style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)' }}><span className={`badge ${sc.cls}`}>{sc.label}</span></td>
                    </tr>
                  )
                })}
                {filtered.length === 0 && (
                  <tr><td colSpan={6} style={{ padding: 32, textAlign: 'center', color: 'var(--gray)' }}>No ASHA workers found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {ashas.length > 0 && (
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--navy)', marginBottom: 14 }}>Top Performers This Week</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
              {[...ashas].sort((a,b) => (b.assessments_this_week||0) - (a.assessments_this_week||0)).slice(0,3).map((a, i) => (
                <div key={a.user_id} className="card" style={{ textAlign: 'center', padding: 20, border: i === 0 ? '2px solid #F59E0B' : '1px solid var(--border)' }}>
                  <div style={{ fontSize: 28, marginBottom: 8 }}>{['🥇','🥈','🥉'][i]}</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--navy)' }}>{a.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--gray)', marginBottom: 8 }}>{a.block}</div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--blue)' }}>{a.assessments_this_week || 0}</div>
                  <div style={{ fontSize: 11, color: 'var(--gray)' }}>this week</div>
                  {i === 0 && <span className="badge badge-yellow" style={{ marginTop: 8 }}>Star Performer</span>}
                </div>
              ))}
            </div>
          </div>
        )}

        {selected && (
          <div style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: 320, background: '#fff', boxShadow: 'var(--shadow-xl)', zIndex: 200, padding: 24, overflowY: 'auto', animation: 'slideIn 0.3s ease both' }}>
            <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: 'var(--gray)', marginBottom: 20 }}>X</button>
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--light-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 700, color: 'var(--blue)', margin: '0 auto 12px' }}>{(selected.name || '?')[0]}</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--navy)' }}>{selected.name}</div>
              <div style={{ fontSize: 13, color: 'var(--gray)' }}>{selected.block} Block</div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
              {[['This Week', selected.assessments_this_week||0],['Follow-ups Done', selected.followups_completed||0],['Follow-up Rate', `${selected.followup_rate||0}%`],['Last Active', selected.last_active ? new Date(selected.last_active).toLocaleDateString('en-IN',{day:'numeric',month:'short'}) : 'Never']].map(([l,v]) => (
                <div key={l} style={{ background: 'var(--bg)', borderRadius: 10, padding: 12, textAlign: 'center' }}>
                  <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--blue)' }}>{v}</div>
                  <div style={{ fontSize: 11, color: 'var(--gray)' }}>{l}</div>
                </div>
              ))}
            </div>
          </div>
        )}
        <style>{`@keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }`}</style>
      </div>
    </AdminLayout>
  )
}
