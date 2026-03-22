import { useState, useEffect } from 'react'
import AdminLayout from './AdminLayout'
import { getHeatmapData } from '../../utils/api'

function cellColor(val) {
  if (val === 0) return '#fff'
  if (val <= 5) return '#E8F4F7'
  if (val <= 15) return '#B2D8E0'
  if (val <= 30) return '#2A8FA3'
  return '#1B6B7B'
}
function cellTextColor(val) { return val > 15 ? '#fff' : 'var(--navy)' }

export default function SymptomHeatmap() {
  const [dateRange, setDateRange] = useState('week')
  const [selected, setSelected] = useState(null)
  const [heatmapData, setHeatmapData] = useState({ blocks: [], symptoms: [], data: {} })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    getHeatmapData(undefined, dateRange)
      .then(res => setHeatmapData(res.data))
      .catch(() => setHeatmapData({ blocks: [], symptoms: [], data: {} }))
      .finally(() => setLoading(false))
  }, [dateRange])

  const { blocks, symptoms, data } = heatmapData

  return (
    <AdminLayout>
      <div className="page-enter">
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--navy)', marginBottom: 4 }}>Symptom Heatmap</h1>
        <p style={{ fontSize: 14, color: 'var(--gray)', marginBottom: 24 }}>Block x Symptom concentration</p>

        <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 24, flexWrap: 'wrap' }}>
          {['today','week','month'].map(r => (
            <button key={r} onClick={() => setDateRange(r)} style={{
              padding: '8px 16px', borderRadius: 9999, border: '1.5px solid',
              borderColor: dateRange === r ? 'var(--blue)' : 'var(--border)',
              background: dateRange === r ? 'var(--blue)' : '#fff',
              color: dateRange === r ? '#fff' : 'var(--navy)',
              fontSize: 13, fontWeight: 500, cursor: 'pointer', transition: 'all 0.2s', textTransform: 'capitalize',
            }}>{r === 'today' ? 'Today' : r === 'week' ? 'This Week' : 'This Month'}</button>
          ))}
        </div>

        {loading ? (
          <div className="card" style={{ height: 300, background: 'var(--border)', animation: 'pulse 1.5s infinite' }} />
        ) : blocks.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: 48 }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>No data for this period</div>
            <div style={{ fontSize: 14, color: 'var(--gray)' }}>Assessments will appear here once recorded</div>
          </div>
        ) : (
          <div className="card" style={{ overflowX: 'auto', marginBottom: 24 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr>
                  <th style={{ padding: '10px 14px', textAlign: 'left', color: 'var(--gray)', fontWeight: 600, borderBottom: '1px solid var(--border)' }}>Block</th>
                  {symptoms.map(s => (
                    <th key={s} style={{ padding: '10px 10px', textAlign: 'center', color: 'var(--gray)', fontWeight: 600, borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap', fontSize: 12 }}>{s}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {blocks.map(block => (
                  <tr key={block}>
                    <td style={{ padding: '10px 14px', fontWeight: 600, color: 'var(--navy)', borderBottom: '1px solid var(--border)' }}>{block}</td>
                    {symptoms.map(sym => {
                      const val = data[block]?.[sym] || 0
                      const isOutbreak = val >= 20
                      return (
                        <td key={sym} onClick={() => setSelected({ block, sym, val })} style={{
                          padding: '10px', textAlign: 'center', cursor: 'pointer',
                          background: isOutbreak ? '#EF4444' : cellColor(val),
                          color: isOutbreak ? '#fff' : cellTextColor(val),
                          borderBottom: '1px solid var(--border)',
                          fontWeight: val > 0 ? 600 : 400,
                          transition: 'opacity 0.2s',
                        }}>
                          {val > 0 ? val : '—'}
                          {isOutbreak && ' ⚠'}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 24, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 12, color: 'var(--gray)' }}>Intensity:</span>
          {[['0','#fff'],['1-5','#E8F4F7'],['6-15','#B2D8E0'],['16-30','#2A8FA3'],['31+','#1B6B7B'],['Outbreak','#EF4444']].map(([label, bg]) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 16, height: 16, borderRadius: 4, background: bg, border: '1px solid var(--border)' }} />
              <span style={{ fontSize: 12, color: 'var(--gray)' }}>{label}</span>
            </div>
          ))}
        </div>

        {selected && (
          <div className="card" style={{ borderLeft: '4px solid var(--blue)', animation: 'pageEnter 0.3s ease both' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--navy)' }}>{selected.block} — {selected.sym}</div>
              <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--gray)', fontSize: 18 }}>X</button>
            </div>
            <div style={{ fontSize: 32, fontWeight: 800, color: 'var(--blue)', marginBottom: 8 }}>{selected.val} cases</div>
            <div style={{ fontSize: 13, color: 'var(--gray)' }}>in {dateRange === 'today' ? 'today' : dateRange === 'week' ? 'this week' : 'this month'}</div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
