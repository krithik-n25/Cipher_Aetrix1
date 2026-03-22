import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

const NAV_ITEMS = [
  { path: '/admin/dashboard', icon: '📊', label: 'Dashboard' },
  { path: '/admin/heatmap',   icon: '🗺️', label: 'Symptom Heatmap' },
  { path: '/admin/phc',       icon: '🏥', label: 'PHC Monitor' },
  { path: '/admin/asha-tracker', icon: '👩‍⚕️', label: 'ASHA Tracker' },
  { path: '/admin/outbreaks', icon: '🚨', label: 'Outbreak Alerts' },
  { path: '/admin/reports',   icon: '📄', label: 'Reports' },
]

export default function AdminLayout({ children }) {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuth()

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)' }}>
      {/* Sidebar (desktop) */}
      <div style={{ width: 240, background: '#0D2B33', borderRight: 'none', display: 'flex', flexDirection: 'column', position: 'fixed', top: 0, bottom: 0, left: 0, zIndex: 100 }} className="admin-sidebar">
        <div style={{ padding: '24px 20px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <span style={{ fontSize: 20 }}>🏥</span>
            <span style={{ fontSize: 16, fontWeight: 700, color: '#E8F4F7', fontFamily: "'Space Grotesk', sans-serif" }}>Margdarshak</span>
          </div>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.85)' }}>{user?.name}</div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>{user?.district} District</div>
        </div>
        <nav style={{ flex: 1, padding: '12px 12px' }}>
          {NAV_ITEMS.map(item => {
            const active = location.pathname === item.path
            return (
              <button key={item.path} onClick={() => navigate(item.path)} style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 12px', borderRadius: 10, border: 'none', cursor: 'pointer',
                background: active ? 'rgba(42,143,163,0.2)' : 'transparent',
                color: active ? '#fff' : 'rgba(255,255,255,0.55)',
                fontSize: 14, fontWeight: active ? 600 : 400,
                borderLeft: active ? '3px solid #2A8FA3' : '3px solid transparent',
                marginBottom: 4, transition: 'all 0.2s', textAlign: 'left',
              }}>
                <span style={{ fontSize: 16 }}>{item.icon}</span>
                {item.label}
              </button>
            )
          })}
        </nav>
        <div style={{ padding: '16px 12px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <button onClick={() => { logout(); navigate('/login') }} style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.12)', background: 'transparent', color: 'rgba(255,255,255,0.45)', fontSize: 14, cursor: 'pointer', transition: 'all 0.2s' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = 'rgba(255,255,255,0.7)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.45)' }}
          >
            Logout
          </button>
        </div>
      </div>

      {/* Main content */}
      <div style={{ marginLeft: 240, flex: 1, minWidth: 0 }} className="admin-main">
        {/* Mobile top bar */}
        <div className="admin-mobile-bar" style={{ display: 'none', background: '#0D2B33', borderBottom: '1px solid rgba(255,255,255,0.08)', padding: '12px 16px', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 50 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>🏥</span>
            <span style={{ fontSize: 14, fontWeight: 600, color: '#E8F4F7' }}>Margdarshak</span>
          </div>
          <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>{user?.district}</span>
        </div>
        <div style={{ padding: 32, maxWidth: 1200 }}>
          {children}
        </div>
      </div>

      <style>{`
        @media (max-width: 1023px) {
          .admin-sidebar { display: none !important; }
          .admin-main { margin-left: 0 !important; }
          .admin-mobile-bar { display: flex !important; }
          .admin-main > div { padding: 16px !important; }
        }
      `}</style>
    </div>
  )
}
