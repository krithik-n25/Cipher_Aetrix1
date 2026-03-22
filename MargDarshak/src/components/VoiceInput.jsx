import { useState, useRef, useEffect } from 'react'

const LANG_MAP = { hi: 'hi-IN', mr: 'mr-IN', gu: 'gu-IN', ta: 'ta-IN', en: 'en-IN' }

export default function VoiceInput({ lang = 'en', onResult, disabled }) {
  const [state, setState] = useState('idle') // idle | recording | processing | error
  const [seconds, setSeconds] = useState(0)
  const recognitionRef = useRef(null)
  const timerRef = useRef(null)

  useEffect(() => () => {
    recognitionRef.current?.stop()
    clearInterval(timerRef.current)
  }, [])

  const start = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      setState('error'); return
    }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    const rec = new SR()
    rec.lang = LANG_MAP[lang] || 'en-IN'
    rec.continuous = false
    rec.interimResults = false
    rec.onstart = () => {
      setState('recording'); setSeconds(0)
      timerRef.current = setInterval(() => setSeconds(s => s + 1), 1000)
    }
    rec.onresult = (e) => {
      clearInterval(timerRef.current)
      setState('processing')
      const text = e.results[0][0].transcript
      setTimeout(() => { onResult?.(text); setState('idle') }, 500)
    }
    rec.onerror = () => { clearInterval(timerRef.current); setState('error') }
    rec.onend = () => { clearInterval(timerRef.current); if (state === 'recording') setState('idle') }
    recognitionRef.current = rec
    rec.start()
  }

  const stop = () => { recognitionRef.current?.stop(); clearInterval(timerRef.current) }

  const isRecording = state === 'recording'
  const isProcessing = state === 'processing'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {isRecording && (
          <>
            <div style={{
              position: 'absolute', width: 80, height: 80, borderRadius: '50%',
              background: 'rgba(239,68,68,0.3)',
              animation: 'pulse-ring 1s ease-out infinite',
            }} />
            <div style={{
              position: 'absolute', width: 80, height: 80, borderRadius: '50%',
              background: 'rgba(239,68,68,0.2)',
              animation: 'pulse-ring 1s ease-out 0.3s infinite',
            }} />
          </>
        )}
        <button
          onClick={isRecording ? stop : start}
          disabled={disabled || isProcessing}
          style={{
            width: 80, height: 80, borderRadius: '50%', border: 'none', cursor: 'pointer',
            background: isRecording
              ? 'linear-gradient(135deg, #EF4444, #FF6B6B)'
              : state === 'error'
              ? '#FEF2F2'
              : 'linear-gradient(135deg, var(--teal), var(--blue))',
            boxShadow: isRecording
              ? '0 8px 32px rgba(239,68,68,0.4)'
              : '0 8px 32px rgba(27,107,123,0.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.3s ease',
            position: 'relative', zIndex: 1,
          }}
        >
          {isProcessing ? (
            <div style={{ width: 24, height: 24, border: '3px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          ) : isRecording ? (
            <svg width="28" height="28" viewBox="0 0 24 24" fill="white">
              <rect x="6" y="6" width="12" height="12" rx="2" />
            </svg>
          ) : state === 'error' ? (
            <svg width="28" height="28" viewBox="0 0 24 24" fill="#EF4444">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
            </svg>
          ) : (
            <svg width="32" height="32" viewBox="0 0 24 24" fill="white">
              <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm-1-9c0-.55.45-1 1-1s1 .45 1 1v6c0 .55-.45 1-1 1s-1-.45-1-1V5zm6 6c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
            </svg>
          )}
        </button>
      </div>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 14, fontWeight: 500, color: isRecording ? '#EF4444' : 'var(--navy)' }}>
          {isRecording ? `Listening... Tap to stop` : isProcessing ? 'Understanding your words...' : state === 'error' ? 'Voice not supported' : 'Tap and speak'}
        </div>
        {isRecording && (
          <div style={{ fontSize: 13, color: 'var(--gray)', fontFamily: 'DM Mono', marginTop: 4 }}>
            0:{String(seconds).padStart(2, '0')}
          </div>
        )}
        <div style={{ fontSize: 12, color: 'var(--gray)', marginTop: 2 }}>बोलकर बताएं</div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
