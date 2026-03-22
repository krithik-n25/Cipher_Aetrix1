import { useState, useEffect } from 'react'
import AdminLayout from './AdminLayout'
import { useToast } from '../../components/Toast'
import { getOutbreakAlerts, updateOutbreakAlert } from '../../utils/api'

export default function OutbreakAlerts() {
  const [alerts, setAlerts] = useState([])
  const [loading, setLoading] = useState(true)
  const [threshold, setThreshold] = useState({ cases: 20, hours: 72 })
  const addToast = useToast()

  const load = () => {
    getOutbreakAlerts()
      .then(res => setAlerts(res.data.alerts || []))
      .catch(() => setAlerts([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const toggleAction = async (alertId, action) => {
    try {
      await updateOutbreakAlert(alertId, { action })
      addToast('Action updated', 'success')
      load()
    } catch {
      addToast('Failed to update', 'error')
    }
  }

  const resolve = async (alertId) => {
    try {
      await updateOutbreakAlert(alertId, { status: 'RESOLVED' })
      addToast('Alert marked as resolved', 'success')
      load()
    } catch {
      addToast('Failed to resolve', 'error')
    }
  }

  const active = alerts.filter(a => a.status !== 'RESOLVED')
  const resolved = alerts.filter(a => a.status === 'RESOLVED')

  return (
    <AdminLayout>
      <div className="page-enter">
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--navy)', marginBottom: 4 }}>Outbreak Alerts</h1>
        <p style={{ fontSize: 14, color: 'var(--gray)', marginBottom: 24 }}>प्रकोप अलर्ट</p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 24 }}>
          {[
            { label: 'Active', value: active.length, cls: 'badge-red' },
            { label: 'Investigating', value: alerts.filter(a => a.status === 'INVESTIGATING').length, cls: 'badge-yellow' },
            { label: 'Resolved', value: resolved.length, cls: 'badge-green' },
            { label: 'Total', value: alerts.length, cls: 'badge-gray' },
          ].map((s, i) => (
            <div key={i} className="card" style={{ textAlign: 'center', padding: 16 }}>
              <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--navy)', fontFamily: 'Poppins' }}>{s.value}</div>
              <span className={`badge ${s.cls}`} style={{ marginTop: 6 }}>{s.label}</span>
            </div>
          ))}
        </div>

        <div className="card" style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--navy)', marginBottom: 12 }}>Alert Threshold Settings</div>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 13, color: 'var(--gray)' }}>Trigger when</span>
              <input type="number" value={threshold.cases} onChange={e => setThreshold(t => ({ ...t, cases: e.target.value }))} style={{ width: 60, height: 36, border: '1.5px solid var(--border)', borderRadius: 8, padding: '0 8px', fontSize: 14, textAlign: 'center' }} />
              <span style={{ fontSize: 13, color: 'var(--gray)' }}>cases within</span>
              <input type="number" value={threshold.hours} onChange={e => setThreshold(t => ({ ...t, hours: e.target.value }))} style={{ width: 60, height: 36, border: '1.5px solid var(--border)', borderRadius: 8, padding: '0 8px', fontSize: 14, textAlign: 'center' }} />
              <span style={{ fontSize: 13, color: 'var(--gray)' }}>hours</span>
            </div>
            <button className="btn-primary" style={{ padding: '8px 16px', fontSize: 13 }} onClick={() => addToast('Settings saved', 'success')}>Save</button>
          </div>
        </div>

        {loading ? (
          <div className="card" style={{ height: 200, background: 'var(--border)', animation: 'pulse 1.5s infinite' }} />
        ) : active.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: 48 }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>No active outbreak alerts</div>
            <div style={{ fontSize: 14, color: 'var(--gray)' }}>All clear in your district</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 24 }}>
            {active.map(alert => {
              const symptoms = Array.isArray(alert.symptom_cluster) ? alert.symptom_cluster : []
              const actions = Array.isArray(alert.actions_taken) ? alert.actions_taken : []
              const actionKeys = actions.map(a => a.action)
              return (
                <div key={alert.id} className="card" style={{ borderLeft: '4px solid var(--red)', padding: 20 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                      <span className={`badge ${alert.severity === 'CRITICAL' ? 'badge-red' : 'badge-yellow'}`}>{alert.severity}</span>
                      <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--navy)' }}>{alert.block?.toUpperCase()} — {symptoms.join(', ').toUpperCase()}</span>
                    </div>
                    <span style={{ fontSize: 12, color: 'var(--gray)' }}>{alert.case_count} cases</span>
                  </div>

                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
                    {symptoms.map(s => <span key={s} className="badge badge-red" style={{ fontSize: 12 }}>{s}</span>)}
                  </div>

                  <div style={{ marginBottom: 14 }}>
                    {[
                      ['phc_notified', `PHC ${alert.block} notified`],
                      ['rrt_deployed', 'Rapid Response Team deployed'],
                      ['lab_ordered', 'Lab samples ordered'],
                      ['cmo_escalated', 'CMO escalated'],
                    ].map(([key, label]) => {
                      const done = actionKeys.includes(key)
                      return (
                        <div key={key} onClick={() => toggleAction(alert.id, key)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0', cursor: 'pointer' }}>
                          <div style={{ width: 20, height: 20, borderRadius: 6, border: '2px solid', borderColor: done ? 'var(--green)' : 'var(--border)', background: done ? 'var(--green)' : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.2s' }}>
                            {done && <span style={{ color: '#fff', fontSize: 12 }}>✓</span>}
                          </div>
                          <span style={{ fontSize: 13, color: done ? 'var(--gray)' : 'var(--navy)', textDecoration: done ? 'line-through' : 'none' }}>{label}</span>
                        </div>
                      )
                    })}
                  </div>

                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <button className="btn-primary" style={{ padding: '8px 16px', fontSize: 13 }} onClick={() => toggleAction(alert.id, 'rrt_deployed')}>Deploy RRT</button>
                    <button className="btn-secondary" style={{ padding: '8px 16px', fontSize: 13 }} onClick={() => toggleAction(alert.id, 'lab_ordered')}>Order Lab Tests</button>
                    <button className="btn-ghost" style={{ padding: '8px 16px', fontSize: 13, color: 'var(--green)' }} onClick={() => resolve(alert.id)}>Mark Resolved</button>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {resolved.length > 0 && (
          <div style={{ fontSize: 14, color: 'var(--gray)', fontWeight: 500 }}>
            {resolved.length} resolved alert{resolved.length > 1 ? 's' : ''}
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
