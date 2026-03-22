import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAssessment } from '../../context/AssessmentContext'
import { useLanguage } from '../../context/LanguageContext'
import { t } from '../../utils/translation'
import ProgressBar from '../../components/ProgressBar'

export default function PatientInfo() {
  const navigate = useNavigate()
  const { update } = useAssessment()
  const { selectedLanguage: lang } = useLanguage()
  const [patientType, setPatientType] = useState('')
  const [age, setAge] = useState('')
  const [gender, setGender] = useState('')
  const [district, setDistrict] = useState('')
  const [block, setBlock] = useState('')
  const [village, setVillage] = useState('')
  const [state, setState] = useState('')
  const [locating, setLocating] = useState(false)
  const [gpsError, setGpsError] = useState('')

  const PATIENT_TYPES = [
    { id: 'self',    icon: '👤', label: t('myself', lang) },
    { id: 'child',   icon: '👶', label: t('myChild', lang) },
    { id: 'elderly', icon: '👴', label: t('elderly', lang) },
    { id: 'other',   icon: '👥', label: t('someoneElse', lang) },
  ]

  const canContinue = patientType && age && gender && district

  const handleGPS = () => {
    if (!navigator.geolocation) {
      setGpsError(t('gpsNotSupported', lang))
      return
    }
    setLocating(true)
    setGpsError('')
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${coords.latitude}&lon=${coords.longitude}&format=json&addressdetails=1`,
            { headers: { 'Accept-Language': 'en' } }
          )
          const data = await res.json()
          const addr = data.address || {}
          // Nominatim fields vary — cover all common keys
          const detectedDistrict = addr.county || addr.district || addr.state_district || addr.city_district || ''
          const detectedBlock    = addr.suburb || addr.town || addr.village || addr.hamlet || addr.neighbourhood || ''
          const detectedVillage  = addr.village || addr.hamlet || addr.neighbourhood || addr.quarter || ''
          const detectedState    = addr.state || ''

          setDistrict(detectedDistrict)
          setBlock(detectedBlock)
          setVillage(detectedVillage)
          setState(detectedState)
          // Save real GPS coords so TriageResult can find nearby facilities
          update({ userLat: coords.latitude, userLng: coords.longitude })
        } catch {
          setGpsError('Could not fetch location details. Please enter manually.')
        } finally {
          setLocating(false)
        }
      },
      (err) => {
        setLocating(false)
        if (err.code === 1) setGpsError('Location permission denied. Please allow access.')
        else if (err.code === 2) setGpsError('Location unavailable. Try again.')
        else setGpsError('Location request timed out.')
      },
      { timeout: 10000, enableHighAccuracy: true }
    )
  }

  const handleContinue = () => {
    update({ patientType, patientAge: age, patientGender: gender, district, block, village, state })
    navigate('/user/symptoms')
  }

  return (
    <>
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <div className="mobile-container page-enter" style={{ paddingTop: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 24 }}>
          <button onClick={() => navigate(-1)} className="btn-ghost" style={{ padding: '8px 0', fontSize: 14, color: 'var(--gray)' }}>← {t('back', lang)}</button>
        </div>

        <ProgressBar currentStep={2} totalSteps={5} />

        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--navy)', marginBottom: 4 }}>{t('whoNeedsHelp', lang)}</h1>
          <p style={{ fontSize: 14, color: 'var(--gray)' }}>{t('patientInfo', lang)}</p>
        </div>

        {/* Patient type */}
        <div style={{ marginBottom: 24 }}>
          <label className="input-label">{t('whoNeedsHelp', lang)}</label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {PATIENT_TYPES.map(pt => (
              <div key={pt.id} onClick={() => setPatientType(pt.id)} style={{
                background: patientType === pt.id ? 'var(--light-blue)' : '#fff',
                border: patientType === pt.id ? '1.5px solid var(--blue)' : '1.5px solid var(--border)',
                borderRadius: 16, padding: '16px 12px', textAlign: 'center', cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: patientType === pt.id ? '0 0 0 3px rgba(42,143,163,0.12)' : 'var(--shadow-sm)',
              }}>
                <div style={{ fontSize: 28, marginBottom: 6 }}>{pt.icon}</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--navy)' }}>{pt.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Age */}
        {patientType && (
          <div style={{ marginBottom: 20, animation: 'pageEnter 0.3s ease both' }}>
            <label className="input-label">{t('age', lang)}</label>
            <input type="number" min={0} max={120} value={age} onChange={e => setAge(e.target.value)} placeholder={t('age', lang)} className="input-field" />
          </div>
        )}

        {/* Gender */}
        <div style={{ marginBottom: 24 }}>
          <label className="input-label">{t('gender', lang)}</label>
          <div style={{ display: 'flex', gap: 10 }}>
            {[['male', t('male', lang)], ['female', t('female', lang)], ['other', t('other', lang)]].map(([id, label]) => (
              <button key={id} onClick={() => setGender(id)} style={{
                flex: 1, padding: '12px 8px', borderRadius: 9999, border: '1.5px solid',
                borderColor: gender === id ? 'var(--blue)' : 'var(--border)',
                background: gender === id ? 'var(--blue)' : '#fff',
                color: gender === id ? '#fff' : 'var(--navy)',
                fontSize: 13, fontWeight: 500, cursor: 'pointer', transition: 'all 0.2s ease',
              }}>
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Location */}
        <div style={{ marginBottom: 24 }}>
          <label className="input-label">{t('district', lang)}</label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {state && (
              <div style={{ fontSize: 12, color: 'var(--blue)', fontWeight: 500, padding: '4px 0' }}>
                📍 {state}
              </div>
            )}
            <input
              value={district}
              onChange={e => setDistrict(e.target.value)}
              placeholder={t('district', lang)}
              className="input-field"
            />
            <input
              value={block}
              onChange={e => setBlock(e.target.value)}
              placeholder={t('block', lang)}
              className="input-field"
            />
            <input
              value={village}
              onChange={e => setVillage(e.target.value)}
              placeholder={t('village', lang)}
              className="input-field"
            />
          </div>
          <button
            onClick={handleGPS}
            disabled={locating}
            style={{ marginTop: 10, background: 'none', border: 'none', cursor: locating ? 'not-allowed' : 'pointer', color: 'var(--blue)', fontSize: 13, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6, opacity: locating ? 0.6 : 1 }}
          >
            {locating
              ? <><span style={{ display: 'inline-block', width: 14, height: 14, border: '2px solid var(--blue)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} /> Detecting location...</>
              : `📍 ${t('useMyLocation', lang)}`
            }
          </button>
          {gpsError && (
            <div style={{ marginTop: 6, fontSize: 12, color: '#EF4444', background: '#FEF2F2', borderRadius: 8, padding: '6px 10px' }}>
              {gpsError}
            </div>
          )}
        </div>

        <button className="btn-primary full" onClick={handleContinue} disabled={!canContinue}>
          {t('continue', lang)} →
        </button>
      </div>
    </div>
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </>
  )
}
