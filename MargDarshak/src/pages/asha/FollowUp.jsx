import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../components/Toast'
import { getPatientsByAsha, submitFeedback } from '../../utils/api'

export default function FollowUp() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const addToast = useToast()
  const [patient, setPatient] = useState(null)
  const [loading, setLoading] = useState(true)
  const [outcome, setOutcome] = useState('')
  const [visited, setVisited] = useState('')
  const [doctorNote, setDoctorNote] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!user?.id) return
    getPatientsByAsha(user.id)
      .then(res => {
        const found = (res.data.patients || []).find(p => p.id === id)
        setPatient(found || null)
      })
      .catch(() => setPatient(null))
      .finally(() => setLoading(false))
  }, [user?.id, id])

  const handleSubmit = async () => {
    setSaving(true)
    try {
      await submitFeedback(id, {
        outcome,
        visited_facility: visited === 'yes' ? 1 : 0,
        doctor_diagnosis: doctorNote || null,
        submitted_by: user?.id,
      })
      if (outcome === 'worse') {
        addToast('Redirecting to reassessment...', 'warning')
        navigate('/asha/assess')
      } else {
        addToast('Follow-up saved', 'success')
        navigate('/asha/patients')
      }
    } catch {
      addToast('Failed to save. Try again.', 'error')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 32, height: 32, border: '3px solid var(--border)', borderTopColor: 'var(--blue)', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )

  if (!patient) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
      <div style={{ fontSize: 48 }}>not found</div>
      <button className="btn-primary" onClick={() => navigate('/asha/patients')}>Back to Patients</button>
    </div>
  )

  const symptoms = Array.isArray(patient.symptoms) ? patient.symptoms.join(', ') : (patient.symptoms || 'N/A')
  const dateStr = patient.created_at ? new Date(patient.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : ''

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <div style={{ background: '#fff', borderBottom: '1px solid var(--border)', padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 12, position: 'sticky', top: 0, zIndex: 50 }}>
        <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: 'var(--gray)' }}>back</button>
        <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--navy)' }}>Follow Up: {patient.patient_name}</div>
      </div>

      <div className="mobile-container page-enter" style={{ paddingTop: 24, paddingBottom: 40 }}>
        <div className="card" style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--light-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 700, color: 'var(--blue)' }}>
              {(patient.patient_name || '?')[0]}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--navy)' }}>{patient.patient_name}</div>
              <div style={{ fontSize: 13, color: 'var(--gray)' }}>
                {patient.patient_age ? `${patient.patient_age}yrs` : ''}{patient.patient_gender ? ` - ${patient.patient_gender === 'M' ? 'Male' : 'Female'}` : ''}
              </div>
            </div>
            <span className={`badge badge-${patient.triage_level === 'RED' ? 'red' : patient.triage_level === 'YELLOW' ? 'yellow' : 'green'}`}>{patient.triage_level}</span>
          </div>
          <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border)', fontSize: 13, color: 'var(--gray)' }}>
            <div>Symptoms: {symptoms}</div>
            <div>Assessed: {dateStr}</div>
          </div>
        </div>

        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--navy)', marginBottom: 14 }}>
            How is {patient.patient_name} feeling today? / aaj kaisa mahsoos ho raha hai?
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { id: 'better', icon: '😊', label: 'Better', hi: 'behtar', bg: 'var(--light-blue)', border: 'var(--teal)' },
              { id: 'same',   icon: '😐', label: 'Same',   hi: 'waisa hi', bg: '#FFFBEB', border: '#F59E0B' },
              { id: 'worse',  icon: '😟', label: 'Worse',  hi: 'bura',   bg: '#FEF2F2', border: '#EF4444' },
            ].map(o => (
              <div key={o.id} onClick={() => setOutcome(o.id)} style={{
                background: outcome === o.id ? o.bg : '#fff',
                border: `1.5px solid ${outcome === o.id ? o.border : 'var(--border)'}`,
                borderRadius: 14, padding: '16px 20px', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 14, transition: 'all 0.2s',
              }}>
                <span style={{ fontSize: 28 }}>{o.icon}</span>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--navy)' }}>{o.label}</div>
                  <div style={{ fontSize: 13, color: 'var(--gray)' }}>{o.hi}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {outcome && outcome !== 'worse' && (
          <div style={{ marginBottom: 24, animation: 'pageEnter 0.3s ease both' }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--navy)', marginBottom: 12 }}>
              Did {patient.patient_name} visit the facility?
            </div>
            <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
              {['yes','no'].map(v => (
                <button key={v} onClick={() => setVisited(v)} style={{
                  flex: 1, height: 48, borderRadius: 9999, border: '1.5px solid',
                  borderColor: visited === v ? 'var(--blue)' : 'var(--border)',
                  background: visited === v ? 'var(--blue)' : '#fff',
                  color: visited === v ? '#fff' : 'var(--navy)',
                  fontSize: 14, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s',
                }}>{v === 'yes' ? 'Yes' : 'No'}</button>
              ))}
            </div>
            {visited === 'yes' && (
              <textarea value={doctorNote} onChange={e => setDoctorNote(e.target.value)} placeholder="What did the doctor say? (optional)" rows={3} className="input-field" style={{ height: 'auto', resize: 'none' }} />
            )}
          </div>
        )}

        {outcome && (
          <button className="btn-primary full" onClick={handleSubmit} disabled={saving}>
            {saving ? 'Saving...' : 'Save Follow-Up'}
          </button>
        )}
      </div>
    </div>
  )
}
