export default function OutbreakBadge({ count, block }) {
  if (!count || count === 0) return null
  return (
    <div style={{
      background: '#FEF3C7', borderLeft: '4px solid #F59E0B',
      borderRadius: 12, padding: '12px 16px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      animation: 'pulse-bg 2s ease-in-out infinite',
    }}>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        <span style={{ fontSize: 20 }}>🚨</span>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#92400E' }}>
            Outbreak Alert in {block}
          </div>
          <div style={{ fontSize: 12, color: '#B45309' }}>{count} cases reported</div>
        </div>
      </div>
      <span style={{ fontSize: 12, color: 'var(--teal)', fontWeight: 500 }}>View →</span>
      <style>{`@keyframes pulse-bg { 0%,100%{opacity:1} 50%{opacity:0.85} }`}</style>
    </div>
  )
}
