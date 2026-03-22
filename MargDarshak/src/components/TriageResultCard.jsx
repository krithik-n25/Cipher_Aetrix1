export default function TriageResultCard({ level, reason, action, selfCare = [], warningSigns = [] }) {
  const config = {
    RED:    { bg: 'linear-gradient(135deg,#EF4444,#FF6B6B)', icon: '🚨', label: 'THIS IS AN EMERGENCY', sub: 'Call 108 immediately. Do not wait.', textColor: '#fff' },
    YELLOW: { bg: 'linear-gradient(135deg,#F59E0B,#FCD34D)', icon: '⚠️', label: 'Visit a Doctor',        sub: 'Within 24 hours',                  textColor: '#78350F' },
    GREEN:  { bg: 'linear-gradient(135deg,#1B6B7B,#2A8FA3)', icon: '✅', label: 'You Can Manage at Home', sub: 'Rest and follow the steps below',   textColor: '#fff' },
  }
  const c = config[level] || config.GREEN

  return (
    <div style={{ borderRadius: 20, overflow: 'hidden', boxShadow: 'var(--shadow-lg)' }}>
      <div style={{ background: c.bg, padding: '32px 24px', textAlign: 'center', color: c.textColor }}>
        <div style={{ fontSize: 56, marginBottom: 12, animation: level === 'RED' ? 'pulse-scale 1s infinite' : 'none' }}>{c.icon}</div>
        <div style={{ fontSize: level === 'RED' ? 22 : 20, fontWeight: 800, fontFamily: 'Poppins', marginBottom: 8 }}>{c.label}</div>
        <div style={{ fontSize: 14, opacity: 0.85 }}>{c.sub}</div>
        {reason && <div style={{ fontSize: 13, opacity: 0.8, marginTop: 8 }}>{reason}</div>}
      </div>
      {(selfCare.length > 0 || warningSigns.length > 0) && (
        <div style={{ background: '#fff', padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {selfCare.length > 0 && (
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 10 }}>🏠 Do This at Home</div>
              {selfCare.map((item, i) => (
                <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 8, fontSize: 14, color: '#374151', lineHeight: 1.6 }}>
                  <span style={{ color: 'var(--green)', fontWeight: 700, flexShrink: 0 }}>{i + 1}.</span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          )}
          {warningSigns.length > 0 && (
            <div style={{ background: '#FFFBEB', borderRadius: 12, padding: 16 }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 10, color: '#92400E' }}>⚠️ Go to Emergency If:</div>
              {warningSigns.map((sign, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 6, fontSize: 13, color: '#92400E' }}>
                  <span style={{ color: 'var(--amber)' }}>•</span>
                  <span>{sign}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      <style>{`@keyframes pulse-scale { 0%,100%{transform:scale(1)} 50%{transform:scale(1.1)} }`}</style>
    </div>
  )
}
