import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAssessment } from '../../context/AssessmentContext'
import { useAuth } from '../../context/AuthContext'
import VoiceInput from '../../components/VoiceInput'
import TriageResultCard from '../../components/TriageResultCard'
import FacilityCard from '../../components/FacilityCard'
import { useToast } from '../../components/Toast'
import { chatWithGemini, extractSymptomData } from '../../utils/gemini'
import { runAssessment } from '../../utils/api'

const LANGS = [
  { code: 'hi', label: 'हिंदी' }, { code: 'mr', label: 'मराठी' },
  { code: 'gu', label: 'ગુ' }, { code: 'ta', label: 'த' }, { code: 'en', label: 'EN' },
]
const LANG_NAMES = { hi: 'हिंदी', gu: 'ગુજરાતી', mr: 'मराठी', ta: 'தமிழ்', en: 'English' }
const LANG_CODES = { hi: 'hi-IN', gu: 'gu-IN', mr: 'mr-IN', ta: 'ta-IN', en: 'en-IN' }

function buildSystemPrompt(lang) {
  return `You are a warm, gentle health assistant helping rural patients in India.
LANGUAGE: Respond in ${LANG_NAMES[lang] || 'Hindi'}. Detect user language and match it.
Ask ONE short question at a time. Max 5 questions. 1-2 sentences per message.
Find out: main symptom, duration, severity, other symptoms, danger signs.
Never diagnose. Never recommend medicine. Be warm and reassuring.
End with: [ASSESSMENT_READY] at the very end of your final message.`
}

function AiBubble({ text }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 10, animation: 'bubbleIn 0.2s ease both' }}>
      <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'var(--light-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, flexShrink: 0 }}>🏥</div>
      <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: '4px 14px 14px 14px', padding: '10px 14px', maxWidth: '80%', fontSize: 14, color: 'var(--navy)', lineHeight: 1.5 }}>{text}</div>
    </div>
  )
}

function UserBubble({ text }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 10, animation: 'bubbleIn 0.2s ease both' }}>
      <div style={{ background: 'linear-gradient(135deg,var(--teal),var(--blue))', borderRadius: '14px 4px 14px 14px', padding: '10px 14px', maxWidth: '80%', fontSize: 14, color: '#fff', lineHeight: 1.5 }}>{text}</div>
    </div>
  )
}

function TypingDots() {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 10 }}>
      <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'var(--light-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, flexShrink: 0 }}>🏥</div>
      <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: '4px 14px 14px 14px', padding: '12px 16px', display: 'flex', gap: 4 }}>
        {[0,1,2].map(i => <div key={i} style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--border)', animation: `typingBounce 0.6s ${i*0.15}s infinite` }} />)}
      </div>
    </div>
  )
}

export default function AssessPatient() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { assessment, update } = useAssessment()
  const addToast = useToast()

  const [step, setStep] = useState(1)
  const [patientLang, setPatientLang] = useState('hi')
  const [form, setForm] = useState({ name: '', age: '', gender: '', village: user?.village || '', phone: '' })

  // Chat state
  const [messages, setMessages] = useState([])
  const [isThinking, setIsThinking] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [inputText, setInputText] = useState('')
  const [exchangeCount, setExchangeCount] = useState(0)
  const [isComplete, setIsComplete] = useState(false)
  const [isExtracting, setIsExtracting] = useState(false)
  const [result, setResult] = useState(null)
  const [skipMode, setSkipMode] = useState(false)
  const [skipText, setSkipText] = useState('')

  const chatEndRef = useRef(null)
  const convHistoryRef = useRef([])
  const exchangeRef = useRef(0)
  const isCompleteRef = useRef(false)
  const recognitionRef = useRef(null)
  const [voiceAvailable] = useState(() => !!(window.SpeechRecognition || window.webkitSpeechRecognition))

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isThinking])

  // Init chat when entering step 2
  useEffect(() => {
    if (step !== 2 || skipMode) return
    setIsThinking(true)
    const initMsg = `Start the conversation. Greet the patient warmly and ask what problem they are facing today. Speak in ${LANG_NAMES[patientLang] || 'Hindi'}.`
    const initHistory = [{ role: 'user', parts: [{ text: initMsg }] }]
    convHistoryRef.current = initHistory
    chatWithGemini(initHistory, buildSystemPrompt(patientLang))
      .then(text => {
        convHistoryRef.current = [...initHistory, { role: 'model', parts: [{ text }] }]
        setMessages([{ id: '0', role: 'ai', text }])
        setIsThinking(false)
      })
      .catch(() => {
        setMessages([{ id: '0', role: 'ai', text: 'नमस्ते! मरीज़ को क्या तकलीफ है?' }])
        setIsThinking(false)
      })
  }, [step, skipMode])

  const handleExtractionAndTriage = useCallback(async () => {
    setIsExtracting(true)
    try {
      const extracted = await extractSymptomData(convHistoryRef.current)
      let res
      try {
        const apiRes = await runAssessment({
          symptoms: extracted.symptoms,
          answers: { duration: extracted.duration_days, severity: extracted.severity, has_danger_signs: extracted.has_danger_signs },
          age: form.age, gender: form.gender, village: form.village,
          assessed_by: user?.id, patient_name: form.name,
          conversation_summary: extracted.conversation_summary,
        })
        res = apiRes.data
      } catch {
        res = mockTriage(extracted)
      }
      update({ triageResult: res })
      setResult(res)
      setStep(3)
    } finally {
      setIsExtracting(false)
    }
  }, [form, user, update])

  const sendMessage = useCallback(async (text) => {
    if (!text.trim() || isThinking || isCompleteRef.current) return
    const userMsg = { id: Date.now().toString(), role: 'user', text: text.trim() }
    setMessages(prev => [...prev, userMsg])
    setInputText('')
    setIsThinking(true)
    const newHistory = [...convHistoryRef.current, { role: 'user', parts: [{ text: text.trim() }] }]
    convHistoryRef.current = newHistory
    const newCount = exchangeRef.current + 1
    exchangeRef.current = newCount
    setExchangeCount(newCount)
    if (newCount >= 5 && !isCompleteRef.current) {
      isCompleteRef.current = true
      setIsComplete(true)
      setIsThinking(false)
      setTimeout(() => handleExtractionAndTriage(), 1500)
      return
    }
    try {
      const aiText = await chatWithGemini(newHistory, buildSystemPrompt(patientLang))
      const hasEnd = aiText.includes('[ASSESSMENT_READY]')
      const cleanText = aiText.replace('[ASSESSMENT_READY]', '').trim()
      setMessages(prev => [...prev, { id: (Date.now()+1).toString(), role: 'ai', text: cleanText }])
      convHistoryRef.current = [...newHistory, { role: 'model', parts: [{ text: aiText }] }]
      setIsThinking(false)
      if (hasEnd) {
        isCompleteRef.current = true
        setIsComplete(true)
        setTimeout(() => handleExtractionAndTriage(), 1500)
      }
    } catch {
      setIsThinking(false)
    }
  }, [isThinking, patientLang, handleExtractionAndTriage])

  const startListening = () => {
    if (!voiceAvailable || isListening) return
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    const rec = new SR()
    rec.lang = LANG_CODES[patientLang] || 'hi-IN'
    rec.continuous = false
    rec.interimResults = true
    rec.onstart = () => setIsListening(true)
    rec.onresult = (e) => {
      const t = Array.from(e.results).map(r => r[0].transcript).join('')
      setInputText(t)
      if (e.results[e.results.length - 1].isFinal) { setIsListening(false); sendMessage(t) }
    }
    rec.onerror = () => setIsListening(false)
    rec.onend = () => setIsListening(false)
    recognitionRef.current = rec
    rec.start()
  }

  const handleSkipSubmit = async () => {
    if (!skipText.trim()) return
    setIsExtracting(true)
    try {
      let res
      try {
        const apiRes = await runAssessment({
          symptoms: [], age: form.age, gender: form.gender, village: form.village,
          assessed_by: user?.id, patient_name: form.name,
          conversation_summary: skipText,
        })
        res = apiRes.data
      } catch {
        res = mockTriage({ symptoms: [], severity: 'moderate', has_danger_signs: false })
      }
      update({ triageResult: res })
      setResult(res)
      setStep(3)
    } finally {
      setIsExtracting(false)
    }
  }

  const handleSave = () => {
    addToast('Patient saved to your list ✓', 'success')
    navigate('/asha/dashboard')
  }

  // Step 3 — result
  if (step === 3 && result) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
        <div style={{ background: '#fff', borderBottom: '1px solid var(--border)', padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 12, position: 'sticky', top: 0, zIndex: 50 }}>
          <button onClick={() => navigate('/asha/dashboard')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: 'var(--gray)' }}>←</button>
          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--navy)' }}>Assessment Result</div>
        </div>
        <div className="mobile-container page-enter" style={{ paddingTop: 24, paddingBottom: 40 }}>
          <div style={{ background: 'var(--light-blue)', borderRadius: 12, padding: '10px 16px', marginBottom: 16, fontSize: 14, fontWeight: 600, color: 'var(--navy)' }}>
            {form.name}, {form.age}yrs, {form.gender === 'M' ? 'Male' : form.gender === 'F' ? 'Female' : 'Other'}
          </div>
          <div style={{ marginBottom: 16 }}>
            <TriageResultCard level={result.triage_level || result.level} reason={result.triage_reason || result.reason} action={result.recommended_action || result.action} selfCare={result.self_care_instructions || result.selfCare} warningSigns={result.warning_signs || result.warningSigns} />
          </div>
          <div style={{ marginBottom: 16 }}>
            <FacilityCard facility={result.facility} triageLevel={result.triage_level || result.level} showMap={false} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {(result.triage_level || result.level) === 'RED' && <a href="tel:108" className="btn-primary full" style={{ textDecoration: 'none', textAlign: 'center' }}>📞 Call 108 Now</a>}
            <button className="btn-secondary full" onClick={handleSave}>💾 Save to My List</button>
            <a href={`https://wa.me/?text=${encodeURIComponent(`Patient: ${form.name}\nLevel: ${result.triage_level || result.level}\n${result.triage_reason || result.reason}`)}`} target="_blank" rel="noreferrer" className="btn-ghost full" style={{ textDecoration: 'none', textAlign: 'center' }}>
              📱 Share on WhatsApp
            </a>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ background: '#fff', borderBottom: '1px solid var(--border)', padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 12, position: 'sticky', top: 0, zIndex: 50 }}>
        <button onClick={() => step > 1 ? setStep(s => s - 1) : navigate(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: 'var(--gray)' }}>←</button>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--navy)' }}>Assess Patient</div>
          <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
            {[1, 2].map(s => (
              <div key={s} style={{ height: 3, flex: 1, borderRadius: 9999, background: s <= step ? 'var(--blue)' : 'var(--border)', transition: 'background 0.3s' }} />
            ))}
          </div>
        </div>
      </div>

      {/* Step 1 — Patient details */}
      {step === 1 && (
        <div className="mobile-container page-enter" style={{ paddingTop: 24, paddingBottom: 40 }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--navy)', marginBottom: 4 }}>Patient Information</h2>
          <p style={{ fontSize: 13, color: 'var(--gray)', marginBottom: 24 }}>मरीज़ की जानकारी</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div><label className="input-label">Patient Name / मरीज़ का नाम</label>
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Full name" className="input-field" /></div>
            <div><label className="input-label">Age / उम्र</label>
              <input type="number" value={form.age} onChange={e => setForm(f => ({ ...f, age: e.target.value }))} placeholder="In years" className="input-field" /></div>
            <div><label className="input-label">Gender / लिंग</label>
              <div style={{ display: 'flex', gap: 10 }}>
                {[['M','Male'],['F','Female'],['O','Other']].map(([id,label]) => (
                  <button key={id} onClick={() => setForm(f => ({ ...f, gender: id }))} style={{ flex:1, padding:'12px', borderRadius:9999, border:'1.5px solid', borderColor:form.gender===id?'var(--blue)':'var(--border)', background:form.gender===id?'var(--blue)':'#fff', color:form.gender===id?'#fff':'var(--navy)', fontSize:13, fontWeight:500, cursor:'pointer', transition:'all 0.2s' }}>{label}</button>
                ))}
              </div>
            </div>
            <div><label className="input-label">Village / गाँव</label>
              <input value={form.village} onChange={e => setForm(f => ({ ...f, village: e.target.value }))} placeholder="Village name" className="input-field" /></div>
            <div><label className="input-label">Patient's Language</label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {LANGS.map(l => (
                  <button key={l.code} onClick={() => setPatientLang(l.code)} style={{ padding:'8px 14px', borderRadius:9999, fontSize:13, fontWeight:500, cursor:'pointer', background:patientLang===l.code?'var(--blue)':'var(--light-blue)', color:patientLang===l.code?'#fff':'var(--blue)', border:'none', transition:'all 0.2s' }}>{l.label}</button>
                ))}
              </div>
            </div>
          </div>
          <button className="btn-primary full" style={{ marginTop: 24 }} onClick={() => setStep(2)} disabled={!form.name || !form.age || !form.gender}>
            Start Assessment →
          </button>
        </div>
      )}

      {/* Step 2 — Chat */}
      {step === 2 && !skipMode && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <div className="mobile-container" style={{ paddingTop: 12, paddingBottom: 0, flex: 0 }}>
            <div style={{ fontSize: 13, color: 'var(--gray)', marginBottom: 8 }}>Assessing: {form.name}, {form.age}yrs</div>
          </div>
          <div className="mobile-container" style={{ flex: 1, display: 'flex', flexDirection: 'column', paddingTop: 0, paddingBottom: 0, minHeight: 0 }}>
            <div style={{ flex: 1, background: 'var(--light-blue)', borderRadius: 16, padding: 12, overflowY: 'auto', marginBottom: 8, minHeight: 200 }}>
              {messages.map(m => m.role === 'ai' ? <AiBubble key={m.id} text={m.text} /> : <UserBubble key={m.id} text={m.text} />)}
              {isThinking && <TypingDots />}
              <div ref={chatEndRef} />
            </div>
            <button onClick={() => setSkipMode(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280', fontSize: 12, textDecoration: 'underline', textAlign: 'center', marginBottom: 8 }}>
              Skip conversation — enter summary manually
            </button>
          </div>
          {!isComplete && (
            <div style={{ background: '#fff', borderTop: '1px solid var(--border)', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10, maxWidth: 480, margin: '0 auto', width: '100%' }}>
              {voiceAvailable && (
                <button onClick={isListening ? () => { recognitionRef.current?.stop(); setIsListening(false) } : startListening} disabled={isThinking} style={{ width:44, height:44, borderRadius:'50%', border:'none', cursor:isThinking?'not-allowed':'pointer', background:isListening?'#FEE2E2':'var(--light-blue)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill={isListening?'#EF4444':'var(--teal)'}><path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm-1-9c0-.55.45-1 1-1s1 .45 1 1v6c0 .55-.45 1-1 1s-1-.45-1-1V5zm6 6c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/></svg>
                </button>
              )}
              <input value={inputText} onChange={e => setInputText(e.target.value)} onKeyDown={e => e.key==='Enter' && sendMessage(inputText)} placeholder="Type or speak..." disabled={isThinking || isListening} style={{ flex:1, height:44, border:'1.5px solid var(--border)', borderRadius:22, padding:'0 16px', fontSize:15, color:'var(--navy)', background:'var(--bg)', outline:'none' }} />
              <button onClick={() => sendMessage(inputText)} disabled={!inputText.trim() || isThinking} style={{ width:44, height:44, borderRadius:'50%', border:'none', cursor:!inputText.trim()||isThinking?'not-allowed':'pointer', background:!inputText.trim()||isThinking?'var(--border)':'linear-gradient(135deg,var(--teal),var(--blue))', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill={!inputText.trim()||isThinking?'var(--gray)':'white'}><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Skip mode */}
      {step === 2 && skipMode && (
        <div className="mobile-container page-enter" style={{ paddingTop: 24, paddingBottom: 40 }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--navy)', marginBottom: 8 }}>Enter Symptom Summary</h2>
          <p style={{ fontSize: 13, color: 'var(--gray)', marginBottom: 16 }}>Briefly describe the patient's symptoms</p>
          <textarea value={skipText} onChange={e => setSkipText(e.target.value)} placeholder="Briefly describe the patient's symptoms..." rows={5} className="input-field" style={{ height: 'auto', resize: 'none', marginBottom: 16 }} />
          <button className="btn-primary full" onClick={handleSkipSubmit} disabled={!skipText.trim() || isExtracting}>
            {isExtracting ? '⏳ Analyzing...' : 'Submit →'}
          </button>
          <button className="btn-ghost full" style={{ marginTop: 10 }} onClick={() => setSkipMode(false)}>← Back to Conversation</button>
        </div>
      )}

      {isExtracting && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(4px)', zIndex: 50, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20 }}>
          <div style={{ width: 48, height: 48, border: '3px solid var(--light-blue)', borderTopColor: 'var(--teal)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--navy)' }}>Analyzing symptoms...</div>
        </div>
      )}

      <style>{`
        @keyframes bubbleIn { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:translateY(0); } }
        @keyframes typingBounce { 0%,60%,100% { transform:translateY(0); } 30% { transform:translateY(-5px); } }
        @keyframes spin { to { transform:rotate(360deg); } }
      `}</style>
    </div>
  )
}

function mockTriage(extracted) {
  const hasDanger = extracted.has_danger_signs
  const severity = extracted.severity || 'mild'
  const syms = (extracted.symptoms || []).map(s => s.toLowerCase())
  const summary = (extracted.conversation_summary || '').toLowerCase()
  const combined = syms.join(' ') + ' ' + summary
  const FACILITY = { name: 'PHC Gevrai', type: 'PHC', distance_km: 3.2, lat: 18.9833, lng: 75.7, phone: '02442-123456', hours: '8am-8pm' }

  const redWords = [
    'chest pain', 'heart attack', 'unconscious', 'unresponsive', 'seizure',
    'convulsion', 'fits', 'not breathing', 'cant breathe', "can't breathe",
    'difficulty breathing', 'breathless', 'vomiting blood', 'coughing blood',
    'blood in stool', 'heavy bleeding', 'stroke', 'paralysis', 'choking',
    'blue lips', 'cyanosis', 'snake bite', 'poisoning', 'overdose', 'collapsed',
    'dying', 'death', 'severe burn', 'electric shock', 'anaphylaxis',
  ]
  if (hasDanger || severity === 'severe' || redWords.some(w => combined.includes(w))) {
    return { triage_level: 'RED', level: 'RED', triage_reason: 'Emergency symptoms — immediate attention required', recommended_action: 'Call 108 immediately or go to nearest emergency hospital.', self_care_instructions: [], warning_signs: [], assessment_id: 'mock-' + Date.now(), facility: FACILITY }
  }
  const dur = extracted.duration_days || 0
  if (severity === 'moderate' || dur >= 3) {
    return { triage_level: 'YELLOW', level: 'YELLOW', triage_reason: 'Symptoms require medical evaluation', recommended_action: 'Visit PHC within 24 hours.', self_care_instructions: ['Rest and drink fluids', 'Take paracetamol for fever or pain'], warning_signs: ['Fever above 104°F', 'Symptoms worsening'], assessment_id: 'mock-' + Date.now(), facility: FACILITY }
  }
  const yellowWords = ['fever', 'vomiting', 'diarrhea', 'jaundice', 'rash', 'urinary', 'dengue', 'malaria', 'blood in urine', 'fracture']
  if (yellowWords.some(w => combined.includes(w))) {
    return { triage_level: 'YELLOW', level: 'YELLOW', triage_reason: 'Symptoms require medical evaluation', recommended_action: 'Visit PHC within 24 hours.', self_care_instructions: ['Rest and drink fluids'], warning_signs: ['Symptoms worsening'], assessment_id: 'mock-' + Date.now(), facility: FACILITY }
  }
  return { triage_level: 'GREEN', level: 'GREEN', triage_reason: 'Mild symptoms manageable at home', recommended_action: 'Rest and follow self-care. Visit PHC if no improvement in 2-3 days.', self_care_instructions: ['Rest', 'Drink warm fluids'], warning_signs: ['Fever develops', 'Symptoms worsen after 2 days'], assessment_id: 'mock-' + Date.now(), facility: FACILITY }
}
