import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAssessment } from '../../context/AssessmentContext'
import { useLanguage } from '../../context/LanguageContext'
import { useAuth } from '../../context/AuthContext'
import { t } from '../../utils/translation'
import ProgressBar from '../../components/ProgressBar'
import { chatWithGemini, extractSymptomData, scanForDanger } from '../../utils/gemini'
import { runAssessment } from '../../utils/api'

const LANG_NAMES = { hi: 'हिंदी', gu: 'ગુજરાતી', mr: 'मराठी', ta: 'தமிழ்', en: 'English' }
const LANG_CODES = { hi: 'hi-IN', gu: 'gu-IN', mr: 'mr-IN', ta: 'ta-IN', en: 'en-IN' }

function buildSystemPrompt(selectedLanguage) {
  const langName = LANG_NAMES[selectedLanguage] || 'Hindi'
  return `You are a warm, gentle health assistant helping rural patients in India understand their symptoms.
You are speaking with a patient or their family member through a mobile health application called Margdarshak.

LANGUAGE RULE — THIS IS THE MOST IMPORTANT RULE:
Detect the language the user is speaking or writing in.
After the first user message, respond ONLY in that language. Never mix languages.
- Hindi → ALL responses in Hindi
- Gujarati → ALL responses in Gujarati
- Marathi → ALL responses in Marathi
- Tamil → ALL responses in Tamil
- English → ALL responses in English
Default language for your first message: ${langName}
Use simple everyday words. No medical terminology. Speak like a caring village elder.

YOUR GOAL:
Have a short, natural conversation to understand what health problem the patient is experiencing.
Ask ONE question at a time. Maximum 5 questions total. Each message must be 1-2 sentences only.

WHAT TO FIND OUT:
- What is their main problem or symptom today?
- How many days have they had this problem?
- Is it getting better, same, or worse?
- How bad is it — mild, moderate, or very severe?
- Any other symptoms alongside?
- Is the patient a child, adult, or elderly?
- Any danger signs? (chest pain, can't breathe, unconscious, seizures, blood)

TONE: Warm, calm, reassuring. Never alarming. Never diagnose. Never recommend medicine.

WHEN TO END: After 4-5 exchanges, end with your final message followed immediately by [ASSESSMENT_READY]
The tag must be at the very end. The patient will not see it.

ENDING EXAMPLES:
Hindi: "शुक्रिया, आपने सब बताया। मैं अभी देखता हूँ आपको क्या करना चाहिए। [ASSESSMENT_READY]"
Gujarati: "આભાર, મને હવે પૂરતી જાણકારી મળી ગઈ. ચાલો જોઈએ આગળ શું કરવું. [ASSESSMENT_READY]"
Marathi: "धन्यवाद, मला आता पुरेशी माहिती मिळाली. आता मी पाहतो काय करायचे. [ASSESSMENT_READY]"
Tamil: "நன்றி, எனக்கு இப்போது போதுமான தகவல் கிடைத்தது. என்ன செய்ய வேண்டும் என்று பார்க்கிறேன். [ASSESSMENT_READY]"
English: "Thank you for sharing. I now have enough information. Let me check what you should do. [ASSESSMENT_READY]"`
}

function formatTime(date) {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function AiBubble({ text, isSpeaking }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 12, animation: 'bubbleIn 0.2s ease both' }}>
      <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--light-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0 }}>🏥</div>
      <div>
        <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: '4px 16px 16px 16px', padding: '12px 16px', boxShadow: '0 1px 3px rgba(13,43,51,0.06)', maxWidth: '80%', position: 'relative' }}>
          <span style={{ color: 'var(--navy)', fontSize: 15, lineHeight: 1.5 }}>{text}</span>
          {isSpeaking && (
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, position: 'absolute', bottom: 8, right: 10, height: 14 }}>
              {[
                { h: 8,  delay: '0s' },
                { h: 12, delay: '0.2s' },
                { h: 8,  delay: '0.4s' },
              ].map((bar, i) => (
                <div key={i} style={{
                  width: 3, height: bar.h, borderRadius: 2, background: 'var(--teal)',
                  animation: `soundBar 0.6s ${bar.delay} ease-in-out infinite`,
                  transformOrigin: 'bottom',
                }} />
              ))}
            </div>
          )}
        </div>
        <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 4, paddingLeft: 4 }}>{formatTime(new Date())}</div>
      </div>
    </div>
  )
}

function UserBubble({ text }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', marginBottom: 12, animation: 'bubbleIn 0.2s ease both' }}>
      <div style={{ background: 'linear-gradient(135deg,var(--teal),var(--blue))', borderRadius: '16px 4px 16px 16px', padding: '12px 16px', boxShadow: '0 4px 12px rgba(27,107,123,0.25)', maxWidth: '80%' }}>
        <span style={{ color: '#fff', fontSize: 15, lineHeight: 1.5 }}>{text}</span>
      </div>
      <div style={{ fontSize: 11, color: 'rgba(27,107,123,0.6)', marginTop: 4 }}>{formatTime(new Date())}</div>
    </div>
  )
}

function TypingIndicator() {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 12 }}>
      <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--light-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0 }}>🏥</div>
      <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: '4px 16px 16px 16px', padding: '14px 18px', display: 'flex', gap: 4, alignItems: 'center' }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--border)', animation: `typingBounce 0.6s ${i * 0.15}s infinite` }} />
        ))}
      </div>
    </div>
  )
}

export default function SymptomInput() {
  const navigate = useNavigate()
  const { assessment, update } = useAssessment()
  const { selectedLanguage } = useLanguage()
  const lang = selectedLanguage
  const { user } = useAuth()

  const [messages, setMessages] = useState([])
  const [conversationHistory, setConversationHistory] = useState([])
  const [isThinking, setIsThinking] = useState(true)
  const [isListening, setIsListening] = useState(false)
  const [inputText, setInputText] = useState('')
  const [exchangeCount, setExchangeCount] = useState(0)
  const [isComplete, setIsComplete] = useState(false)
  const [isExtracting, setIsExtracting] = useState(false)
  const [detectedLanguage, setDetectedLanguage] = useState(selectedLanguage)
  const [voiceAvailable] = useState(() => !!(window.SpeechRecognition || window.webkitSpeechRecognition))
  const [errorMsg, setErrorMsg] = useState(null)
  const [showLeaveDialog, setShowLeaveDialog] = useState(false)
  // ── TTS state ──
  const [isMuted, setIsMuted] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [speakingMsgId, setSpeakingMsgId] = useState(null)
  const currentAudioRef = useRef(null)

  const chatEndRef = useRef(null)
  const recognitionRef = useRef(null)
  const systemPromptRef = useRef(buildSystemPrompt(selectedLanguage))
  const convHistoryRef = useRef([])
  const exchangeRef = useRef(0)
  const isCompleteRef = useRef(false)

  // Auto-scroll
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isThinking])

  // ── TTS cleanup on unmount ──
  useEffect(() => {
    return () => {
      if (currentAudioRef.current) {
        currentAudioRef.current.pause()
        currentAudioRef.current.src = ''
      }
      if (window.speechSynthesis) window.speechSynthesis.cancel()
    }
  }, [])

  const base64ToBlob = (base64, mimeType) => {
    const byteCharacters = atob(base64)
    const byteNumbers = Array.from(byteCharacters, c => c.charCodeAt(0))
    const byteArray = new Uint8Array(byteNumbers)
    return new Blob([byteArray], { type: mimeType })
  }

  const speakWithSarvam = useCallback(async (text, langCode, msgId) => {
    if (isMuted) return
    const paceMap = { 'hi-IN': 1.0, 'en-IN': 1.1, 'mr-IN': 0.95, 'ta-IN': 0.90, 'gu-IN': 0.95 }
    const langMap  = { hi: 'hi-IN', en: 'en-IN', mr: 'mr-IN', ta: 'ta-IN', gu: 'gu-IN' }
    const fullCode = langMap[langCode] || langCode || 'hi-IN'

    // Stop any currently playing audio
    if (currentAudioRef.current) {
      currentAudioRef.current.pause()
      currentAudioRef.current.src = ''
      currentAudioRef.current = null
    }
    setIsSpeaking(true)
    setSpeakingMsgId(msgId)

    try {
      const response = await fetch('https://api.sarvam.ai/text-to-speech', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-subscription-key': import.meta.env.VITE_SARVAM_API_KEY,
        },
        body: JSON.stringify({
          inputs: [text],
          target_language_code: fullCode,
          speaker: 'meera',
          pitch: 0,
          pace: paceMap[fullCode] || 1.0,
          loudness: 1.5,
          speech_sample_rate: 8000,
          enable_preprocessing: true,
          model: 'bulbul:v1',
        }),
      })
      if (!response.ok) throw new Error('Sarvam failed')
      const data = await response.json()
      const blob = base64ToBlob(data.audios[0], 'audio/wav')
      const url  = URL.createObjectURL(blob)
      const audio = new Audio(url)
      currentAudioRef.current = audio
      audio.onended = () => { setIsSpeaking(false); setSpeakingMsgId(null); currentAudioRef.current = null; URL.revokeObjectURL(url) }
      audio.onerror = () => { setIsSpeaking(false); setSpeakingMsgId(null); currentAudioRef.current = null; URL.revokeObjectURL(url) }
      audio.play()
    } catch {
      // Fallback: Web Speech API
      try {
        if (window.speechSynthesis) {
          window.speechSynthesis.cancel()
          const utt = new SpeechSynthesisUtterance(text)
          utt.lang = fullCode; utt.rate = 0.85; utt.pitch = 1.0; utt.volume = 1.0
          utt.onend  = () => { setIsSpeaking(false); setSpeakingMsgId(null) }
          utt.onerror= () => { setIsSpeaking(false); setSpeakingMsgId(null) }
          window.speechSynthesis.speak(utt)
        } else {
          setIsSpeaking(false); setSpeakingMsgId(null)
        }
      } catch {
        setIsSpeaking(false); setSpeakingMsgId(null)
      }
    }
  }, [isMuted])

  // Init conversation on mount
  useEffect(() => {
    const initMsg = `Start the conversation. Greet the patient warmly and ask them what problem they are facing today. Speak in ${LANG_NAMES[selectedLanguage] || 'Hindi'} language.`
    const initHistory = [{ role: 'user', parts: [{ text: initMsg }] }]
    convHistoryRef.current = initHistory

    chatWithGemini(initHistory, systemPromptRef.current)
      .then(text => {
        convHistoryRef.current = [...initHistory, { role: 'model', parts: [{ text }] }]
        setConversationHistory(convHistoryRef.current)
        const msg = { id: '0', role: 'ai', text, timestamp: new Date() }
        setMessages([msg])
        setIsThinking(false)
        speakWithSarvam(text, selectedLanguage, '0')
      })
      .catch(() => {
        const fallbackText = 'नमस्ते! आज आपको क्या तकलीफ है? / Hello! What problem are you facing today?'
        const msg = { id: '0', role: 'ai', text: fallbackText, timestamp: new Date() }
        setMessages([msg])
        setIsThinking(false)
        speakWithSarvam(fallbackText, selectedLanguage, '0')
      })
  }, [])

  const handleExtractionAndTriage = useCallback(async () => {
    setIsExtracting(true)
    try {
      const extracted = await extractSymptomData(convHistoryRef.current)
      update({
        detectedSymptoms: extracted.symptoms,
        followUpAnswers: {
          duration: extracted.duration_days,
          severity: extracted.severity,
          has_danger_signs: extracted.has_danger_signs,
          patient_age_group: extracted.patient_age_group,
        },
        rawSymptomText: extracted.conversation_summary,
      })

      let result
      try {
        const res = await runAssessment({
          symptoms: extracted.symptoms,
          answers: {
            duration: extracted.duration_days,
            severity: extracted.severity,
            has_danger_signs: extracted.has_danger_signs,
            patient_age_group: extracted.patient_age_group,
          },
          age: assessment.patientAge,
          gender: assessment.patientGender,
          village: assessment.village,
          block: assessment.block,
          district: assessment.district,
          assessed_by: user?.id || null,
          patient_name: assessment.patientName || null,
          conversation_summary: extracted.conversation_summary,
        })
        result = res.data
      } catch {
        result = mockTriage(extracted)
      }

      update({ triageResult: result, assessmentId: result.assessment_id || result.assessmentId })
      if (result.triage_level !== 'RED' && result.level !== 'RED') {
        localStorage.setItem('pendingFollowUp', JSON.stringify({
          assessmentId: result.assessment_id || result.assessmentId,
          followUpDue: Date.now() + 48 * 60 * 60 * 1000,
          triageLevel: result.triage_level || result.level,
        }))
      }
      navigate('/user/result')
    } catch {
      setIsExtracting(false)
      setErrorMsg('Assessment failed. Please try again.')
    }
  }, [assessment, user, navigate, update])

  const sendMessage = useCallback(async (text) => {
    if (!text.trim() || isThinking || isCompleteRef.current) return
    setErrorMsg(null)

    const userMsg = { id: Date.now().toString(), role: 'user', text: text.trim(), timestamp: new Date() }
    setMessages(prev => [...prev, userMsg])
    setInputText('')
    setIsThinking(true)

    const newHistory = [...convHistoryRef.current, { role: 'user', parts: [{ text: text.trim() }] }]
    convHistoryRef.current = newHistory
    setConversationHistory(newHistory)

    const newCount = exchangeRef.current + 1
    exchangeRef.current = newCount
    setExchangeCount(newCount)

    // ── DANGER SCAN: flag it but don't cut conversation short ──────────────
    const fullConvText = newHistory.map(m => m.parts?.[0]?.text || '').join(' ')
    // (danger will be used during extraction, not here)

    // Detect language from first user message
    if (newCount === 1) {
      if (/[\u0900-\u097F]/.test(text)) setDetectedLanguage('hi')
      else if (/[\u0A80-\u0AFF]/.test(text)) setDetectedLanguage('gu')
      else if (/[\u0B80-\u0BFF]/.test(text)) setDetectedLanguage('ta')
      else if (/[a-zA-Z]/.test(text)) setDetectedLanguage('en')
    }

    // Safety cap
    if (newCount >= 5 && !isCompleteRef.current) {
      isCompleteRef.current = true
      setIsComplete(true)
      setIsThinking(false)
      setTimeout(() => handleExtractionAndTriage(), 1500)
      return
    }

    try {
      const aiText = await chatWithGemini(newHistory, systemPromptRef.current)
      const hasEnd = aiText.includes('[ASSESSMENT_READY]')
      const cleanText = aiText.replace('[ASSESSMENT_READY]', '').trim()

      const aiMsg = { id: (Date.now() + 1).toString(), role: 'ai', text: cleanText, timestamp: new Date() }
      setMessages(prev => [...prev, aiMsg])

      const updatedHistory = [...newHistory, { role: 'model', parts: [{ text: aiText }] }]
      convHistoryRef.current = updatedHistory
      setConversationHistory(updatedHistory)
      setIsThinking(false)
      speakWithSarvam(cleanText, detectedLanguage, aiMsg.id)

      if (hasEnd) {
        isCompleteRef.current = true
        setIsComplete(true)
        setTimeout(() => handleExtractionAndTriage(), 1500)
      }
    } catch (err) {
      setIsThinking(false)
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'ai',
        text: err.message || 'Something went wrong. Please try again.',
        timestamp: new Date(),
        isError: true,
      }])
    }
  }, [isThinking, handleExtractionAndTriage])

  const startListening = () => {
    if (!voiceAvailable || isListening) return
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    const rec = new SR()
    rec.lang = LANG_CODES[detectedLanguage] || 'hi-IN'
    rec.continuous = false
    rec.interimResults = true
    rec.onstart = () => setIsListening(true)
    rec.onresult = (e) => {
      const transcript = Array.from(e.results).map(r => r[0].transcript).join('')
      setInputText(transcript)
      if (e.results[e.results.length - 1].isFinal) {
        setIsListening(false)
        sendMessage(transcript)
      }
    }
    rec.onerror = () => setIsListening(false)
    rec.onend = () => setIsListening(false)
    recognitionRef.current = rec
    rec.start()
  }

  const stopListening = () => {
    recognitionRef.current?.stop()
    setIsListening(false)
  }

  const handleBack = () => {
    if (messages.length > 1) setShowLeaveDialog(true)
    else navigate(-1)
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>
      {/* Top bar */}
      <div className="mobile-container" style={{ paddingTop: 24, paddingBottom: 0, flex: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
          <button onClick={handleBack} className="btn-ghost" style={{ padding: '8px 0', fontSize: 14, color: 'var(--gray)' }}>← Back</button>
        </div>
        <ProgressBar currentStep={3} totalSteps={4} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12, marginTop: 16 }}>
          <div>
            <h1 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--navy)', marginBottom: 2 }}>{t('whatsTheProblem', lang)}</h1>
            <p style={{ fontSize: 13, color: 'var(--gray)' }}>{t('speakOrType', lang)}</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {/* Mute toggle */}
            <button
              onClick={() => {
                if (!isMuted && currentAudioRef.current) {
                  currentAudioRef.current.pause()
                  setIsSpeaking(false)
                  setSpeakingMsgId(null)
                }
                if (!isMuted && window.speechSynthesis) window.speechSynthesis.cancel()
                setIsMuted(m => !m)
              }}
              title={isMuted ? 'Unmute' : 'Mute'}
              style={{ width: 32, height: 32, borderRadius: 9999, border: 'none', background: 'var(--light-blue)', cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              {isMuted ? '🔇' : '🔊'}
            </button>
            <div style={{ background: 'rgba(27,107,123,0.08)', border: '1px solid rgba(42,143,163,0.25)', borderRadius: 9999, padding: '3px 10px', fontSize: 11, fontWeight: 500, color: 'var(--teal)', fontFamily: 'DM Mono, monospace', whiteSpace: 'nowrap' }}>
              {LANG_NAMES[detectedLanguage] || 'हिंदी'}
            </div>
          </div>
        </div>
      </div>

      {/* Chat window */}
      <div className="mobile-container" style={{ flex: 1, display: 'flex', flexDirection: 'column', paddingTop: 0, paddingBottom: 0, minHeight: 0 }}>
        <div style={{ flex: 1, background: 'var(--light-blue)', borderRadius: 16, padding: 12, overflowY: 'auto', marginBottom: 8, minHeight: 200 }}>
          {messages.map(m => m.role === 'ai'
            ? <AiBubble key={m.id} text={m.text} isSpeaking={isSpeaking && speakingMsgId === m.id} />
            : <UserBubble key={m.id} text={m.text} />
          )}
          {isThinking && <TypingIndicator />}
          <div ref={chatEndRef} />
        </div>

        {/* Progress dots */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, paddingBottom: 8 }}>
          <span style={{ fontSize: 11, color: '#6B7280', fontFamily: 'DM Mono, monospace' }}>
            Question {Math.min(exchangeCount + 1, 5)} of 5
          </span>
          <div style={{ display: 'flex', gap: 4 }}>
            {[0, 1, 2, 3, 4].map(i => (
              <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: i < exchangeCount ? 'var(--teal)' : 'var(--border)', border: i < exchangeCount ? 'none' : '1px solid #CBD5E1', transition: 'background 0.3s' }} />
            ))}
          </div>
        </div>
      </div>

      {/* Input bar */}
      {!isComplete && (
        <div style={{ background: '#fff', borderTop: '1px solid var(--border)', padding: '12px 16px', paddingBottom: 'calc(12px + env(safe-area-inset-bottom))', display: 'flex', alignItems: 'center', gap: 10, maxWidth: 480, margin: '0 auto', width: '100%' }}>
          {voiceAvailable && (
            <button
              onClick={isListening ? stopListening : startListening}
              disabled={isThinking}
              style={{
                width: 44, height: 44, borderRadius: '50%', border: 'none', cursor: isThinking ? 'not-allowed' : 'pointer', flexShrink: 0,
                background: isListening ? '#FEE2E2' : 'var(--light-blue)',
                animation: isListening ? 'micPulse 1s infinite' : 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill={isListening ? '#EF4444' : 'var(--teal)'}>
                <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm-1-9c0-.55.45-1 1-1s1 .45 1 1v6c0 .55-.45 1-1 1s-1-.45-1-1V5zm6 6c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
              </svg>
            </button>
          )}
          <input
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage(inputText)}
            placeholder={isListening ? t('listening', lang) : t('typeSymptoms', lang)}
            disabled={isThinking || isListening}
            style={{
              flex: 1, height: 44, border: '1.5px solid var(--border)', borderRadius: 22,
              padding: '0 16px', fontSize: 15, color: 'var(--navy)', background: 'var(--bg)',
              outline: 'none', fontFamily: "'DM Sans', sans-serif",
            }}
          />
          <button
            onClick={() => sendMessage(inputText)}
            disabled={!inputText.trim() || isThinking || isListening}
            style={{
              width: 44, height: 44, borderRadius: '50%', border: 'none', flexShrink: 0,
              cursor: !inputText.trim() || isThinking ? 'not-allowed' : 'pointer',
              background: !inputText.trim() || isThinking ? 'var(--border)' : 'linear-gradient(135deg,var(--teal),var(--blue))',
              boxShadow: !inputText.trim() || isThinking ? 'none' : '0 4px 12px rgba(27,107,123,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.2s',
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill={!inputText.trim() || isThinking ? 'var(--gray)' : 'white'}>
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
            </svg>
          </button>
        </div>
      )}

      {errorMsg && (
        <div style={{ maxWidth: 480, margin: '0 auto', width: '100%', padding: '0 16px 12px' }}>
          <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#DC2626', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            {errorMsg}
            <button onClick={handleExtractionAndTriage} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#DC2626', fontWeight: 600, fontSize: 12 }}>Retry</button>
          </div>
        </div>
      )}

      {/* Extraction loading overlay */}
      {isExtracting && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(4px)', zIndex: 50, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20 }}>
          <div style={{ width: 48, height: 48, border: '3px solid var(--light-blue)', borderTopColor: 'var(--teal)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 18, fontWeight: 600, color: 'var(--navy)', marginBottom: 6 }}>{t('analyzingSymptoms', lang)}</div>
          </div>
        </div>
      )}

      {/* Leave dialog */}
      {showLeaveDialog && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: 24, maxWidth: 320, width: '100%' }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--navy)', marginBottom: 8 }}>Leave conversation?</div>
            <div style={{ fontSize: 14, color: '#6B7280', marginBottom: 20 }}>Your symptom check will be lost.</div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn-ghost" style={{ flex: 1 }} onClick={() => { setShowLeaveDialog(false); navigate(-1) }}>Leave</button>
              <button className="btn-primary" style={{ flex: 1 }} onClick={() => setShowLeaveDialog(false)}>Continue</button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes bubbleIn { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:translateY(0); } }
        @keyframes typingBounce { 0%,60%,100% { transform:translateY(0); } 30% { transform:translateY(-5px); } }
        @keyframes spin { to { transform:rotate(360deg); } }
        @keyframes micPulse { 0%,100% { box-shadow:0 0 0 0 rgba(239,68,68,0.4); } 50% { box-shadow:0 0 0 8px transparent; } }
        @keyframes soundBar {
          0%,100% { transform: scaleY(0.4); }
          50%      { transform: scaleY(1.0); }
        }
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

  // RED danger words
  const redWords = [
    'chest pain', 'chest_pain', 'heart attack', 'unconscious', 'unresponsive',
    'seizure', 'convulsion', 'fits', 'not breathing', 'cant breathe', "can't breathe",
    'difficulty breathing', 'breathless', 'vomiting blood', 'coughing blood',
    'blood in stool', 'heavy bleeding', 'stroke', 'facial droop', 'paralysis',
    'choking', 'blue lips', 'cyanosis', 'snake bite', 'poisoning', 'overdose',
    'collapsed', 'not waking', 'dying', 'death', 'severe burn', 'electric shock',
    'anaphylaxis', 'throat swelling', 'diabetic coma', 'eclampsia',
  ]
  if (hasDanger || redWords.some(w => combined.includes(w))) {
    return {
      level: 'RED', triage_level: 'RED',
      reason: 'Emergency symptoms detected — immediate medical attention required',
      recommended_action: 'Call 108 immediately or go to nearest emergency hospital. Do not wait.',
      self_care_instructions: [],
      warning_signs: [],
      assessment_id: 'mock-' + Date.now(), facility: FACILITY,
    }
  }

  // RED — severe severity
  if (severity === 'severe') {
    return {
      level: 'RED', triage_level: 'RED',
      reason: 'Severe symptoms require emergency evaluation',
      recommended_action: 'Go to nearest hospital or call 108 immediately.',
      self_care_instructions: [],
      warning_signs: [],
      assessment_id: 'mock-' + Date.now(), facility: FACILITY,
    }
  }

  // YELLOW — moderate or duration >= 3 days
  const dur = extracted.duration_days || 0
  if (severity === 'moderate' || dur >= 3) {
    return {
      level: 'YELLOW', triage_level: 'YELLOW',
      reason: severity === 'moderate' ? 'Moderate symptoms need medical evaluation' : `Symptoms lasting ${dur} days need evaluation`,
      recommended_action: 'Visit PHC within 24 hours.',
      self_care_instructions: ['Rest and drink plenty of fluids', 'Take paracetamol for fever or pain', 'Monitor symptoms closely'],
      warning_signs: ['Fever above 104°F', 'Symptoms worsening rapidly', 'Blood in vomit or stool'],
      assessment_id: 'mock-' + Date.now(), facility: FACILITY,
    }
  }

  // YELLOW — yellow keywords
  const yellowWords = [
    'fever', 'vomiting', 'diarrhea', 'loose motion', 'jaundice', 'rash',
    'urinary', 'kidney', 'ear pain', 'eye pain', 'wound infected', 'abscess',
    'dengue', 'malaria', 'typhoid', 'tb', 'tuberculosis', 'blood in urine',
    'suicidal', 'self harm', 'fracture', 'broken bone',
  ]
  if (yellowWords.some(w => combined.includes(w))) {
    return {
      level: 'YELLOW', triage_level: 'YELLOW',
      reason: 'Symptoms require medical evaluation',
      recommended_action: 'Visit PHC within 24 hours.',
      self_care_instructions: ['Rest and drink plenty of fluids', 'Take paracetamol for fever or pain'],
      warning_signs: ['Fever above 104°F', 'Symptoms worsening rapidly'],
      assessment_id: 'mock-' + Date.now(), facility: FACILITY,
    }
  }

  // GREEN — only mild, short duration, no concerning symptoms
  return {
    level: 'GREEN', triage_level: 'GREEN',
    reason: 'Mild symptoms appear manageable at home',
    recommended_action: 'Rest and follow self-care instructions. Visit PHC if no improvement in 2-3 days.',
    self_care_instructions: ['Rest for 1-2 days', 'Drink warm fluids', 'Take paracetamol if needed'],
    warning_signs: ['Fever develops', 'Symptoms worsen after 2 days', 'New symptoms appear'],
    assessment_id: 'mock-' + Date.now(), facility: FACILITY,
  }
}
