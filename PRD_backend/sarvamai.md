use this api:sarvam api "sk_5orsvtwf_7YODOExTJuJIiZZuWuGhyKw6"
FEATURE: Auto Text-to-Speech on Bot Messages
ENGINE: Sarvam AI TTS API (primary) + Web Speech API (fallback)
SCOPE: Chatbot conversation component only
NOTHING ELSE IN THE PROJECT CHANGES

═══════════════════════════════════════════════════
WHAT HAPPENS
═══════════════════════════════════════════════════

Every time the bot sends a message in the chat:
1. Message bubble appears on screen
2. Typing indicator disappears
3. Audio automatically plays — bot message read aloud
4. Speaker animation shows on that bubble while playing
5. Animation disappears when audio finishes

No button needed to trigger it.
No user action needed.
Fully automatic on every bot message.

Only BOT messages are spoken.
User's own messages are NEVER spoken.

═══════════════════════════════════════════════════
5 LANGUAGES SUPPORTED
═══════════════════════════════════════════════════

Hindi    → hi-IN → pace: 1.0
English  → en-IN → pace: 1.1
Marathi  → mr-IN → pace: 0.95
Tamil    → ta-IN → pace: 0.90
Gujarati → gu-IN → pace: 0.95

Language used = detectedLanguage state
(whatever language user is currently speaking in)

Short code to full code mapping:
hi → hi-IN
en → en-IN
mr → mr-IN
ta → ta-IN
gu → gu-IN

═══════════════════════════════════════════════════
PRIMARY ENGINE — SARVAM AI TTS
═══════════════════════════════════════════════════

Why Sarvam AI:
- Built specifically for Indian languages
- Native pronunciation for all 5 languages
- Gujarati and Marathi sound natural
  (Web Speech API fails on these)
- Consistent across all browsers and devices
- No browser dependency

API Details:
  Endpoint: POST https://api.sarvam.ai/text-to-speech
  
  Headers:
    Content-Type: application/json
    api-subscription-key: VITE_SARVAM_API_KEY

  Request Body:
  {
    "inputs": ["bot message text here"],
    "target_language_code": "hi-IN",
    "speaker": "meera",
    "pitch": 0,
    "pace": 1.0,
    "loudness": 1.5,
    "speech_sample_rate": 8000,
    "enable_preprocessing": true,
    "model": "bulbul:v1"
  }

  Response:
  {
    "audios": ["base64_encoded_audio_string"]
  }

Speaker voice: "meera" (female) for all languages
  Female voice chosen for warmth and trust
  in healthcare context
  Alternative: "yuv" (male) if needed

pace changes per language (see above)
All other fields stay constant across languages

═══════════════════════════════════════════════════
FALLBACK ENGINE — WEB SPEECH API
═══════════════════════════════════════════════════

Used ONLY when Sarvam AI call fails for any reason:
  - Network error
  - API key issue
  - Rate limit hit
  - Any other exception

Web Speech API fallback:
  window.speechSynthesis.cancel()
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang   = languageCode  (hi-IN / en-IN etc.)
  utterance.rate   = 0.85
  utterance.pitch  = 1.0
  utterance.volume = 1.0
  window.speechSynthesis.speak(utterance)

If Web Speech API also not supported by browser:
  Skip silently. No error. No crash.
  Chat works normally without audio.

═══════════════════════════════════════════════════
IMPLEMENTATION — STEP BY STEP
═══════════════════════════════════════════════════

STEP 1 — Add to .env file:
  VITE_SARVAM_API_KEY=your_sarvam_key_here

STEP 2 — Add state variables:
  isMuted: boolean, default false
  isSpeaking: boolean, default false
  currentAudio: Audio object or null
    (reference to currently playing audio
     so we can stop it if new message arrives)

STEP 3 — Add helper function base64ToBlob:

  const base64ToBlob = (base64, mimeType) => {
    const byteCharacters = atob(base64)
    const byteNumbers = Array.from(
      byteCharacters,
      char => char.charCodeAt(0)
    )
    const byteArray = new Uint8Array(byteNumbers)
    return new Blob([byteArray], { type: mimeType })
  }

STEP 4 — Add main speakWithSarvam function:

  const speakWithSarvam = async (text, languageCode) => {

    if (isMuted) return

    const paceMap = {
      'hi-IN': 1.0,
      'en-IN': 1.1,
      'mr-IN': 0.95,
      'ta-IN': 0.90,
      'gu-IN': 0.95,
    }

    const langMap = {
      'hi': 'hi-IN',
      'en': 'en-IN',
      'mr': 'mr-IN',
      'ta': 'ta-IN',
      'gu': 'gu-IN',
    }

    const fullCode = langMap[languageCode]
                  || languageCode

    // Stop any currently playing audio first
    if (currentAudio) {
      currentAudio.pause()
      currentAudio.src = ''
      setCurrentAudio(null)
    }

    setIsSpeaking(true)

    try {
      // PRIMARY: Sarvam AI
      const response = await fetch(
        'https://api.sarvam.ai/text-to-speech',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'api-subscription-key':
              import.meta.env.VITE_SARVAM_API_KEY
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
            model: 'bulbul:v1'
          })
        }
      )

      if (!response.ok) throw new Error('Sarvam failed')

      const data = await response.json()
      const base64Audio = data.audios[0]
      const audioBlob = base64ToBlob(base64Audio, 'audio/wav')
      const audioUrl = URL.createObjectURL(audioBlob)
      const audio = new Audio(audioUrl)

      setCurrentAudio(audio)

      audio.onended = () => {
        setIsSpeaking(false)
        setCurrentAudio(null)
        URL.revokeObjectURL(audioUrl)
      }

      audio.onerror = () => {
        setIsSpeaking(false)
        setCurrentAudio(null)
        URL.revokeObjectURL(audioUrl)
      }

      audio.play()

    } catch (error) {

      // FALLBACK: Web Speech API
      try {
        if (window.speechSynthesis) {
          window.speechSynthesis.cancel()
          const utterance =
            new SpeechSynthesisUtterance(text)
          utterance.lang   = fullCode
          utterance.rate   = 0.85
          utterance.pitch  = 1.0
          utterance.volume = 1.0
          utterance.onend  = () => setIsSpeaking(false)
          utterance.onerror= () => setIsSpeaking(false)
          window.speechSynthesis.speak(utterance)
        } else {
          setIsSpeaking(false)
        }
      } catch {
        setIsSpeaking(false)
        // Fail completely silently
        // Chat still works without audio
      }
    }
  }

STEP 5 — Trigger on bot message:

  Call speakWithSarvam() immediately after
  bot message is added to messages array

  Pass:
    text: bot message text (plain text, no markdown)
    languageCode: detectedLanguage current value

STEP 6 — Cleanup on component unmount:

  useEffect(() => {
    return () => {
      if (currentAudio) {
        currentAudio.pause()
        currentAudio.src = ''
      }
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel()
      }
    }
  }, [])

═══════════════════════════════════════════════════
VISUAL INDICATOR WHILE SPEAKING
═══════════════════════════════════════════════════

On the bot bubble that is currently being read aloud:
Show animated speaker icon at bottom right of bubble

Speaker icon:
  3 vertical bars (sound wave style)
  Color: #2F6BFF
  Height: bar1=8px, bar2=12px, bar3=8px
  Width: 3px each, gap: 2px
  Border radius: 2px

Animation while isSpeaking = true:
  Bars scale up and down alternately
  bar1: scaleY 0.4 → 1.0 → 0.4, 0.6s infinite
  bar2: scaleY 1.0 → 0.4 → 1.0, 0.6s infinite, delay 0.2s
  bar3: scaleY 0.4 → 1.0 → 0.4, 0.6s infinite, delay 0.4s

Show animation: only when isSpeaking = true
              AND that bubble is the latest bot message
Hide animation: when isSpeaking = false

═══════════════════════════════════════════════════
MUTE BUTTON
═══════════════════════════════════════════════════

Position: top right corner of chat window
Size: 32px × 32px circle
Background: #EAF2FF
Border: none
Border radius: 9999px

Icon when sound ON  (isMuted = false): 🔊
Icon when sound OFF (isMuted = true):  🔇
Font size: 16px

On click:
  Toggle isMuted state
  If turning mute ON while audio playing:
    Stop current audio immediately
    currentAudio.pause()
    setIsSpeaking(false)

Default: isMuted = false (sound ON)

═══════════════════════════════════════════════════
COMPLETE LIST OF CHANGES
═══════════════════════════════════════════════════

ADD to .env:
  VITE_SARVAM_API_KEY

ADD state variables:
  isMuted
  isSpeaking
  currentAudio

ADD functions:
  base64ToBlob()
  speakWithSarvam()

ADD in JSX:
  Mute toggle button (top right of chat window)
  Speaker animation on latest bot bubble
  
ADD cleanup:
  useEffect unmount cleanup for audio

MODIFY:
  Where bot message is added to messages array
  Add: speakWithSarvam(newBotMessage.text, detectedLanguage)

DO NOT CHANGE:
  Grok API integration
  Conversation logic
  Message bubble design
  User input (voice/text)
  Language detection
  Triage extraction flow
  Any other component or page

═══════════════════════════════════════════════════
FLOW SUMMARY
═══════════════════════════════════════════════════

Bot message arrives from Grok API
        ↓
Message added to messages array
        ↓
Bot bubble renders on screen
        ↓
speakWithSarvam(text, language) called
        ↓
isMuted check → if muted: stop here
        ↓
Stop any currently playing audio
        ↓
Set isSpeaking = true
Show speaker animation on bubble
        ↓
Call Sarvam AI TTS API
        ↓
        ├── SUCCESS:
        │   Decode base64 audio
        │   Create Audio object
        │   Play audio
        │   On end: isSpeaking = false
        │           Hide animation
        │
        └── FAILURE:
            Try Web Speech API fallback
            On end: isSpeaking = false
            If fallback also fails:
            isSpeaking = false silently
            Chat works normally