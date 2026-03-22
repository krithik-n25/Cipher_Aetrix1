import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLanguage } from '../../context/LanguageContext'
import { t } from '../../utils/translation'
import ProgressBar from '../../components/ProgressBar'

const LANGUAGES = [
  { code: 'hi', native: 'हिंदी',    english: 'Hindi',    region: 'North India' },
  { code: 'mr', native: 'मराठी',    english: 'Marathi',  region: 'Maharashtra' },
  { code: 'gu', native: 'ગુજરાતી', english: 'Gujarati', region: 'Gujarat' },
  { code: 'ta', native: 'தமிழ்',   english: 'Tamil',    region: 'Tamil Nadu' },
  { code: 'en', native: 'English',  english: 'English',  region: 'All Regions', full: true },
]

export default function LanguageSelect() {
  const [selected, setSelected] = useState(null)
  const { setLanguage } = useLanguage()
  const navigate = useNavigate()

  const handleContinue = () => {
    if (!selected) return
    setLanguage(selected)
    navigate('/user/patient-info')
  }

  // Use selected lang for button text, fallback to 'en'
  const lang = selected || 'en'

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: -100, right: -100, width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(27,107,123,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', top: 20, right: 20, opacity: 0.6 }}>
        <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
          <rect x="18" y="6" width="12" height="36" rx="4" fill="url(#cg)" />
          <rect x="6" y="18" width="36" height="12" rx="4" fill="url(#cg)" />
          <defs><linearGradient id="cg" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#1B6B7B"/><stop offset="1" stopColor="#2A8FA3"/></linearGradient></defs>
        </svg>
      </div>

      <div className="mobile-container page-enter" style={{ paddingTop: 40 }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 16, fontWeight: 600, color: 'var(--blue)' }}>
            🏥 Margdarshak
          </div>
        </div>

        <ProgressBar currentStep={1} totalSteps={5} />

        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--navy)', marginBottom: 6 }}>
            {t('chooseLanguage', lang)}
          </h1>
          <p style={{ fontSize: 14, color: 'var(--gray)', maxWidth: 320, margin: '0 auto' }}>
            {t('weWillCommunicate', lang)}
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
          {LANGUAGES.filter(l => !l.full).map(lang => (
            <LangCard key={lang.code} lang={lang} selected={selected === lang.code} onSelect={() => setSelected(lang.code)} />
          ))}
        </div>
        {LANGUAGES.filter(l => l.full).map(l => (
          <LangCard key={l.code} lang={l} selected={selected === l.code} onSelect={() => setSelected(l.code)} full />
        ))}

        <div style={{ marginTop: 24, transition: 'all 0.3s ease', opacity: selected ? 1 : 0, transform: selected ? 'scale(1)' : 'scale(0.95)', pointerEvents: selected ? 'auto' : 'none' }}>
          <button className="btn-primary full" onClick={handleContinue}>
            {t('continue', lang)} →
          </button>
        </div>

        <p style={{ textAlign: 'center', fontSize: 11, color: '#9CA3AF', marginTop: 16 }}>
          You can change language anytime
        </p>
      </div>
    </div>
  )
}

function LangCard({ lang, selected, onSelect, full }) {
  return (
    <div onClick={onSelect} style={{
      background: selected ? 'linear-gradient(135deg,rgba(27,107,123,0.08),rgba(42,143,163,0.04))' : '#fff',
      border: selected ? '1.5px solid var(--blue)' : '1.5px solid var(--border)',
      borderRadius: 16, padding: '24px 20px', textAlign: 'center', cursor: 'pointer',
      transition: 'all 0.2s ease', position: 'relative',
      boxShadow: selected ? '0 0 0 3px rgba(42,143,163,0.12), 0 8px 24px rgba(27,107,123,0.15)' : 'var(--shadow-sm)',
      transform: selected ? 'translateY(-2px)' : 'none',
      gridColumn: full ? '1 / -1' : 'auto',
    }}>
      {selected && (
        <div style={{ position: 'absolute', top: 10, right: 10, width: 20, height: 20, borderRadius: '50%', background: 'var(--blue)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 11, fontWeight: 700 }}>✓</div>
      )}
      <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--navy)', marginBottom: 4 }}>{lang.native}</div>
      <div style={{ fontSize: 13, color: 'var(--gray)', marginBottom: 8 }}>{lang.english}</div>
      <span style={{ fontSize: 11, background: 'var(--light-blue)', color: 'var(--blue)', padding: '2px 10px', borderRadius: 9999, fontWeight: 500 }}>{lang.region}</span>
    </div>
  )
}
