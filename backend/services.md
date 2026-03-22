# Margdarshak — Conversational Chatbot PRD
**Feature:** Gemini-Powered Multilingual Symptom Conversation  
**Version:** 2.0 — Change Request  
**Replaces:** FollowUpQuestions.jsx + one-shot SymptomInput  
**Status:** Addendum to Main PRD v1.0  

---

## Table of Contents

1. [What This Document Covers](#1-what-this-document-covers)
2. [What Changes vs What Stays](#2-what-changes-vs-what-stays)
3. [New File — gemini.js](#3-new-file--geminijs)
4. [Modified File — SymptomInput.jsx](#4-modified-file--symptominputjsx)
5. [Modified File — AssessPatient.jsx (ASHA)](#5-modified-file--assesspatientjsx-asha)
6. [Modified File — App.jsx](#6-modified-file--appjsx)
7. [Backend Change](#7-backend-change)
8. [Gemini API Specification](#8-gemini-api-specification)
9. [System Prompt Specification](#9-system-prompt-specification)
10. [Conversation Logic & State](#10-conversation-logic--state)
11. [Visual Design — Chat Interface](#11-visual-design--chat-interface)
12. [Voice Input Integration](#12-voice-input-integration)
13. [Triage Extraction Flow](#13-triage-extraction-flow)
14. [Language Detection & Switching](#14-language-detection--switching)
15. [Error Handling](#15-error-handling)
16. [Edge Cases](#16-edge-cases)

---

## 1. What This Document Covers

This PRD is a **change request addendum** to the main Margdarshak PRD v1.0.

It covers one focused change:

> Replace the one-shot voice/text symptom input and the MCQ follow-up questions page with a **WhatsApp-style conversational AI chatbot** powered by **Gemini API**, embedded directly inside `SymptomInput.jsx`, that holds a natural back-and-forth conversation with the patient in their own language, then extracts structured symptom data and passes it to the existing triage backend.

### Why This Change

Rural patients cannot interact with multiple choice questions or forms. They can speak. The chatbot meets them where they are — in their own language, in a conversational format they already understand from WhatsApp. The AI adapts its questions based on what the patient says, just like a real health worker would.

### What This Is NOT

- NOT a new page
- NOT a separate voice assistant component
- NOT a replacement for the triage result
- NOT a replacement for the backend rule engine
- The rule engine still decides RED / YELLOW / GREEN
- Gemini only handles the conversation and data extraction

---

## 2. What Changes vs What Stays

### DELETE — Remove These Completely

| File | Action | Reason |
|---|---|---|
| `src/pages/user/FollowUpQuestions.jsx` | DELETE entire file | Replaced by chatbot inside SymptomInput |
| MCQ option cards in `AssessPatient.jsx` | REMOVE section | Replaced by same chatbot |
| One-shot mic button in `SymptomInput.jsx` | REMOVE | Replaced by chat input bar |
| One-shot text box in `SymptomInput.jsx` | REMOVE | Replaced by chat input bar |
| Quick symptom chips row | REMOVE | No longer needed |
| Symptom confirmation card | REMOVE | Chatbot handles confirmation naturally |
| Route `/user/questions` in `App.jsx` | REMOVE | Page no longer exists |

### CREATE — New Files

| File | Action |
|---|---|
| `src/utils/gemini.js` | CREATE — Gemini API wrapper |

### MODIFY — Change These Files

| File | What Changes |
|---|---|
| `src/pages/user/SymptomInput.jsx` | Add full chatbot interface |
| `src/pages/asha/AssessPatient.jsx` | Add chatbot after patient details |
| `src/App.jsx` | Remove /user/questions route |
| Backend `/triage/assess` | Add optional conversation_summary field |
| Supabase `assessments` table | Add conversation_summary column |

### DO NOT TOUCH — Leave Exactly As-Is

```
Login.jsx
LanguageSelect.jsx
PatientInfo.jsx
TriageResult.jsx
FeedbackLoop.jsx
AshaDashboard.jsx
PatientList.jsx
FollowUp.jsx
MonthlyReport.jsx
All Admin pages (AdminDashboard, Heatmap, PHCMonitor, AshaTracker, OutbreakAlerts, Reports)
AuthContext.jsx
LanguageContext.jsx
translate.js
api.js
haversine.js
Design system (all colors, fonts, shadows, spacing)
All Supabase tables except assessments
```

---

## 3. New File — gemini.js

**Location:** `src/utils/gemini.js`

### 3.1 Constants

```
GEMINI_API_KEY: "AIzaSyDLdE5lf6HVnCUN5DgUv_u0ln7Ez_-f2c0"

GEMINI_ENDPOINT: 
"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=AIzaSyDLdE5lf6HVnCUN5DgUv_u0ln7Ez_-f2c0"
```

### 3.2 Request Body Format

Every call to Gemini must use this structure:

```
{
  "system_instruction": {
    "parts": [{ "text": systemPromptString }]
  },
  "contents": [
    { "role": "user", "parts": [{ "text": "message text" }] },
    { "role": "model", "parts": [{ "text": "response text" }] },
    { "role": "user", "parts": [{ "text": "next message" }] }
    ... (full history every call)
  ]
}
```

### 3.3 Response Extraction

```
const responseText = data.candidates[0].content.parts[0].text
```

### 3.4 Functions to Export

**Function 1: chatWithGemini**

Parameters:
- `conversationHistory` — array of `{ role: 'user'|'model', parts: [{text: string}] }`
- `systemPrompt` — string

Returns: Promise resolving to response text string

Behavior:
- Build request body with systemPrompt + conversationHistory
- POST to GEMINI_ENDPOINT
- Extract and return response text
- On network error: throw Error("Connection failed. Please check your internet.")
- On API error (non-200): throw Error("Could not reach health assistant. Try again.")

**Function 2: extractSymptomData**

Parameters:
- `conversationHistory` — full conversation array

Returns: Promise resolving to parsed JSON object

Behavior:
- Appends this extraction message to conversationHistory:

```
"Based on our conversation above, extract ONLY a JSON object 
with these exact fields. No explanation. No markdown. Just raw JSON.
{
  'symptoms': ['array of symptom strings in English'],
  'duration_days': number or null,
  'severity': 'mild' or 'moderate' or 'severe',
  'additional_symptoms': ['any extra symptoms mentioned'],
  'has_danger_signs': true or false,
  'patient_age_group': 'child' or 'adult' or 'elderly',
  'conversation_summary': 'one sentence in English summarizing the case'
}"
```

- Calls Gemini with this appended history
- Receives response text
- Cleans response: removes ```json and ``` if present
- Parses: JSON.parse(cleanedText)
- On JSON parse error: retries once with more explicit prompt
- On second failure: returns safe fallback object:
  ```
  {
    symptoms: detectedSymptomsFromEarlier,
    duration_days: null,
    severity: 'moderate',
    additional_symptoms: [],
    has_danger_signs: false,
    patient_age_group: 'adult',
    conversation_summary: 'Patient reported symptoms via voice conversation'
  }
  ```

---

## 4. Modified File — SymptomInput.jsx

### 4.1 What This Page Now Does

SymptomInput.jsx is no longer a "describe your symptom" input page.

It is now a **full conversational interface** where:
1. Gemini greets the patient and asks the first question
2. Patient responds by voice or text
3. Gemini asks follow-up questions (max 5 total)
4. Conversation ends naturally
5. Gemini extracts structured data
6. App calls triage backend
7. Navigates to TriageResult.jsx

### 4.2 Props / Route State Received

From `PatientInfo.jsx` via React Router navigate state:
```
{
  patientType: string,
  patientAge: number,
  patientGender: string,
  village: string,
  block: string,
  district: string,
  selectedLanguage: string  (hi / gu / mr / ta / en)
}
```

Also from AuthContext:
```
userId: string or null (null for guest)
```

### 4.3 State Variables

```
messages: []
  Shape of each message:
  {
    id: string (unique, timestamp-based),
    role: 'ai' | 'user',
    text: string,
    timestamp: Date
  }

conversationHistory: []
  Shape: { role: 'user'|'model', parts: [{text: string}] }
  This is what gets sent to Gemini every call

isThinking: boolean
  true while waiting for Gemini API response
  Shows typing indicator

isListening: boolean
  true while Web Speech API is recording
  Shows mic pulse animation

inputText: string
  Current value of text input field

exchangeCount: number
  Starts at 0, increments after each user message
  Conversation ends when Gemini sends [ASSESSMENT_READY]
  or exchangeCount >= 5 (safety cap)

isComplete: boolean
  Set to true when [ASSESSMENT_READY] detected
  Triggers extraction flow

isExtracting: boolean
  true during the extractSymptomData call and triage API call
  Shows full-screen loading overlay

detectedLanguage: string
  Initially = selectedLanguage from route state
  Updates after first user message based on what they actually spoke

systemPrompt: string
  Built once on mount using buildSystemPrompt()
  Never changes during conversation
```

### 4.4 On Component Mount — Sequence

```
Step 1:
Build systemPrompt using buildSystemPrompt([], selectedLanguage)
Note: no detected symptoms yet at mount time —
Gemini will ask about them in conversation

Step 2:
Set isThinking = true

Step 3:
Call chatWithGemini with:
  conversationHistory: [
    {
      role: 'user',
      parts: [{ 
        text: 'Start the conversation. Greet the patient warmly 
               and ask them what problem they are facing today. 
               Speak in ${selectedLanguage} language.' 
      }]
    }
  ]
  systemPrompt: systemPrompt

Step 4:
Receive Gemini's greeting + first question

Step 5:
Add Gemini response to:
  - messages array as role: 'ai'
  - conversationHistory as role: 'model'

Step 6:
Set isThinking = false
Input bar becomes active
```

### 4.5 When User Sends a Message

Triggered by: send button tap, Enter key, or voice auto-send

```
Step 1:
If inputText is empty → do nothing, return

Step 2:
Create message object:
{
  id: Date.now().toString(),
  role: 'user',
  text: inputText.trim(),
  timestamp: new Date()
}

Step 3:
Add to messages array (shows as right bubble immediately)

Step 4:
Add to conversationHistory:
{ role: 'user', parts: [{ text: inputText.trim() }] }

Step 5:
Clear inputText

Step 6:
Set isThinking = true

Step 7:
Increment exchangeCount

Step 8:
Call chatWithGemini(conversationHistory, systemPrompt)

Step 9:
Receive response text

Step 10:
Check: does response include '[ASSESSMENT_READY]'?

  IF YES:
    Clean text: remove '[ASSESSMENT_READY]' from string
    Add cleaned text to messages as role: 'ai'
    Add original response to conversationHistory as role: 'model'
    Set isThinking = false
    Set isComplete = true
    After 1500ms delay: call handleExtractionAndTriage()

  IF NO:
    Add response to messages as role: 'ai'
    Add to conversationHistory as role: 'model'
    Set isThinking = false
    Re-enable input

Step 11:
Auto-scroll chat to bottom

Safety check after Step 7:
If exchangeCount >= 5 and isComplete is still false:
  Manually trigger [ASSESSMENT_READY] flow
  Do not wait for Gemini to send it
```

### 4.6 handleExtractionAndTriage Function

```
Step 1:
Set isExtracting = true
Show full-screen loading overlay

Step 2:
Call extractSymptomData(conversationHistory)
Returns: extractedData object

Step 3:
Call backend API: POST /triage/assess
Body:
{
  symptoms: extractedData.symptoms,
  answers: {
    duration: extractedData.duration_days,
    severity: extractedData.severity,
    has_danger_signs: extractedData.has_danger_signs,
    patient_age_group: extractedData.patient_age_group
  },
  age: patientAge,
  gender: patientGender,
  village: village,
  block: block,
  district: district,
  assessed_by: userId or null,
  patient_name: patientName or null,
  conversation_summary: extractedData.conversation_summary
}

Step 4:
Receive triage result from backend:
{
  assessment_id: string,
  triage_level: 'RED'|'YELLOW'|'GREEN',
  reason: string,
  action: string,
  self_care: string[],
  warning_signs: string[],
  follow_up_due: string
}

Step 5:
Call GET /facilities/nearest with:
lat, lng (from GPS if available, or null),
triage_level, district

Step 6:
Navigate to /user/result:
navigate('/user/result', {
  state: {
    triageResult: triageResult,
    facility: nearestFacility,
    assessmentId: assessment_id,
    lang: detectedLanguage
  }
})
```

---

## 5. Modified File — AssessPatient.jsx (ASHA)

### 5.1 What Changes

The ASHA assess flow has two phases:
- Phase 1: Patient Details form (stays exactly as-is)
- Phase 2: Symptom assessment (CHANGES — replaces MCQ with chatbot)

### 5.2 What Gets Removed

Remove from AssessPatient.jsx:
- All MCQ / option button question cards
- Any FollowUpQuestions import or reference
- Any hardcoded question arrays

### 5.3 What Gets Added

After ASHA submits patient details (name, age, gender, village):

Show the same chatbot interface as SymptomInput.jsx

Differences from patient flow:
- `assessed_by` = ashaWorker.id (passed to triage API)
- `patient_name` = name entered by ASHA
- Show "Skip / Enter manually" ghost link below chat window

### 5.4 Skip / Enter Manually Fallback

Position: Below the chat window, above the input bar

Text: "Skip conversation — enter summary manually"
Style: Ghost link, 12px, #6B7280, underlined, centered

On tap:
- Hide chatbot interface
- Show simple textarea:
  - Placeholder: "Briefly describe the patient's symptoms..."
  - 4 rows
  - Full width
  - Standard input style from design system
- Show "Submit →" primary button below textarea
- On submit: call triage API with:
  - symptoms: [] (empty, backend handles gracefully)
  - conversation_summary: textarea content
  - All patient details

### 5.5 Triage Flow After Chat

Same as patient flow (Section 4.6) with these differences:
- `assessed_by` = asha worker UUID
- After result: show "Save to Patient List" button
- Navigate to /asha/dashboard (not /user/result)
  OR stay on result page with "Back to Dashboard" button

---

## 6. Modified File — App.jsx

### 6.1 Route to Remove

```
REMOVE this route:
<Route path="/user/questions" element={<FollowUpQuestions />} />

REMOVE this import:
import FollowUpQuestions from './pages/user/FollowUpQuestions'
```

### 6.2 No New Routes Needed

SymptomInput.jsx handles everything internally.
No new route required.

### 6.3 Route That Changes Navigation Target

SymptomInput.jsx now navigates directly to:
`/user/result`

Previously it navigated to `/user/questions`

No route change needed — `/user/result` already exists.

---

## 7. Backend Change

### 7.1 Supabase Table Change

Add one column to `assessments` table:

```sql
alter table assessments 
add column conversation_summary text;
```

This column is:
- nullable (not required)
- text type
- No constraints

### 7.2 FastAPI Schema Change

In `backend/models/schemas.py`:

In the TriageRequest schema, add:
```
conversation_summary: Optional[str] = None
```

### 7.3 FastAPI Route Change

In `backend/routes/triage.py`:

In the `/triage/assess` endpoint, when saving to Supabase:

Add to the insert object:
```
"conversation_summary": req.conversation_summary
```

No other backend logic changes.
Rule engine is unchanged.
Triage levels are unchanged.
Everything else is unchanged.

---

## 8. Gemini API Specification

### 8.1 Endpoint

```
POST https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=AIzaSyDLdE5lf6HVnCUN5DgUv_u0ln7Ez_-f2c0
```

### 8.2 Headers

```
Content-Type: application/json
```

No Authorization header needed (key is in URL).

### 8.3 Request Body

```json
{
  "system_instruction": {
    "parts": [
      { "text": "SYSTEM PROMPT STRING HERE" }
    ]
  },
  "contents": [
    { "role": "user", "parts": [{ "text": "first user message" }] },
    { "role": "model", "parts": [{ "text": "first AI response" }] },
    { "role": "user", "parts": [{ "text": "second user message" }] }
  ],
  "generationConfig": {
    "temperature": 0.7,
    "maxOutputTokens": 200
  }
}
```

Temperature 0.7: balanced between consistent and natural
maxOutputTokens 200: forces short responses (1-2 sentences max)

### 8.4 Response Structure

```json
{
  "candidates": [
    {
      "content": {
        "parts": [
          { "text": "GEMINI RESPONSE TEXT HERE" }
        ],
        "role": "model"
      }
    }
  ]
}
```

Extract: `response.candidates[0].content.parts[0].text`

### 8.5 Multi-Turn Conversation Rule

EVERY call to Gemini must include the FULL conversation history.
Gemini has no memory between calls.
The `contents` array grows with every exchange.
Never send just the latest message — always send everything.

---

## 9. System Prompt Specification

### 9.1 buildSystemPrompt Function

Location: inside `SymptomInput.jsx` (not in gemini.js)

Parameters:
- `selectedLanguage`: string (hi / gu / mr / ta / en)

Returns: string (the full system prompt)

### 9.2 Full System Prompt Text

```
You are a warm, gentle health assistant helping rural patients 
in India understand their symptoms.

You are speaking with a patient or their family member 
through a mobile health application called Margdarshak.

LANGUAGE RULE — THIS IS THE MOST IMPORTANT RULE:
Detect the language the user is speaking or writing in.
After the first user message, respond ONLY in that language.
Never mix languages in a single response.
- If user speaks/writes in Hindi → ALL responses in Hindi
- If user speaks/writes in Gujarati → ALL responses in Gujarati
- If user speaks/writes in Marathi → ALL responses in Marathi
- If user speaks/writes in Tamil → ALL responses in Tamil
- If user speaks/writes in English → ALL responses in English
Default language for your first message: [SELECTED_LANGUAGE_NAME]
Use the most simple, everyday words in that language.
Avoid all medical terminology.
Speak like a caring village elder or health worker, not a doctor.

YOUR GOAL:
Have a short, natural conversation to understand 
what health problem the patient is experiencing.
Ask ONE question at a time.
Maximum 5 questions total across the entire conversation.
Each of your messages must be 1-2 sentences only. Never more.

WHAT TO FIND OUT (ask only what is relevant):
- What is their main problem or symptom today?
- How many days have they had this problem?
- Is it getting better, staying same, or getting worse?
- How bad is it on a scale — mild, moderate, or very severe?
- Are there any other symptoms along with the main one?
- Is the patient a child, adult, or elderly person?
- Any danger signs present? (severe chest pain, 
  cannot breathe, unconscious, seizures, blood)

TONE AND STYLE:
Warm, calm, reassuring. Never alarming.
Never suggest a diagnosis.
Never name a disease.
Never recommend a specific medicine.
Never say anything that would cause fear or panic.

GOOD EXAMPLE MESSAGES:
"बुखार कितने दिनों से है?"
"ક્યારથી આ તકલીફ છે?"
"Is the pain mild or very severe?"
"வேறு ஏதாவது அறிகுறிகள் இருக்கிறதா?"

BAD EXAMPLE MESSAGES:
"Please describe the duration and intensity of your febrile episodes."
"This could be a serious cardiac condition."
"You should take paracetamol 500mg."

WHEN TO END THE CONVERSATION:
After 4 to 5 exchanges, or whenever you have gathered 
enough information to understand the patient's condition,
end the conversation by responding with your final 
reassuring message followed immediately by [ASSESSMENT_READY]

The [ASSESSMENT_READY] tag must be at the very end of your message.
Do not explain what [ASSESSMENT_READY] means.
The patient will not see this tag — the app removes it automatically.

ENDING MESSAGE EXAMPLES:

In Hindi:
"शुक्रिया, आपने सब बताया। मैं अभी देखता हूँ आपको क्या करना चाहिए। [ASSESSMENT_READY]"

In Gujarati:
"આભાર, મને હવે પૂરતી જાણકારી મળી ગઈ. ચાલો જોઈએ આગળ શું કરવું. [ASSESSMENT_READY]"

In Marathi:
"धन्यवाद, मला आता पुरेशी माहिती मिळाली. आता मी पाहतो काय करायचे. [ASSESSMENT_READY]"

In Tamil:
"நன்றி, எனக்கு இப்போது போதுமான தகவல் கிடைத்தது. என்ன செய்ய வேண்டும் என்று பார்க்கிறேன். [ASSESSMENT_READY]"

In English:
"Thank you for sharing. I now have enough information. Let me check what you should do. [ASSESSMENT_READY]"
```

Replace `[SELECTED_LANGUAGE_NAME]` dynamically with:
- hi → "Hindi"
- gu → "Gujarati"
- mr → "Marathi"
- ta → "Tamil"
- en → "English"

---

## 10. Conversation Logic & State

### 10.1 Full Conversation Flow Diagram

```
Component Mounts
        ↓
Build systemPrompt
Set isThinking = true
        ↓
Call chatWithGemini:
  history: [internal greeting trigger message]
  system: systemPrompt
        ↓
Receive Gemini's greeting + first question
Add to messages as role:'ai'
Add to conversationHistory as role:'model'
Set isThinking = false
        ↓
User sees greeting bubble
Input bar becomes active
        ↓
User speaks (mic) or types (keyboard)
        ↓
Text captured → show in input field
User taps send OR voice auto-sends
        ↓
Add user message to messages (right bubble)
Add to conversationHistory as role:'user'
Set isThinking = true
Show typing indicator
exchangeCount++
        ↓
Call chatWithGemini(fullHistory, systemPrompt)
        ↓
Receive Gemini response
        ↓
Does response contain '[ASSESSMENT_READY]'?
        ↓
    NO                          YES
     ↓                           ↓
Add to messages              Clean text
as role:'ai'                 Add cleaned to messages
Set isThinking=false         Set isComplete=true
Re-enable input              Wait 1500ms
Loop continues               Call handleExtractionAndTriage()
        ↓                           ↓
                          Set isExtracting=true
                          Show loading overlay
                                ↓
                          Call extractSymptomData(history)
                          Returns JSON object
                                ↓
                          Call POST /triage/assess
                          Returns triage result
                                ↓
                          Call GET /facilities/nearest
                          Returns nearest facility
                                ↓
                          navigate('/user/result', {state: ...})
```

### 10.2 Safety Cap — Force End at 5 Exchanges

After every user message send:
```
if (exchangeCount >= 5 && !isComplete) {
  // Force extraction even if Gemini hasn't said [ASSESSMENT_READY]
  setIsComplete(true)
  setTimeout(() => handleExtractionAndTriage(), 1500)
}
```

### 10.3 conversationHistory Array Structure

This is what gets sent to Gemini on every call.
It grows with each exchange.

Example after 2 exchanges:
```
[
  {
    role: 'user',
    parts: [{ text: 'Start the conversation. Greet the patient...' }]
  },
  {
    role: 'model',
    parts: [{ text: 'नमस्ते! आज आपको क्या तकलीफ है?' }]
  },
  {
    role: 'user',
    parts: [{ text: 'मुझे बुखार है' }]
  },
  {
    role: 'model',
    parts: [{ text: 'बुखार कितने दिनों से है?' }]
  },
  {
    role: 'user',
    parts: [{ text: 'दो दिन से' }]
  }
]
```

---

## 11. Visual Design — Chat Interface

### 11.1 Page Layout

```
┌─────────────────────────────────┐
│ ← Back    Step 3 of 4  ●●○○    │  ← Top bar (unchanged from PRD)
├─────────────────────────────────┤
│ Talking with Health Assistant   │  ← Page title (new subtitle)
│ स्वास्थ्य सहायक से बात         │  ← Translated subtitle
│                      [हिंदी]   │  ← Language pill (top right)
├─────────────────────────────────┤
│                                 │
│  🏥 नमस्ते! आज क्या तकलीफ     │  ← AI bubble (left)
│     है?                         │
│     9:41 AM                     │
│                                 │
│              मुझे बुखार है  ●  │  ← User bubble (right)
│                        9:42 AM  │
│                                 │
│  🏥 बुखार कितने दिनों से है?   │  ← AI bubble
│     9:42 AM                     │
│                                 │
│         ● ● ●                   │  ← Typing indicator (animated)
│                                 │
├─────────────────────────────────┤
│  Question 2 of 5  ● ● ○ ○ ○    │  ← Progress (above input)
├─────────────────────────────────┤
│ 🎤  Type or speak...    [  →  ] │  ← Input bar (sticky bottom)
└─────────────────────────────────┘
```

### 11.2 Chat Window Specifications

```
Height: calc(100vh - topBar - pageTitle - progress - inputBar)
Approximately 55-60% of screen height
Background: #F0F4FF
Border radius: 16px
Padding: 12px
Overflow-y: scroll
Scroll behavior: smooth
```

### 11.3 AI Message Bubble

```
Alignment: left
Max width: 80% of chat window width
Margin bottom: 12px
Display: flex, align-items: flex-start, gap: 8px

Avatar:
  Width: 28px, height: 28px
  Border radius: 9999px
  Background: #EAF2FF
  Content: 🏥 emoji, centered, 14px

Bubble:
  Background: #FFFFFF
  Border: 1px solid #E5E7EB
  Border radius: 4px 16px 16px 16px
  Padding: 12px 16px
  Shadow: 0 1px 3px rgba(11,31,58,0.06)

Text:
  Color: #0B1F3A
  Font size: 15px
  Line height: 1.5
  Font family: Inter

Timestamp:
  Font size: 11px
  Color: #9CA3AF
  Margin top: 4px
  Padding left: 36px (aligns below bubble, not avatar)
```

### 11.4 User Message Bubble

```
Alignment: right
Max width: 80% of chat window width
Margin bottom: 12px
Display: flex, flex-direction: column, align-items: flex-end

Bubble:
  Background: linear-gradient(135deg, #2F6BFF, #6EA8FF)
  Border radius: 16px 4px 16px 16px
  Padding: 12px 16px
  Shadow: 0 4px 12px rgba(47,107,255,0.25)

Text:
  Color: #FFFFFF
  Font size: 15px
  Line height: 1.5
  Font family: Inter

Timestamp:
  Font size: 11px
  Color: rgba(255,255,255,0.6)
  Margin top: 4px
  Text align: right
```

### 11.5 Typing Indicator Bubble

Appears while isThinking = true

```
Same position and style as AI bubble
Bubble content: three dots animation

Three dots:
  Each dot: 8px × 8px circle, background #CBD5E1
  Gap between dots: 4px
  Animation: bounce (translateY -4px → 0)
  Each dot has staggered delay: 0s, 0.15s, 0.30s
  Animation duration: 0.6s infinite
```

### 11.6 Language Pill

```
Position: top right of chat window
Display: inline-flex, align-items: center

Style:
  Background: rgba(47,107,255,0.08)
  Border: 1px solid rgba(47,107,255,0.2)
  Border radius: 9999px
  Padding: 3px 10px
  Font size: 11px
  Font weight: 500
  Color: #2F6BFF
  Font family: DM Mono

Content: language name in that language
  hi → "हिंदी"
  gu → "ગુજરાતી"
  mr → "मराठी"
  ta → "தமிழ்"
  en → "English"

Updates automatically when detectedLanguage changes
```

### 11.7 Progress Indicator

```
Position: between chat window and input bar

Layout: flex, align-items: center, justify-content: center, gap: 8px

Text: "Question [exchangeCount] of 5"
  Font size: 11px
  Color: #6B7280
  Font family: DM Mono

Dots: 5 dots
  Each dot: 6px × 6px circle
  Filled (●): background #2F6BFF
  Empty (○): background #E5E7EB, border 1px solid #CBD5E1
  Gap: 4px
  Filled count = exchangeCount
```

### 11.8 Input Bar

```
Position: sticky, bottom: 0
Background: #FFFFFF
Border top: 1px solid #E5E7EB
Padding: 12px 16px
Display: flex, align-items: center, gap: 10px
Safe area: padding-bottom includes env(safe-area-inset-bottom)

Microphone Button:
  Width: 44px, height: 44px
  Border radius: 9999px
  Background: #EAF2FF
  Icon: microphone SVG, color #2F6BFF, size 20px
  Border: none
  Shadow: none

  Recording state:
    Background: #FEE2E2
    Icon color: #EF4444
    Animation: box-shadow pulse
      0 0 0 0 rgba(239,68,68,0.4) → 0 0 0 8px transparent
      1s infinite

Text Input:
  Flex: 1
  Height: 44px
  Border: 1.5px solid #E5E7EB
  Border radius: 22px
  Padding: 0 16px
  Font size: 15px
  Color: #0B1F3A
  Background: #F8FAFF
  Outline: none
  
  Placeholder: "Type or speak..." (translated)
  
  Listening state placeholder: "Listening..." (translated)
  
  Focus state:
    Border color: #2F6BFF
    Box shadow: 0 0 0 3px rgba(47,107,255,0.12)

Send Button:
  Width: 44px, height: 44px
  Border radius: 9999px
  Background: linear-gradient(135deg, #2F6BFF, #6EA8FF)
  Icon: arrow-right SVG, color white, size 20px
  Border: none
  Shadow: 0 4px 12px rgba(47,107,255,0.3)
  
  Disabled state (when isThinking or inputText empty):
    Background: #E5E7EB
    Icon color: #9CA3AF
    Shadow: none
    Cursor: not-allowed
```

### 11.9 Loading Overlay (during extraction)

```
Position: fixed, covers entire screen
z-index: 50
Background: rgba(255,255,255,0.92)
Backdrop filter: blur(4px)
Display: flex, flex-direction: column, align-items: center, justify-content: center
Gap: 20px

Spinner:
  Width: 48px, height: 48px
  Border: 3px solid #EAF2FF
  Border top color: #2F6BFF
  Border radius: 9999px
  Animation: spin 0.8s linear infinite

Text line 1: "Analyzing your symptoms..."
  Font size: 18px, weight 600, color #0B1F3A

Text line 2: (translated to detected language)
  Font size: 14px, color #6B7280

Both text lines also shown in detected language below
```

---

## 12. Voice Input Integration

### 12.1 Web Speech API Setup

```
const SpeechRecognition = 
  window.SpeechRecognition || window.webkitSpeechRecognition

Check on mount:
if (!SpeechRecognition) {
  setVoiceAvailable(false)
  // Hide mic button, show only text input
}
```

### 12.2 Language Code Mapping

```
hi → hi-IN
gu → gu-IN
mr → mr-IN
ta → ta-IN
en → en-IN
```

### 12.3 Recognition Configuration

```
recognition.continuous = false
recognition.interimResults = true
recognition.lang = languageCode (from mapping above)
recognition.maxAlternatives = 1
```

### 12.4 Event Handlers

```
onresult:
  Get transcript from event.results
  If interim: update inputText (show in real-time)
  If final: set inputText = finalTranscript, call sendMessage()

onerror:
  If error = 'no-speech': show toast "No speech detected. Tap mic to try again."
  If error = 'not-allowed': show toast "Microphone permission required."
  Set isListening = false

onend:
  Set isListening = false
  Mic button returns to idle state
```

### 12.5 Mic Button Tap Behavior

```
If isListening = false:
  Call recognition.start()
  Set isListening = true

If isListening = true:
  Call recognition.stop()
  Set isListening = false
  (onend fires, sends any captured text)
```

### 12.6 Auto-Send on Speech End

When `onresult` fires with `isFinal = true`:
Automatically call `sendMessage()` with the transcript.
Do NOT require user to tap send button after speaking.
This is critical for rural users — one tap to speak, auto-sends.

### 12.7 Language Auto-Update

After first user message is sent:
- Check what language the user actually wrote/spoke in
- Update `detectedLanguage` state
- Update `recognition.lang` for subsequent recordings
- Update language pill display
- This happens silently — user does not need to do anything

---

## 13. Triage Extraction Flow

### 13.1 Extraction Prompt Sent to Gemini

Appended to conversationHistory as final user message:

```
Based on our conversation above, extract ONLY a JSON object 
with these exact fields. 
Return ONLY the JSON. No explanation. No markdown code blocks. 
No backticks. Just the raw JSON object.

{
  "symptoms": ["array of symptom strings in English"],
  "duration_days": number_or_null,
  "severity": "mild_or_moderate_or_severe",
  "additional_symptoms": ["any extra symptoms mentioned"],
  "has_danger_signs": true_or_false,
  "patient_age_group": "child_or_adult_or_elderly",
  "conversation_summary": "one sentence in English"
}

Rules:
- symptoms: translate to English if needed
- duration_days: integer if mentioned, null if not
- severity: must be exactly "mild", "moderate", or "severe"
- has_danger_signs: true only if chest pain, unconsciousness, 
  seizures, severe breathlessness, or blood mentioned
- patient_age_group: "child" under 12, "elderly" over 60, 
  "adult" for all others
- conversation_summary: one English sentence summarizing the case
```

### 13.2 JSON Cleaning Before Parse

```
let cleaned = geminiResponse
  .replace(/```json/g, '')
  .replace(/```/g, '')
  .trim()

const data = JSON.parse(cleaned)
```

### 13.3 Fallback on Parse Failure

If JSON.parse fails:
1. Retry once with more explicit prompt:
   "Return ONLY this JSON, nothing else: {...}"
2. If second attempt also fails:
   Use fallback object:
   ```
   {
     symptoms: ['general illness'],
     duration_days: null,
     severity: 'moderate',
     additional_symptoms: [],
     has_danger_signs: false,
     patient_age_group: 'adult',
     conversation_summary: 'Patient reported symptoms via conversation'
   }
   ```
3. Show no error to user — proceed silently with fallback

---

## 14. Language Detection & Switching

### 14.1 Initial Language

On component mount:
`detectedLanguage = selectedLanguage` from route state

### 14.2 After First User Message

When user sends first message:
- Pass user's text to Gemini in context
- Gemini will naturally respond in the language it detects
- Frontend updates `detectedLanguage` based on what Gemini actually responds in

Simple detection method:
Check first character of Gemini response:
```
If response contains Devanagari characters (Unicode block 0900-097F)
  → could be Hindi or Marathi
  → keep as selectedLanguage (already set)
If response contains Gujarati characters (0A80-0AFF) → 'gu'
If response contains Tamil characters (0B80-0BFF) → 'ta'
If response is ASCII only → 'en'
```

Update `recognition.lang` and language pill accordingly.

### 14.3 Language Pill Update

Updates visually within 500ms of Gemini response arriving.
Smooth transition: opacity 0 → 1 on language text change.

---

## 15. Error Handling

### 15.1 Gemini API Errors

| Error | User-Facing Message | Action |
|---|---|---|
| Network timeout | "Connection slow. Please wait..." | Retry once automatically |
| 429 Rate limit | "Too many requests. Wait a moment." | Wait 2s, retry once |
| 500 Server error | "Something went wrong. Try again." | Show retry button in chat |
| Network offline | "No internet connection." | Show offline banner |

All errors shown as:
- Red-tinted message bubble in chat (left-aligned, AI bubble style but red tint)
- Small retry button inside the bubble

### 15.2 Retry Button in Chat

When Gemini call fails:
Show AI bubble with:
```
Text: "Something went wrong. [Tap to retry]"
"[Tap to retry]" is a button inside the bubble
Tapping it re-sends the last user message to Gemini
```

### 15.3 Triage API Errors

If /triage/assess fails:
- Show error on loading overlay
- "Assessment failed. Please try again."
- Retry button: re-calls handleExtractionAndTriage()
- If fails twice: show "Please visit your nearest PHC" 
  with facility card using last known location

### 15.4 Microphone Permission Denied

Show toast notification:
"Microphone access denied. Please type your response instead."

Hide mic button for rest of session.
Text input remains fully functional.

---

## 16. Edge Cases

### 16.1 User Types in Different Language Than Selected

Example: User selected Hindi but types in English.

Gemini will detect and respond in English.
`detectedLanguage` updates to 'en'.
`recognition.lang` updates to 'en-IN'.
Language pill updates to "English".
No user action required — fully automatic.

### 16.2 Very Short User Responses

Example: User says "हाँ" (yes) or just "2 दिन"

Gemini handles this naturally — it will ask for clarification 
if needed, or accept it and move to next question.
No special frontend handling needed.

### 16.3 User Goes Silent (No Input for 60 Seconds)

After 60 seconds with no user input:
Show subtle prompt below input bar:
"Still there? Tap the mic or type your answer."
Font size: 12px, color: #9CA3AF, centered
Disappears when user interacts.

### 16.4 Very Long User Message

If user types more than 300 characters:
Show character warning: "300+" in red below input
Still send — no block.
Gemini handles long context fine.

### 16.5 User Tries to Navigate Back Mid-Conversation

If user taps back button during conversation:

Show confirmation dialog:
"Leave conversation? Your symptom check will be lost."
Two buttons: "Leave" (ghost) | "Continue" (primary)

If Leave: navigate back to /user/patient-info
If Continue: dismiss dialog, stay on page

### 16.6 exchangeCount Exceeds 5

Force extraction flow.
Do not wait for Gemini to say [ASSESSMENT_READY].
Pass whatever conversation exists to extractSymptomData.
Proceed to triage normally.

### 16.7 Gemini Responds in Wrong Language

Can happen rarely if initial prompt is misunderstood.

If response language does not match any Indian language 
or English: show the response as-is.
On next user message, remind Gemini in system context.
No user-visible error.

---

## Summary

```
ONE CHANGE. FOCUSED. CLEAR.

SymptomInput.jsx goes from:
  "Speak or type your symptom once"
to:
  "Have a natural WhatsApp-style conversation 
   with an AI that speaks your language"

Everything else in the app stays exactly the same.
The triage engine stays the same.
The result page stays the same.
Only the INPUT METHOD changes.

Files to create: 1 (gemini.js)
Files to modify: 3 (SymptomInput, AssessPatient, App)
Files to delete: 1 (FollowUpQuestions)
Backend changes: 2 lines (one column, one field)
```

---

*Margdarshak Chatbot PRD v2.0 — Addendum to Main PRD v1.0*