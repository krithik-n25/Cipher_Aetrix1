import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'
import AdminLayout from './AdminLayout'
import { getAdminSummary, getOutbreakAlerts } from '../../utils/api'

export default function AdminDashboard() {
  const navigate = useNavigate()
  const [summary, setSummary] = useState(null)
  const [alerts, setAlerts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([getAdminSummary(), getOutbreakAlerts()])
      .then(([sumRes, alertRes]) => {
        setSummary(sumRes.data)
        setAlerts((alertRes.data.alerts || []).filter(a => a.status === 'ACTIVE').slice(0, 3))
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const totals = summary?.totals || { all: 0, RED: 0, YELLOW: 0, GREEN: 0 }

  const triageData = [
    { name: 'Emergency', value: totals.RED, color: '#EF4444' },
    { name: 'Visit Clinic', value: totals.YELLOW, color: '#F59E0B' },
    { name: 'Self Care', value: totals.GREEN, color: '#1B6B7B' },
  ]

  const stats = [
    { label: 'Total Assessments Today', value: totals.all, icon: '📊', sub: 'today' },
    { label: 'Emergency Referrals', value: totals.RED, icon: '🔴', sub: 'Referred to 108', pulse: true },
    { label: 'Clinic Referrals', value: totals.YELLOW, icon: '🟡', sub: 'PHC Referrals' },
    { label: 'Self-Care Guided', value: totals.GREEN, icon: '🟢', sub: 'OPD Deflected' },
  ]

  return (
    <AdminLayout>
      <div className="page-enter">
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--navy)', marginBottom: 8 }}>Admin Dashboard</h1>
        <p style={{ fontSize: 14, color: 'var(--gray)', marginBottom: 28 }}>
          {summary?.district || 'District'} — {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </p>

        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 28 }}>
            {[1,2,3,4].map(i => <div key={i} className="card" style={{ height: 120, background: 'var(--border)', animation: 'pulse 1.5s infinite' }} />)}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 28 }}>
            {stats.map((s, i) => (
              <div key={i} className="card" style={{ position: 'relative' }}>
                {s.pulse && totals.RED > 0 && <div style={{ position: 'absolute', top: 16, right: 16, width: 8, height: 8, borderRadius: '50%', background: 'var(--red)', animation: 'pulse-ring 1s infinite' }} />}
                <div style={{ fontSize: 24, marginBottom: 8 }}>{s.icon}</div>
                <div style={{ fontSize: 32, fontWeight: 800, color: 'var(--teal)', fontFamily: "'Space Grotesk', sans-serif", marginBottom: 4 }}>{s.value.toLocaleString()}</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--navy)', marginBottom: 4 }}>{s.label}</div>
                <div style={{ fontSize: 11, color: 'var(--gray)' }}>{s.sub}</div>
              </div>
            ))}
          </div>
        )}

        <div style={{ marginBottom: 28 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--navy)' }}>
              Active Alerts
              {alerts.length > 0 && <span className="badge badge-red" style={{ marginLeft: 8 }}>{alerts.length}</span>}
            </div>
            <button onClick={() => navigate('/admin/outbreaks')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--teal)', fontSize: 13, fontWeight: 500 }}>View All</button>
          </div>
          {alerts.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: 32 }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>No active alerts today</div>
            </div>
          ) : alerts.map(a => (
            <div key={a.id} className="card" style={{ borderLeft: '4px solid var(--red)', background: '#FEF2F2', marginBottom: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                <div>
                  <span className="badge badge-red" style={{ marginRight: 8 }}>{a.severity}</span>
                  <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--navy)' }}>{a.block?.toUpperCase()} — {Array.isArray(a.symptom_cluster) ? a.symptom_cluster.join(', ').toUpperCase() : ''}</span>
                </div>
                <span style={{ fontSize: 12, color: 'var(--gray)' }}>{a.case_count} cases</span>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn-primary" style={{ padding: '8px 16px', fontSize: 13 }} onClick={() => navigate('/admin/outbreaks')}>Investigate</button>
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 10, overflowX: 'auto', marginBottom: 28, paddingBottom: 4 }}>
          {[
            `${totals.all} total today`,
            `${summary?.active_outbreak_alerts || 0} active alerts`,
            `${summary?.active_ashas_today || 0} ASHAs active today`,
          ].map((item, i) => (
            <div key={i} style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 9999, padding: '8px 16px', fontSize: 13, fontWeight: 500, color: 'var(--navy)', whiteSpace: 'nowrap', boxShadow: 'var(--shadow-sm)' }}>
              {item}
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <div className="card">
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--navy)', marginBottom: 16 }}>Triage Distribution Today</div>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={triageData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} dataKey="value">
                  {triageData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Legend iconType="circle" iconSize={10} wrapperStyle={{ fontSize: 12 }} />
                <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid var(--border)', fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 16 }}>
            {[
              { label: 'Emergency', value: totals.RED, color: '#EF4444' },
              { label: 'Visit Clinic', value: totals.YELLOW, color: '#F59E0B' },
              { label: 'Self Care', value: totals.GREEN, color: '#1B6B7B' },
            ].map((item, i) => (
              <div key={i}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 13, color: 'var(--navy)', fontWeight: 500 }}>{item.label}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: item.color }}>{item.value}</span>
                </div>
                <div style={{ height: 8, background: 'var(--border)', borderRadius: 9999, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: totals.all > 0 ? `${Math.round(item.value / totals.all * 100)}%` : '0%', background: item.color, borderRadius: 9999 }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
