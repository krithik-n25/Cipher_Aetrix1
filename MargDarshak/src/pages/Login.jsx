import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../components/Toast'
import { loginUser } from '../utils/api'

const ROLES = [
  { id: 'user',  icon: '👤', title: 'Patient / Family', titleHi: 'मरीज़ / परिवार', desc: 'Check symptoms & get guidance', arrow: '→' },
  { id: 'asha',  icon: '👩‍⚕️', title: 'ASHA Worker',     titleHi: 'आशा कार्यकर्ता',  desc: 'Assess patients in your community', arrow: '→' },
  { id: 'admin', icon: '👨‍💼', title: 'District Officer', titleHi: 'जिला अधिकारी',   desc: 'Monitor district health trends', arrow: '→' },
]

const DEMO = {
  user:  { phone: '9876543210', password: 'admin123' },
  asha:  { phone: '9876543211', password: 'asha123' },
  admin: { phone: '9876543210', password: 'admin123' },
}

// Floating tile images (using placeholder colors for demo)
const TILE_COLORS = ['#1a3a6b','#0d2a2e','#1a4a5e','#0a2040','#163050','#0e3545','#1b3a5c','#0c2535','#152d4a','#0b2030']

function FloatingTile({ index }) {
  const style = {
    position: 'absolute',
    width: 80 + (index % 3) * 20,
    height: 80 + (index % 3) * 20,
    borderRadius: 16,
    background: TILE_COLORS[index],
    border: '1px solid rgba(34,211,238,0.1)',
    opacity: 0.4,
    animation: `float-tile-${index} ${8 + index}s ease-in-out infinite`,
    left: `${(index * 11) % 90}%`,
    top: `${(index * 13) % 80}%`,
  }
  return <div style={style} />
}

export default function Login() {
  const [selectedRole, setSelectedRole] = useState(null)
  const [form, setForm] = useState({ phone: '', password: '', asha_id: '', district_code: '' })
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const { login } = useAuth()
  const addToast = useToast()

  const validate = () => {
    if (!/^\d{10}$/.test(form.phone)) return 'Phone must be exactly 10 digits'
    if (form.password.length < 6) return 'Password must be at least 6 characters'
    return ''
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const err = validate()
    if (err) { setError(err); return }
    setLoading(true); setError('')
    try {
      const res = await loginUser({ phone: form.phone, password: form.password })
      const data = res.data
      const userData = {
        id: data.user_id,
        name: data.name,
        role: data.role,
        phone: form.phone,
        language: data.language || 'hi',
        village: data.village,
        block: data.block,
        district: data.district,
        asha_id: data.asha_id,
      }
      login(userData, data.access_token)
      addToast('Login successful!', 'success')
      if (data.role === 'asha') navigate('/asha/dashboard')
      else if (data.role === 'admin') navigate('/admin/dashboard')
      else navigate('/user/language')
    } catch (err) {
      const msg = err.response?.data?.detail || 'Invalid credentials. Please try again.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  const handleGuest = () => {
    login({ id: 'guest', name: 'Guest', role: 'user', guest: true, language: 'en' }, 'guest-token')
    navigate('/user/language')
  }

  const roleTitle = ROLES.find(r => r.id === selectedRole)?.title || ''

  return (
    <div style={{
      minHeight: '100vh', position: 'relative', overflow: 'hidden',
      background: 'radial-gradient(ellipse at 50% 0%, #0d2a2e 0%, #080e12 55%, #06090b 100%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end',
      paddingBottom: 40,
    }}>
      {/* Floating tiles */}
      {TILE_COLORS.map((_, i) => <FloatingTile key={i} index={i} />)}
      <style>{TILE_COLORS.map((_, i) => `
        @keyframes float-tile-${i} {
          0%,100% { transform: translate(0,0) rotate(${i*5}deg); }
          50% { transform: translate(${i%2===0?20:-20}px,${-15-i*2}px) rotate(${i*5+10}deg); }
        }
      `).join('')}</style>

      {/* Gradient overlay */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '60%', background: 'linear-gradient(to top, rgba(6,9,11,0.95) 0%, transparent 100%)', pointerEvents: 'none' }} />

      {/* Content */}
      <div style={{ position: 'relative', zIndex: 10, width: '100%', maxWidth: 420, padding: '0 20px' }}>
        {/* Logo badge */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            border: '1px solid rgba(34,211,238,0.3)', borderRadius: 9999,
            padding: '6px 16px', background: 'rgba(34,211,238,0.05)',
            fontSize: 12, fontFamily: 'DM Mono', color: 'rgba(34,211,238,0.8)',
            letterSpacing: '0.08em', marginBottom: 20,
          }}>
            🏥 MARGDARSHAK — मार्गदर्शक
          </div>
          <h1 style={{ fontSize: 'clamp(2rem,8vw,3.5rem)', fontWeight: 800, fontFamily: 'Poppins', color: '#fff', lineHeight: 1.1, marginBottom: 8 }}>
            Your Health{' '}
            <span style={{ background: 'linear-gradient(135deg,#22d3ee,#67e8f9)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Guide</span>
          </h1>
          <div style={{ fontSize: 13, fontFamily: 'DM Mono', color: selectedRole ? 'rgba(34,211,238,0.7)' : 'rgba(255,255,255,0.38)', transition: 'color 0.3s' }}>
            {selectedRole ? `Sign in as ${roleTitle}` : 'Select your role to continue'}
          </div>
        </div>

        {/* Card */}
        <div style={{
          background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(16px)',
          border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: 24,
        }}>
          {!selectedRole ? (
            <>
              <div style={{ fontSize: 11, fontFamily: 'DM Mono', color: 'rgba(255,255,255,0.25)', textAlign: 'center', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 20 }}>
                Who are you? / आप कौन हैं?
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {ROLES.map((role, i) => (
                  <button key={role.id} onClick={() => setSelectedRole(role.id)} style={{
                    display: 'flex', alignItems: 'center', gap: 14,
                    background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)',
                    borderRadius: 14, padding: '16px 18px', cursor: 'pointer', textAlign: 'left',
                    transition: 'all 0.2s ease', width: '100%',
                    animation: `pageEnter 0.3s ${i * 0.1}s both`,
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(34,211,238,0.06)'; e.currentTarget.style.borderColor = 'rgba(34,211,238,0.3)' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)' }}
                  >
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(34,211,238,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>
                      {role.icon}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: '#fff', marginBottom: 2 }}>{role.title}</div>
                      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)' }}>{role.titleHi}</div>
                      <div style={{ fontSize: 12, fontFamily: 'DM Mono', color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>{role.desc}</div>
                    </div>
                    <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 15 }}>→</span>
                  </button>
                ))}
              </div>
              <div style={{ textAlign: 'center', marginTop: 20, fontSize: 13, fontFamily: 'DM Mono' }}>
                <button onClick={handleGuest} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(34,211,238,0.7)', fontFamily: 'DM Mono', fontSize: 13, fontWeight: 500 }}>
                  Continue without login →
                </button>

                <div style={{ display: 'flex', alignItems: 'center', margin: '24px 0', opacity: 0.3 }}>
                  <div style={{ flex: 1, height: 1, background: '#fff' }} />
                  <span style={{ margin: '0 12px', fontSize: 12, letterSpacing: '0.1em' }}>OR</span>
                  <div style={{ flex: 1, height: 1, background: '#fff' }} />
                </div>

                <a href="https://wa.me/14155238886?text=Hi" target="_blank" rel="noreferrer" style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                  textDecoration: 'none', background: 'rgba(37, 211, 102, 0.05)',
                  border: '1px solid rgba(37, 211, 102, 0.2)', borderRadius: 14, padding: '16px 20px',
                  transition: 'all 0.2s ease', cursor: 'pointer'
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(37, 211, 102, 0.15)'; e.currentTarget.style.borderColor = 'rgba(37, 211, 102, 0.4)' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(37, 211, 102, 0.05)'; e.currentTarget.style.borderColor = 'rgba(37, 211, 102, 0.2)' }}
                >
                  <div style={{ color: '#25D366', fontSize: 14, fontWeight: 600, fontFamily: 'Inter', display: 'flex', alignItems: 'center', gap: 8 }}>
                    📲 Use on WhatsApp instead
                  </div>
                  <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11 }}>
                    No login • No app • Just message
                  </div>
                </a>
              </div>
            </>
          ) : (
            <form onSubmit={handleSubmit}>
              <button type="button" onClick={() => { setSelectedRole(null); setError('') }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.3)', fontFamily: 'DM Mono', fontSize: 12, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 4 }}>
                ← BACK
              </button>
              <div style={{ textAlign: 'center', marginBottom: 20 }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, border: '1px solid rgba(34,211,238,0.3)', borderRadius: 9999, padding: '6px 14px', background: 'rgba(34,211,238,0.05)', fontSize: 13, color: 'rgba(34,211,238,0.8)' }}>
                  {ROLES.find(r => r.id === selectedRole)?.icon} {roleTitle.toUpperCase()}
                </div>
              </div>
              {error && (
                <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 10, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: 'rgba(252,165,165,0.9)' }}>
                  ⚠ {error}
                </div>
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {selectedRole === 'asha' && (
                  <div>
                    <label style={{ fontSize: 11, fontFamily: 'DM Mono', color: 'rgba(255,255,255,0.4)', letterSpacing: '0.08em', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>ASHA ID</label>
                    <input value={form.asha_id} onChange={e => setForm(f => ({ ...f, asha_id: e.target.value }))} placeholder="e.g. ASHA-BED-001" style={inputStyle} />
                  </div>
                )}
                {selectedRole === 'admin' && (
                  <div>
                    <label style={{ fontSize: 11, fontFamily: 'DM Mono', color: 'rgba(255,255,255,0.4)', letterSpacing: '0.08em', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>DISTRICT CODE</label>
                    <input value={form.district_code} onChange={e => setForm(f => ({ ...f, district_code: e.target.value }))} placeholder="e.g. MH-BED-01" style={inputStyle} />
                  </div>
                )}
                <div>
                  <label style={{ fontSize: 11, fontFamily: 'DM Mono', color: 'rgba(255,255,255,0.4)', letterSpacing: '0.08em', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>PHONE NUMBER</label>
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)', fontSize: 14, fontFamily: 'DM Mono' }}>+91</span>
                    <input type="tel" maxLength={10} value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value.replace(/\D/g,'') }))} placeholder="XXXXXXXXXX" style={{ ...inputStyle, paddingLeft: 48 }} />
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: 11, fontFamily: 'DM Mono', color: 'rgba(255,255,255,0.4)', letterSpacing: '0.08em', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>PASSWORD</label>
                  <div style={{ position: 'relative' }}>
                    <input type={showPass ? 'text' : 'password'} value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder="••••••" style={{ ...inputStyle, paddingRight: 60 }} />
                    <button type="button" onClick={() => setShowPass(s => !s)} style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.3)', fontFamily: 'DM Mono', fontSize: 11 }}>
                      {showPass ? 'HIDE' : 'SHOW'}
                    </button>
                  </div>
                </div>
              </div>
              <button type="submit" disabled={loading} style={{
                width: '100%', marginTop: 20, padding: '14px', borderRadius: 10, border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
                background: loading ? 'rgba(34,211,238,0.2)' : 'linear-gradient(135deg,rgba(34,211,238,0.2),rgba(34,211,238,0.1))',
                border: '1px solid rgba(34,211,238,0.3)', color: loading ? 'rgba(34,211,238,0.5)' : 'rgba(34,211,238,0.9)',
                fontSize: 14, fontWeight: 600, fontFamily: 'Inter', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}>
                {loading ? (
                  <><div style={{ width: 16, height: 16, border: '2px solid rgba(34,211,238,0.3)', borderTopColor: 'rgba(34,211,238,0.8)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} /> Verifying...</>
                ) : `Sign In as ${roleTitle}`}
              </button>
              {selectedRole === 'user' && (
                <button type="button" onClick={handleGuest} style={{ width: '100%', marginTop: 12, background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(34,211,238,0.5)', fontSize: 13, fontFamily: 'DM Mono' }}>
                  Continue without login →
                </button>
              )}
              <div style={{ marginTop: 16, background: 'rgba(0,0,0,0.3)', borderRadius: 10, padding: '10px 14px' }}>
                <div style={{ fontSize: 10, fontFamily: 'DM Mono', color: 'rgba(255,255,255,0.2)', marginBottom: 4 }}>DEMO CREDENTIALS</div>
                {Object.entries(DEMO[selectedRole]).map(([k, v]) => (
                  <div key={k} style={{ fontSize: 10, fontFamily: 'DM Mono', color: 'rgba(255,255,255,0.2)' }}>{k}: {v}</div>
                ))}
              </div>
            </form>
          )}
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

const inputStyle = {
  width: '100%', height: 48, background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10,
  padding: '12px 16px', fontSize: 14, color: '#fff', outline: 'none',
  fontFamily: 'DM Mono', transition: 'border-color 0.2s',
}
