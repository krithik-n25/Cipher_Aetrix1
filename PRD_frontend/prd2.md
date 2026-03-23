CHANGE REQUEST — Margdarshak SymptomInput.jsx

UNDERSTAND THIS FIRST:
We are NOT creating any new page.
We are NOT creating VoiceConversation.jsx.
We are REPLACING the current speech-to-text 
feature inside SymptomInput.jsx with a 
conversational AI chatbot powered by Gemini API.

The chatbot lives INSIDE SymptomInput.jsx.
It replaces the "speak or type your symptom" 
one-shot input with a back-and-forth conversation.

═══════════════════════════════════════════════
WHAT EXISTS NOW (REMOVE THIS)
═══════════════════════════════════════════════

Current SymptomInput.jsx has:
- One microphone button for one-time voice input
- One text box for one-time text input
- User speaks/types → symptom extracted → moves on

REMOVE:
- The one-shot microphone button
- The one-shot text input box
- The "quick symptom chips" row
- The symptom confirmation card
  ("I understood: fever, headache — correct?")

═══════════════════════════════════════════════
WHAT TO BUILD INSTEAD (inside SymptomInput.jsx)
═══════════════════════════════════════════════

A full conversational chat interface 
embedded inside SymptomInput.jsx.

It looks and feels like WhatsApp.
The AI (Gemini) asks questions.
The user responds by voice OR text.
After 4-6 exchanges, the conversation ends.
The app extracts symptom data and moves to triage.

This is a CHATBOT — not a form. Not MCQ.
Not multiple choice. Pure conversation.

═══════════════════════════════════════════════
VISUAL DESIGN OF THE CHAT INTERFACE
═══════════════════════════════════════════════

Keep the existing page structure:
- Same top bar (back button + progress bar)
- Same page title area

REPLACE the input section with:

CHAT WINDOW:
- Takes up 70% of screen height
- Scrollable message list
- Light background: #F0F4FF
- Border radius: 16px
- Padding: 12px

AI message bubbles (left side):
- Background: #FFFFFF
- Border: 1px solid #E5E7EB
- Border radius: 4px 16px 16px 16px
- Padding: 12px 16px
- Text: #0B1F3A, 15px
- Small avatar left: 🏥 circle (28px, #EAF2FF)
- Timestamp below: 11px, #9CA3AF

User message bubbles (right side):
- Background: Primary gradient (#2F6BFF → #6EA8FF)
- Border radius: 16px 4px 16px 16px
- Padding: 12px 16px
- Text: white, 15px
- Timestamp below: 11px, rgba(255,255,255,0.6)

Typing indicator (when Gemini is thinking):
- Left-aligned bubble
- Three animated dots bouncing
- Same style as AI bubble
- Shows while waiting for Gemini API response

AUTO-SCROLL:
- Chat auto scrolls to latest message always
- Smooth scroll behavior

INPUT BAR (bottom, sticky):
- White bar, shadow above
- Left: microphone button (circle, 44px, #EAF2FF background, blue mic icon)
- Center: text input ("Type or speak..." placeholder)
- Right: send button (circle, 44px, primary gradient, white arrow icon)
- When mic is recording:
  Mic button turns red + pulse animation
  Placeholder changes to "Listening..."
  Send button disabled

LANGUAGE PILL (top right of chat window):
- Shows detected language
- e.g. "हिंदी" / "ગુજરાતી" / "English"
- Auto-updates after first user message

PROGRESS INDICATOR (above input bar):
- "Question 2 of 5" — 11px, #6B7280, centered
- Small dot progress: ● ● ○ ○ ○

═══════════════════════════════════════════════
GEMINI API SETUP
═══════════════════════════════════════════════

API Key: AIzaSyDLdE5lf6HVnCUN5DgUv_u0ln7Ez_-f2c0

Endpoint:
POST https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=AIzaSyDLdE5lf6HVnCUN5DgUv_u0ln7Ez_-f2c0

Request body format:
{
  "system_instruction": {
    "parts": [{ "text": "SYSTEM PROMPT" }]
  },
  "contents": [
    { "role": "user", "parts": [{ "text": "message" }] },
    { "role": "model", "parts": [{ "text": "response" }] },
    { "role": "user", "parts": [{ "text": "next message" }] }
  ]
}

For multi-turn: pass FULL conversation history 
every time in contents array.

Response extraction:
response.candidates[0].content.parts[0].text

Create this API call in:
src/utils/gemini.js

Export one function:
export const chatWithGemini = async (conversationHistory, systemPrompt)

This function:
- Takes full history array + system prompt
- Calls Gemini API
- Returns response text string
- Handles errors (show "Could not connect, try again")

═══════════════════════════════════════════════
SYSTEM PROMPT FOR GEMINI
═══════════════════════════════════════════════

Build this dynamically in SymptomInput.jsx:

const buildSystemPrompt = (detectedSymptoms, selectedLanguage) => `
You are a warm, gentle health assistant helping 
rural patients in India understand their symptoms.

LANGUAGE RULE — MOST IMPORTANT:
Detect the language the user writes or speaks in.
Respond ONLY in that language. Always.
- If user writes in Hindi → respond in Hindi
- If user writes in Gujarati → respond in Gujarati
- If user writes in Marathi → respond in Marathi
- If user writes in Tamil → respond in Tamil
- If user writes in English → respond in English
Use simple everyday words. No medical terms.
Speak like a caring elder, not a doctor.
Default language if unclear: ${selectedLanguage}

YOUR GOAL:
The patient has reported: ${detectedSymptoms.join(', ')}
Ask follow-up questions to understand the severity.
Ask ONE short question per message. Maximum 5 questions total.
Each message must be 1-2 sentences only. Never longer.

WHAT TO ASK ABOUT (choose relevant ones):
- How many days has this been happening?
- Is it getting better, same, or worse?
- How bad is it — mild, moderate, or very bad?
- Any other symptoms alongside?
- Is the patient a child, adult, or elderly?
- Any danger signs (chest pain, can't breathe, 
  unconscious, seizures, blood)?

TONE:
Warm, reassuring, never scary.
Example good message: 
"बुखार कितने दिनों से है?"
Example bad message: 
"Please describe the duration and intensity 
of your febrile episodes in detail."

WHEN TO END:
After 4-5 exchanges, or when you have enough 
information, respond with a message that ends with 
the exact phrase: [ASSESSMENT_READY]

Example ending message in Hindi:
"शुक्रिया, मुझे अब काफी जानकारी मिल गई है। 
मैं देखता हूँ आपको क्या करना चाहिए। [ASSESSMENT_READY]"

Example in Gujarati:
"આભાર, મને હવે પૂરતી માહિતી મળી ગઈ છે। 
ચાલો જોઈએ આપે શું કરવું જોઈએ। [ASSESSMENT_READY]"

Example in English:
"Thank you, I have enough information now. 
Let me check what you should do. [ASSESSMENT_READY]"

NEVER:
- Diagnose any disease
- Recommend specific medicines
- Say anything that causes panic
- Ask more than 5 questions
- Write more than 2 sentences per message
- Use bullet points or lists
`

═══════════════════════════════════════════════
CONVERSATION LOGIC INSIDE SymptomInput.jsx
═══════════════════════════════════════════════

STATE VARIABLES:
- messages: []  
  Each message: { id, role ('ai'|'user'), text, timestamp }
- conversationHistory: []  
  For Gemini API: { role ('user'|'model'), parts: [{text}] }
- isThinking: boolean
- isListening: boolean  
- inputText: string
- exchangeCount: number
- isComplete: boolean
- detectedSymptoms: []  
  (passed in from previous step or extracted from first message)

ON PAGE LOAD / COMPONENT MOUNT:
1. Get detectedSymptoms from route state
   (passed from wherever initial symptom was collected)
   OR if no symptoms yet, Gemini opens with:
   "नमस्ते! मुझे बताइए आज क्या तकलीफ है?"
   (in selected language)

2. Call chatWithGemini with:
   - Empty conversation history
   - System prompt with detected symptoms
   - Initial user message (internal, not shown):
     "Start the conversation. 
      Greet the patient and ask about their symptoms."

3. Show Gemini's first message as AI bubble

4. Show typing indicator while waiting

WHEN USER SENDS A MESSAGE (voice or text):
1. Add user message to messages array → shows as right bubble
2. Add to conversationHistory as role: "user"
3. Set isThinking = true → show typing indicator
4. Call chatWithGemini(conversationHistory, systemPrompt)
5. Receive Gemini response text
6. Check if response contains "[ASSESSMENT_READY]"
   IF YES:
     - Remove "[ASSESSMENT_READY]" from display text
     - Show clean message as AI bubble
     - Set isComplete = true
     - After 1.5s delay → trigger triage extraction
   IF NO:
     - Show response as AI bubble
     - exchangeCount++
     - Set isThinking = false
     - Re-enable input
8. Add Gemini response to conversationHistory 
   as role: "model"

VOICE INPUT FLOW:
- User taps mic button
- SpeechRecognition starts in detected language
- Transcript appears in text input as user speaks
- On speech end → auto-sends (same as tapping send)
- Language: use detected language code (hi-IN etc.)

TEXT INPUT FLOW:
- User types in input field
- Taps send button OR presses Enter
- Same flow as voice

═══════════════════════════════════════════════
AFTER CONVERSATION ENDS — TRIAGE EXTRACTION
═══════════════════════════════════════════════

When [ASSESSMENT_READY] detected:

STEP 1 — Show loading overlay on top of chat:
- Semi-transparent white overlay
- Blue spinner (large, centered)
- Text: "Analyzing your symptoms..." (translated)

STEP 2 — Call Gemini one more time:
Send this extraction message:
{
  role: "user",
  text: `Based on our conversation above, 
  extract ONLY a JSON object with these exact fields. 
  No explanation. Just JSON.
  {
    "symptoms": ["list of symptoms mentioned"],
    "duration_days": number or null,
    "severity": "mild" or "moderate" or "severe",
    "additional_symptoms": ["any extra symptoms"],
    "has_danger_signs": true or false,
    "patient_age_group": "child" or "adult" or "elderly",
    "conversation_summary": "one sentence summary in English"
  }`
}

STEP 3 — Parse JSON from Gemini response:
Clean response: remove markdown backticks if present
Parse: JSON.parse(cleanedResponse)

STEP 4 — Call backend triage API:
POST /triage/assess with:
{
  symptoms: extractedData.symptoms,
  answers: {
    duration: extractedData.duration_days,
    severity: extractedData.severity,
    has_danger_signs: extractedData.has_danger_signs,
    patient_age_group: extractedData.patient_age_group
  },
  age: patientAge,  (from PatientInfo step)
  gender: patientGender,
  village: village,
  block: block,
  district: district,
  assessed_by: userId or null,
  conversation_summary: extractedData.conversation_summary
}

STEP 5 — Navigate to TriageResult.jsx:
navigate('/user/result', { 
  state: { triageResult, facility, assessmentId, lang } 
})

═══════════════════════════════════════════════
BACKEND CHANGE NEEDED
═══════════════════════════════════════════════

In backend /triage/assess endpoint:

ADD one optional field to the request schema:
- conversation_summary: Optional[str]

ADD one optional field to assessments table in Supabase:
- conversation_summary: text (nullable)

Save conversation_summary to the assessments table
when present. Everything else in triage logic 
stays exactly the same.

The rule engine still runs the same way.
The triage result is still RED/YELLOW/GREEN.
Only the input method changed.

═══════════════════════════════════════════════
ASHA WORKER — SAME CHANGE
═══════════════════════════════════════════════

In AssessPatient.jsx:
- Remove MCQ follow-up question cards
- After patient details entered →
  Show the same chat interface (VoiceConversation chatbot)
  embedded inside AssessPatient.jsx

Add one extra thing for ASHA:
- Small "Skip / Enter manually" ghost link 
  below the chat window
- If tapped: shows simple text area for ASHA 
  to type symptom summary manually
- Submits directly without Gemini conversation
- For cases where patient cannot communicate

═══════════════════════════════════════════════
NEW FILE TO CREATE
═══════════════════════════════════════════════

CREATE: src/utils/gemini.js

Contents:
- GEMINI_API_KEY constant
- GEMINI_ENDPOINT constant  
- chatWithGemini(conversationHistory, systemPrompt) function
- extractSymptomData(conversationHistory) function
  (calls Gemini with extraction prompt, returns parsed JSON)
- Error handling: 
  network error → throw with user-friendly message
  JSON parse error → retry once, then use fallback

═══════════════════════════════════════════════
FILES TO MODIFY
═══════════════════════════════════════════════

MODIFY: src/pages/user/SymptomInput.jsx
- Remove: one-shot voice/text input
- Remove: symptom chips
- Remove: symptom confirmation card
- Add: full chat interface as described above
- Add: Gemini conversation logic
- Add: triage extraction on completion

MODIFY: src/pages/asha/AssessPatient.jsx
- Remove: MCQ follow-up question section
- Add: same chat interface after patient details
- Add: "Skip" fallback option

MODIFY: src/App.jsx
- Remove route: /user/questions
- Keep all other routes unchanged

═══════════════════════════════════════════════
DELETE
═══════════════════════════════════════════════

DELETE: src/pages/user/FollowUpQuestions.jsx
This page no longer exists.

═══════════════════════════════════════════════
DO NOT TOUCH
═══════════════════════════════════════════════

Everything else stays exactly the same:
- Login.jsx
- LanguageSelect.jsx
- PatientInfo.jsx
- TriageResult.jsx
- FeedbackLoop.jsx
- AshaDashboard.jsx
- PatientList.jsx
- FollowUp.jsx
- MonthlyReport.jsx
- All Admin pages
- AuthContext.jsx
- LanguageContext.jsx
- All other utils
- Design system
- Color scheme
- Typography

═══════════════════════════════════════════════
SUMMARY IN ONE LINE
═══════════════════════════════════════════════

Replace the one-shot symptom input and the 
MCQ follow-up page with a WhatsApp-style 
conversational chatbot powered by Gemini API 
that asks 4-5 questions in the user's own language,
all inside SymptomInput.jsx,
then extracts structured data and sends to 
existing triage backend when done.

═══════════════════════════════════════════════
START HERE
═══════════════════════════════════════════════

1. Create src/utils/gemini.js first
2. Modify SymptomInput.jsx 
3. Modify AssessPatient.jsx
4. Delete FollowUpQuestions.jsx
5. Update App.jsx routes

Confirm understanding before starting.