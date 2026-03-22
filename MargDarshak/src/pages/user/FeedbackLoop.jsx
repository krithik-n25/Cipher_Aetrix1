import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAssessment } from '../../context/AssessmentContext'
import { useLanguage } from '../../context/LanguageContext'
import { t } from '../../utils/translation'
import { submitFeedback } from '../../utils/api'
import { useToast } from '../../components/Toast'

export default function FeedbackLoop() {
  const navigate = useNavigate()
  const { assessment, reset } = useAssessment()
  const addToast = useToast()
  const { selectedLanguage: lang } = useLanguage()
  const [outcome, setOutcome] = useState('')
  const [visited, setVisited] = useState('')
  const [doctorNote, setDoctorNote] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)

  const OUTCOMES = [
    { id: 'better', icon: '😊', label: t('yes', lang) + ' — ' + t('manageAtHome', lang), bg: 'var(--light-blue)', border: 'var(--teal)' },
    { id: 'same',   icon: '😐', label: t('no', lang),  bg: '#FFFBEB', border: '#F59E0B' },
    { id: 'worse',  icon: '😟', label: t('warningSigns', lang), bg: '#FEF2F2', border: '#EF4444' },
  ]

  const pending = JSON.parse(localStorage.getItem('pendingFollowUp') || '{}')

  const handleSubmit = async () => {
    setLoading(true)
    try {
      try {
        await submitFeedback(pending.assessmentId || assessment.assessmentId, { outcome, visited_facility: visited === 'yes', doctor_diagnosis: doctorNote })
      } catch { /* demo mode */ }
      localStorage.removeItem('pendingFollowUp')
      if (outcome === 'worse') {
        addToast('Redirecting to reassessment...', 'warning')
        reset()
        navigate('/user/symptoms')
      } else {
        setSubmitted(true)
      }
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="mobile-container" style={{ textAlign: 'center', paddingTop: 40 }}>
          <svg width="80" height="80" viewBox="0 0 80 80" style={{ marginBottom: 24 }}>
            <circle cx="40" cy="40" r="38" fill="var(--light-blue)" stroke="var(--teal)" strokeWidth="2" />
            <path d="M24 40 L35 51 L56 30" stroke="var(--teal)" strokeWidth="4" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="100" strokeDashoffset="0" style={{ animation: 'drawCheck 0.8s ease both' }} />
          </svg>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--navy)', marginBottom: 8 }}>Thank you for letting us know!</h2>
          <p style={{ fontSize: 14, color: 'var(--gray)', marginBottom: 8 }}>Your feedback helps us improve.</p>
          <p style={{ fontSize: 16 }}>Stay healthy! 💚</p>
          <button className="btn-primary full" style={{ marginTop: 32 }} onClick={() => { reset(); navigate('/user/language') }}>Done</button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <div className="mobile-container page-enter" style={{ paddingTop: 40 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>👨‍⚕️</div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--navy)', marginBottom: 8 }}>Hello! 👋</h2>
          <p style={{ fontSize: 14, color: 'var(--gray)', marginBottom: 4 }}>Two days ago you checked your symptoms.</p>
          <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--navy)' }}>{t('warningSigns', lang)}</p>
        </div>

        {pending.triageLevel && (
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', background: '#fff', border: '1px solid var(--border)', borderRadius: 12, padding: '12px 16px', marginBottom: 24 }}>
            <span className={`badge badge-${pending.triageLevel === 'RED' ? 'red' : pending.triageLevel === 'YELLOW' ? 'yellow' : 'green'}`}>{pending.triageLevel}</span>
            <span style={{ fontSize: 13, color: 'var(--gray)' }}>Previous assessment</span>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
          {OUTCOMES.map(o => (
            <div key={o.id} onClick={() => setOutcome(o.id)} style={{
              background: outcome === o.id ? o.bg : '#fff',
              border: `1.5px solid ${outcome === o.id ? o.border : 'var(--border)'}`,
              borderRadius: 16, padding: '20px 20px', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 16,
              transition: 'all 0.2s ease',
              boxShadow: outcome === o.id ? `0 0 0 3px ${o.border}22` : 'var(--shadow-sm)',
            }}>
              <span style={{ fontSize: 32 }}>{o.icon}</span>
              <div>
                <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--navy)' }}>{o.label}</div>
                <div style={{ fontSize: 13, color: 'var(--gray)' }}>{o.hi}</div>
              </div>
            </div>
          ))}
        </div>

        {outcome && outcome !== 'worse' && (
          <div style={{ animation: 'pageEnter 0.3s ease both', marginBottom: 24 }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--navy)', marginBottom: 12 }}>{t('visitDoctor', lang)}</div>
            <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
              {['yes', 'no'].map(v => (
                <button key={v} onClick={() => setVisited(v)} style={{
                  flex: 1, height: 48, borderRadius: 9999, border: '1.5px solid',
                  borderColor: visited === v ? 'var(--blue)' : 'var(--border)',
                  background: visited === v ? 'var(--blue)' : '#fff',
                  color: visited === v ? '#fff' : 'var(--navy)',
                  fontSize: 14, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s ease',
                }}>
                  {v === 'yes' ? t('yes', lang) + ' ✓' : t('no', lang) + ' ✗'}
                </button>
              ))}
            </div>
            {visited === 'yes' && (
              <textarea value={doctorNote} onChange={e => setDoctorNote(e.target.value)} placeholder="What did the doctor say? (optional)" rows={3} className="input-field" style={{ height: 'auto', resize: 'none' }} />
            )}
          </div>
        )}

        {outcome === 'worse' && (
          <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 16, padding: 20, marginBottom: 24, animation: 'pageEnter 0.3s ease both' }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: '#991B1B', marginBottom: 8 }}>We're sorry to hear that.</div>
            <div style={{ fontSize: 14, color: '#B91C1C', marginBottom: 16 }}>Let's check your symptoms again. / आपके लक्षण फिर से जाँचते हैं।</div>
            <button className="btn-primary full" onClick={handleSubmit} disabled={loading}>Reassess Now →</button>
          </div>
        )}

        {outcome && outcome !== 'worse' && (
          <button className="btn-primary full" onClick={handleSubmit} disabled={loading || !outcome}>
            {loading ? t('analyzing', lang) : t('submit', lang)}
          </button>
        )}
      </div>
    </div>
  )
}
