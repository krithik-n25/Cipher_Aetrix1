import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAssessment } from '../../context/AssessmentContext'
import { useLanguage } from '../../context/LanguageContext'
import { t } from '../../utils/translation'
import { fetchNearbyFacilities } from '../../utils/nearbyFacilities'

export default function TriageResult() {
  const navigate = useNavigate()
  const { assessment, reset } = useAssessment()
  const { selectedLanguage: lang } = useLanguage()
  const result = assessment.triageResult

  const [facilities, setFacilities] = useState([])
  const [facilityLoading, setFacilityLoading] = useState(false)
  const [facilityError, setFacilityError] = useState('')
  const [expandedIdx, setExpandedIdx] = useState(0)

  if (!result) { navigate('/user/language'); return null }

  const level = result.triage_level || result.level || 'YELLOW'
  const selfCare = result.self_care_instructions || result.selfCare || []
  const warningSigns = result.warning_signs || result.warningSigns || []
  const reason = result.triage_reason || result.reason || ''
  const action = result.recommended_action || result.action || ''

  useEffect(() => {
    const lat = assessment.userLat
    const lng = assessment.userLng
    if (!lat || !lng) return

    setFacilityLoading(true)
    setFacilityError('')
    fetchNearbyFacilities(lat, lng)
      .then(list => {
        setFacilities(list)
        setFacilityError(list.length === 0 ? 'No health facilities found within 5 km.' : '')
      })
      .catch(() => {
        setFacilityError('Could not load nearby facilities. Check your connection.')
      })
      .finally(() => setFacilityLoading(false))
  }, [assessment.userLat, assessment.userLng])

  const headerConfig = {
    RED:    { bg: 'linear-gradient(135deg,#EF4444,#FF6B6B)', icon: '🚨', title: t('emergency', lang),    sub: t('call108', lang) },
    YELLOW: { bg: 'linear-gradient(135deg,#F59E0B,#FCD34D)', icon: '⚠️', title: t('visitDoctor', lang),  sub: t('nearestFacility', lang), textColor: '#78350F' },
    GREEN:  { bg: 'linear-gradient(135deg,#1B6B7B,#2A8FA3)', icon: '✅', title: t('manageAtHome', lang), sub: t('selfCare', lang) },
  }
  const c = headerConfig[level]
  const textColor = c.textColor || '#fff'
  const whatsappText = encodeURIComponent(`Margdarshak Assessment Result:\nLevel: ${level}\n${reason}\nAction: ${action}`)

  const typeIcon = (type) => {
    if (type === 'PHC') return '🏥'
    if (type === 'CHC') return '🏨'
    if (type?.includes('Govt')) return '🏛️'
    if (type === 'Clinic') return '🩺'
    return '🏥'
  }

  const typeColor = (isGovt) => isGovt
    ? { bg: '#E8F5E9', color: '#2E7D32' }
    : { bg: '#EEF2FF', color: '#3730A3' }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>

      {/* ── Header ── */}
      <div style={{ background: c.bg, padding: '52px 28px 72px', textAlign: 'center', color: textColor }}>
        <div style={{ fontSize: 60, marginBottom: 14, animation: level === 'RED' ? 'pulse-scale 1s infinite' : 'none' }}>{c.icon}</div>
        <div style={{ fontSize: level === 'RED' ? 24 : 21, fontWeight: 800, letterSpacing: '-0.3px', marginBottom: 6 }}>{c.title}</div>
        <div style={{ fontSize: 14, opacity: 0.85 }}>{c.sub}</div>
        {reason && (
          <div style={{ fontSize: 13, opacity: 0.75, marginTop: 10, maxWidth: 340, margin: '10px auto 0', lineHeight: 1.5 }}>{reason}</div>
        )}
      </div>

      {/* ── Content ── */}
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '0 20px 48px', marginTop: -40 }}>

        {/* RED: Call 108 */}
        {level === 'RED' && (
          <a href="tel:108" style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
            background: '#fff', color: '#EF4444', borderRadius: 18, padding: '22px 28px',
            fontSize: 20, fontWeight: 800, marginBottom: 14, textDecoration: 'none',
            boxShadow: '0 6px 24px rgba(239,68,68,0.25)', animation: 'pulse-shadow 1.5s infinite',
          }}>
            📞 {t('call108', lang)}
          </a>
        )}

        {action && level === 'RED' && (
          <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 14, padding: '14px 18px', marginBottom: 14, fontSize: 14, color: '#991B1B', fontWeight: 500, lineHeight: 1.5 }}>
            {action}
          </div>
        )}

        {/* ── Nearby Facilities ── */}
        <div style={{ background: '#fff', borderRadius: 20, padding: '20px 20px 16px', marginBottom: 16, boxShadow: '0 2px 16px rgba(13,43,51,0.07)' }}>
          {/* Section header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 18 }}>🏥</span>
              <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--navy)' }}>{t('nearestFacility', lang)}</span>
            </div>
            {assessment.userLat && (
              <span style={{ fontSize: 11, background: '#E8F5E9', color: '#2E7D32', borderRadius: 9999, padding: '3px 10px', fontWeight: 600 }}>
                📍 Live GPS
              </span>
            )}
          </div>

          {/* No GPS */}
          {!assessment.userLat && (
            <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 12, padding: '12px 14px', fontSize: 13, color: '#92400E' }}>
              ⚠️ GPS not captured. Go back and tap "Use My Location" for real nearby facilities.
            </div>
          )}

          {/* Loading spinner */}
          {facilityLoading && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 0' }}>
              <div style={{ width: 22, height: 22, border: '2.5px solid var(--border)', borderTopColor: 'var(--teal)', borderRadius: '50%', animation: 'spin 0.7s linear infinite', flexShrink: 0 }} />
              <span style={{ fontSize: 14, color: '#6B7280' }}>Finding nearby health facilities...</span>
            </div>
          )}

          {/* Error — only shown after loading finishes AND there's an actual error */}
          {!facilityLoading && facilityError && (
            <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 12, padding: '12px 14px', fontSize: 13, color: '#DC2626' }}>
              {facilityError}
            </div>
          )}

          {/* Facility list */}
          {!facilityLoading && facilities.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: facilities.length > 1 ? 'repeat(auto-fill, minmax(280px, 1fr))' : '1fr', gap: 10 }}>
              {facilities.map((fac, i) => {
                const isOpen = expandedIdx === i
                const tc = typeColor(fac.isGovt)
                const distLabel = fac.distance < 1
                  ? `${Math.round(fac.distance * 1000)} m`
                  : `${fac.distance.toFixed(1)} km`
                const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${fac.lat},${fac.lng}&travelmode=driving`

                return (
                  <div key={i} style={{
                    border: `1.5px solid ${isOpen ? 'var(--blue)' : 'var(--border)'}`,
                    borderRadius: 14,
                    overflow: 'hidden',
                    transition: 'border-color 0.2s',
                    background: isOpen ? '#FAFCFF' : '#fff',
                  }}>
                    {/* Collapsed row — always visible */}
                    <div
                      onClick={() => setExpandedIdx(isOpen ? -1 : i)}
                      style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', cursor: 'pointer' }}
                    >
                      <div style={{ width: 40, height: 40, borderRadius: 12, background: tc.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>
                        {typeIcon(fac.type)}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--navy)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{fac.name}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}>
                          <span style={{ fontSize: 11, background: tc.bg, color: tc.color, borderRadius: 9999, padding: '1px 8px', fontWeight: 600 }}>{fac.type}</span>
                          {fac.open24h && <span style={{ fontSize: 11, background: '#E8F5E9', color: '#2E7D32', borderRadius: 9999, padding: '1px 8px', fontWeight: 600 }}>24/7</span>}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--teal)' }}>{distLabel}</div>
                        <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>{isOpen ? '▲ less' : '▼ more'}</div>
                      </div>
                    </div>

                    {/* Expanded: map + actions */}
                    {isOpen && (
                      <div style={{ borderTop: '1px solid #E5E7EB' }}>
                        <div style={{ height: 180, overflow: 'hidden' }}>
                          <iframe
                            src={`https://maps.google.com/maps?q=${fac.lat},${fac.lng}&z=15&output=embed`}
                            width="100%" height="180"
                            style={{ border: 0, display: 'block' }}
                            loading="lazy"
                            title={fac.name}
                          />
                        </div>
                        <div style={{ display: 'flex', gap: 8, padding: '12px 16px' }}>
                          {fac.phone && (
                            <a href={`tel:${fac.phone}`} style={{
                              flex: 1, padding: '10px', borderRadius: 10, background: '#EEF2FF',
                              color: '#3730A3', fontSize: 13, fontWeight: 600, textAlign: 'center',
                              textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                            }}>
                              📞 Call
                            </a>
                          )}
                          <a href={directionsUrl} target="_blank" rel="noreferrer" style={{
                            flex: 1, padding: '10px', borderRadius: 10, background: '#E8F5E9',
                            color: '#2E7D32', fontSize: 13, fontWeight: 600, textAlign: 'center',
                            textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                          }}>
                            🗺️ Directions
                          </a>
                        </div>
                        {fac.hours && !fac.open24h && (
                          <div style={{ padding: '0 16px 12px', fontSize: 12, color: '#6B7280' }}>⏰ {fac.hours}</div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* ── Self-care ── */}
        {selfCare?.length > 0 && (
          <div style={{ background: '#fff', borderRadius: 20, padding: '20px', marginBottom: 16, boxShadow: '0 2px 16px rgba(13,43,51,0.07)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <span style={{ fontSize: 18 }}>🏠</span>
              <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--navy)' }}>{t('selfCare', lang)}</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: selfCare.length > 2 ? 'repeat(auto-fill, minmax(260px, 1fr))' : '1fr', gap: 10 }}>
              {selfCare.map((item, i) => (
                <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', background: 'var(--light-blue)', borderRadius: 10, padding: '10px 12px' }}>
                  <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#fff', color: 'var(--teal)', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1, border: '1px solid var(--border)' }}>{i + 1}</div>
                  <span style={{ fontSize: 14, color: 'var(--navy)', lineHeight: 1.6 }}>{item}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Warning signs ── */}
        {warningSigns?.length > 0 && (
          <div style={{ background: '#FFFBEB', border: '1.5px solid #FDE68A', borderRadius: 20, padding: '20px', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <span style={{ fontSize: 18 }}>⚠️</span>
              <span style={{ fontSize: 15, fontWeight: 700, color: '#92400E' }}>{t('warningSigns', lang)}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {warningSigns.map((sign, i) => (
                <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', fontSize: 13, color: '#92400E', lineHeight: 1.5 }}>
                  <span style={{ color: '#F59E0B', fontWeight: 700, flexShrink: 0, marginTop: 1 }}>•</span>
                  <span>{sign}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Action row ── */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
          <a href={`https://wa.me/?text=${whatsappText}`} target="_blank" rel="noreferrer" style={{
            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            background: '#25D366', color: '#fff', borderRadius: 14, padding: '14px',
            fontSize: 14, fontWeight: 600, textDecoration: 'none',
          }}>
            📲 WhatsApp
          </a>
          <button onClick={() => { reset(); navigate('/user/language') }} style={{
            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            background: '#fff', color: '#6B7280', border: '1.5px solid #E5E7EB', borderRadius: 14,
            padding: '14px', fontSize: 14, fontWeight: 600, cursor: 'pointer',
          }}>
            🔄 {t('back', lang)}
          </button>
        </div>

        {level !== 'RED' && (
          <div style={{ textAlign: 'center', padding: '14px 20px', background: 'var(--light-blue)', borderRadius: 14, border: '1px solid var(--border)' }}>
            <div style={{ fontSize: 13, color: 'var(--teal)', fontWeight: 500 }}>🔔 We'll check on you in 48 hours</div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes pulse-scale  { 0%,100%{transform:scale(1)} 50%{transform:scale(1.08)} }
        @keyframes pulse-shadow { 0%,100%{box-shadow:0 0 0 0 rgba(239,68,68,0.4)} 50%{box-shadow:0 0 0 14px transparent} }
        @keyframes spin         { to { transform: rotate(360deg); } }
        @keyframes pageEnter    { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:none} }
      `}</style>
    </div>
  )
}
