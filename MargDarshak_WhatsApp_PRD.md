# MargDarshak — WhatsApp Healthcare Bot Integration PRD

> **Product Requirements Document for Kiro Replication**

---

## Project Info

| Field | Details |
|---|---|
| Project Name | MargDarshak — AI Healthcare Chatbot on WhatsApp |
| Project Path | `C:\Users\Divya\OneDrive\Desktop\MargDarshak\backend` |
| Version | 1.0.0 |
| Date | March 2026 |
| Backend | FastAPI (Python) — uvicorn server |
| AI Engine | Groq API — LLaMA 3 8B (Free) |
| Messaging | Twilio WhatsApp Sandbox (Free) |
| Translation | googletrans 4.0.0rc1 (Free) |
| Database | SQLite — margdarshak.db |
| Languages | Hindi, Gujarati, Marathi, Tamil, English |
| Total Cost | Rs. 0 — Fully Free Stack |

---

## 1. Project Overview

MargDarshak is a multilingual AI-powered symptom checker that works on WhatsApp. It classifies health urgency into Emergency, Clinic Visit, or Self-Care and replies in the user's regional language.

The project already has a FastAPI backend with modular folders for `auth`, `database`, `engine`, `models`, and `routes`. This PRD defines exactly how the WhatsApp integration must be wired into that existing structure — telling Kiro exactly which files to **create**, which to **modify**, and which to **leave untouched**.

---

## 2. Existing Folder Structure (from VS Code)

```
C:\Users\Divya\OneDrive\Desktop\MargDarshak\
└── backend\
    ├── .vscode\
    │   └── settings.json
    ├── auth\
    │   ├── __init__.py
    │   └── dependencies.py
    ├── database\
    │   ├── __init__.py
    │   ├── db.py
    │   └── seed.py
    ├── engine\
    │   ├── __init__.py
    │   ├── rule_engine.py          <- triage classification logic
    │   └── symptom_keywords.py     <- emergency & clinic keyword lists
    ├── models\
    │   ├── __init__.py
    │   └── schemas.py
    ├── node_modules\
    ├── routes\
    │   └── __init__.py
    ├── venv\
    │   └── Scripts\  (fastapi.exe, uvicorn.exe, pip.exe, python.exe ...)
    ├── .env                        <- API keys
    ├── .gitignore
    ├── database.md
    ├── engine.md
    ├── main.py                     <- FastAPI entry point
    ├── margdarshak.db              <- SQLite database
    ├── models.md
    ├── package.json
    ├── requirements.txt
    ├── routes.md
    ├── sarvamai.md
    ├── services.md
    ├── setup.md
    ├── start.bat                   <- Windows startup script
    ├── start.sh                    <- Mac/Linux startup script
    └── test_engine.py              <- unit tests
```

---

## 3. New Files to Add for WhatsApp Integration

Kiro must **ADD** the following files. Do **NOT** delete or modify any existing files except where noted.

```
backend\                               (EXISTING — do not touch)
├── routes\
│   ├── __init__.py                    (EXISTING — add whatsapp import here)
│   └── whatsapp.py                    (NEW — Twilio webhook endpoint)
├── services\                          (NEW folder — create it)
│   ├── __init__.py                    (NEW — empty file)
│   ├── translator.py                  (NEW — language detect + translate)
│   ├── groq_ai.py                     (NEW — Groq API call)
│   └── response_builder.py            (NEW — combine triage + AI reply)
├── .env                               (EXISTING — add GROQ_API_KEY)
└── requirements.txt                   (EXISTING — add new packages)
```

---

## 4. File-by-File Specification

### 4.1 `main.py` — EXISTING FILE, Small Edit

**Add at the top:**

```python
from routes.whatsapp import router as whatsapp_router
```

**Add after `app = FastAPI()`:**

```python
app.include_router(whatsapp_router)
```

---

### 4.2 `routes/whatsapp.py` — NEW FILE

```python
from fastapi import APIRouter, Request
from fastapi.responses import Response
from twilio.twiml.messaging_response import MessagingResponse
from engine.rule_engine import classify_urgency, get_triage_message
from services.translator import detect_and_translate
from services.groq_ai import get_ai_response
from services.response_builder import build_reply

router = APIRouter()
chat_histories = {}

SYSTEM_PROMPT = '''You are a rural healthcare assistant in India helping ASHA workers.
Keep replies SHORT and SIMPLE. Never diagnose a disease.
Always recommend 108 for emergencies.
Reply in the same language the user writes in.'''

@router.post('/webhook')
async def webhook(request: Request):
    form = await request.form()
    incoming_msg = form.get('Body', '').strip()
    sender = form.get('From', '')
    if sender not in chat_histories:
        chat_histories[sender] = [{'role': 'system', 'content': SYSTEM_PROMPT}]
    english_text, user_lang = detect_and_translate(incoming_msg)
    urgency = classify_urgency(english_text)
    triage_msg = get_triage_message(urgency)
    chat_histories[sender].append({'role': 'user', 'content': english_text})
    ai_reply = get_ai_response(chat_histories[sender])
    chat_histories[sender].append({'role': 'assistant', 'content': ai_reply})
    final_reply = build_reply(triage_msg, ai_reply, user_lang)
    resp = MessagingResponse()
    resp.message(final_reply)
    return Response(content=str(resp), media_type='application/xml')
```

---

### 4.3 `engine/rule_engine.py` — EXISTING FILE, Verify Contents

Ensure these two functions exist. Add them if missing:

```python
from engine.symptom_keywords import EMERGENCY_KEYWORDS, CLINIC_KEYWORDS

def classify_urgency(text: str) -> str:
    text_lower = text.lower()
    for kw in EMERGENCY_KEYWORDS:
        if kw in text_lower:
            return 'EMERGENCY'
    for kw in CLINIC_KEYWORDS:
        if kw in text_lower:
            return 'CLINIC'
    return 'SELFCARE'

def get_triage_message(urgency: str) -> str:
    if urgency == 'EMERGENCY':
        return (
            '🚨 EMERGENCY: Your symptoms may be life-threatening.\n\n'
            '➡ Call 108 (Ambulance) immediately.\n'
            '➡ Call 112 (Police/Fire/Medical)\n'
            '➡ Go to nearest Government Hospital NOW.\n'
            'Do NOT wait or try home remedies.'
        )
    elif urgency == 'CLINIC':
        return (
            '🏥 CLINIC VISIT NEEDED\n\n'
            '➡ Visit nearest PHC within 24 hours.\n'
            '➡ Carry your Ayushman Bharat card.\n'
            '➡ PHC helpline: 104'
        )
    else:
        return (
            '🏠 SELF-CARE ADVISED\n\n'
            '➡ Rest and drink plenty of water.\n'
            '➡ Take basic medicine if needed.\n'
            '➡ If no improvement in 2 days, visit clinic.'
        )
```

---

### 4.4 `engine/symptom_keywords.py` — EXISTING FILE, Verify Contents

```python
EMERGENCY_KEYWORDS = [
    'chest pain', 'heart attack', "can't breathe", 'unconscious',
    'stroke', 'severe bleeding', 'not breathing', 'paralysis',
    'seizure', 'fits', 'poisoning', 'suicide', 'accident'
]

CLINIC_KEYWORDS = [
    'fever', 'cold', 'cough', 'vomiting', 'diarrhea', 'headache',
    'body pain', 'rash', 'infection', 'weakness', 'loose motion',
    'urine problem', 'back pain', 'ear pain', 'eye problem'
]
```

---

### 4.5 `services/translator.py` — NEW FILE

```python
from googletrans import Translator

translator = Translator()

def detect_and_translate(text: str) -> tuple:
    """Returns (english_text, detected_lang_code)"""
    try:
        detected = translator.detect(text)
        lang = detected.lang
        if lang != 'en':
            result = translator.translate(text, src=lang, dest='en')
            return result.text, lang
        return text, 'en'
    except Exception:
        return text, 'en'    # fallback to English

def translate_back(text: str, lang: str) -> str:
    """Translate reply back to user's language"""
    try:
        if lang != 'en':
            result = translator.translate(text, src='en', dest=lang)
            return result.text
        return text
    except Exception:
        return text          # fallback — return English
```

---

### 4.6 `services/groq_ai.py` — NEW FILE

```python
import os
from groq import Groq
from dotenv import load_dotenv

load_dotenv()
client = Groq(api_key=os.getenv('GROQ_API_KEY'))

def get_ai_response(messages: list) -> str:
    response = client.chat.completions.create(
        model='llama3-8b-8192',
        messages=messages,
        max_tokens=400
    )
    return response.choices[0].message.content
```

---

### 4.7 `services/response_builder.py` — NEW FILE

```python
from services.translator import translate_back

def build_reply(triage_msg: str, ai_reply: str, user_lang: str) -> str:
    full_reply = f'{triage_msg}\n\n💬 {ai_reply}'
    return translate_back(full_reply, user_lang)
```

---

## 5. `.env` File — EXISTING, Add These Keys

```env
# ADD to backend/.env
GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

---

## 6. `requirements.txt` — EXISTING, Add These Packages

```txt
twilio==8.13.0
groq==0.4.2
googletrans==4.0.0rc1
python-dotenv==1.0.0
httpx==0.24.1
```

**Install command:**

```bash
cd C:\Users\Divya\OneDrive\Desktop\MargDarshak\backend
venv\Scripts\activate
pip install twilio groq googletrans==4.0.0rc1 python-dotenv httpx==0.24.1
```

---

## 7. Complete Data Flow

```
User sends WhatsApp message (any language)
              ↓
Twilio Sandbox receives it
              ↓
POST https://xxxx.ngrok-free.app/webhook
              ↓
routes/whatsapp.py  ->  extract Body + From
              ↓
services/translator.py  ->  detect language  ->  translate to English
              ↓
engine/rule_engine.py  ->  match EMERGENCY / CLINIC / SELFCARE keywords
              ↓
engine/rule_engine.py  ->  get_triage_message()  ->  action text
              ↓
services/groq_ai.py  ->  Groq LLaMA 3  ->  contextual health advice
              ↓
services/response_builder.py  ->  combine triage + AI reply
              ↓
services/translator.py  ->  translate back to user language
              ↓
TwiML XML  ->  Twilio  ->  WhatsApp reply to patient ✅
```

---

## 8. Step-by-Step Run Instructions

### Step 1 — Get Groq API Key (Free)

- Go to **console.groq.com** → Sign Up → Verify email
- Click **API Keys** on left → Create API Key
- Copy key (looks like: `gsk_xxxxxxx...`)
- Paste in `backend/.env`: `GROQ_API_KEY=gsk_xxxxxxx...`

### Step 2 — Install New Packages

```bash
cd C:\Users\Divya\OneDrive\Desktop\MargDarshak\backend
venv\Scripts\activate
pip install twilio groq googletrans==4.0.0rc1 python-dotenv httpx==0.24.1
```

### Step 3 — Run FastAPI Server (Terminal 1)

```bash
# Double-click start.bat  OR run manually:
venv\Scripts\activate
uvicorn main:app --reload --port 8000

# Must see:
# INFO: Uvicorn running on http://127.0.0.1:8000
# INFO: Application startup complete.
# Keep this terminal OPEN — never close it.
```

### Step 4 — Run ngrok (Terminal 2)

```bash
ngrok config add-authtoken YOUR_NGROK_TOKEN_HERE   # first time only
ngrok http 8000

# You will see:
# Forwarding https://abcd-1234.ngrok-free.app -> http://localhost:8000
# Copy the https URL
```

### Step 5 — Set Webhook in Twilio

- Go to **console.twilio.com**
- Messaging → Try it out → Send a WhatsApp message
- Scroll to **Sandbox Settings**
- In **"When a message comes in"** paste: `https://abcd-1234.ngrok-free.app/webhook`
- Method: **HTTP POST** → Click **Save**

### Step 6 — Join Twilio Sandbox on Phone

- Save Twilio sandbox number in WhatsApp contacts
- Send the join code shown on screen e.g.: `join apple-mango`
- You will get: `You have joined the sandbox` ✅

### Step 7 — Test!

```
Send: 'I have chest pain'        ->  🚨 EMERGENCY reply
Send: 'mujhe bukhar hai'         ->  🏥 CLINIC reply in Hindi
Send: 'mane avaaj avti nathi'    ->  🚨 EMERGENCY reply in Gujarati
Send: 'mild cold'                ->  🏠 SELFCARE reply
```

---

## 9. API Specification

| Property | Value |
|---|---|
| Endpoint | `POST /webhook` |
| Server | FastAPI + uvicorn on port 8000 |
| Caller | Twilio (on every inbound WhatsApp message) |
| Input — Body | Message text from user (any language) |
| Input — From | Sender phone e.g. `whatsapp:+91XXXXXXXXXX` |
| Response type | `application/xml` (TwiML) |
| Response format | `<Response><Message>reply</Message></Response>` |
| Timeout | Twilio expects reply within 15 seconds |

---

## 10. Triage Classification

| Tier | Keywords (sample) | Action |
|---|---|---|
| EMERGENCY 🚨 | chest pain, heart attack, can't breathe, unconscious, stroke, severe bleeding, seizure, fits, poisoning, accident | Call 108 immediately + go to hospital NOW |
| CLINIC 🏥 | fever, cold, cough, vomiting, diarrhea, headache, body pain, rash, weakness, loose motion, back pain | Visit nearest PHC within 24 hours |
| SELFCARE 🏠 | (default — no keyword matched) | Rest, drink water, OTC medicine |

---

## 11. Language Support

| Language | Code | Sample Input |
|---|---|---|
| Hindi | `hi` | mujhe bukhar hai |
| Gujarati | `gu` | mane avaaj avti nathi |
| Marathi | `mr` | mala tap ahe |
| Tamil | `ta` | enakku kaichal irukku |
| English | `en` | I have chest pain |

---

## 12. Free Tech Stack

| Component | Tool | Cost |
|---|---|---|
| Messaging | Twilio WhatsApp Sandbox | Free (Rs.0) |
| AI Engine | Groq API — LLaMA 3 8B | Free (Rs.0) |
| Translation | googletrans 4.0.0rc1 | Free (Rs.0) |
| Backend | FastAPI + uvicorn | Free (Rs.0) |
| Tunnel | ngrok | Free (Rs.0) |
| Database | SQLite (margdarshak.db) | Free (Rs.0) |

---

## 13. Troubleshooting

| Problem | Fix |
|---|---|
| uvicorn not found | Run: `venv\Scripts\activate` then retry |
| pip install fails | Activate venv first, then: `python -m pip install ...` |
| No WhatsApp reply | Check Twilio webhook URL ends with `/webhook` and is HTTP POST |
| ngrok URL changed | Copy new URL from ngrok terminal, update Twilio Sandbox Settings |
| Groq API error | Check `GROQ_API_KEY` is in `.env` and `python-dotenv` is installed |
| Translation fails | Bot falls back to English — googletrans sometimes has issues |
| Twilio sandbox expired | Re-send join code from phone to Twilio sandbox number |
| Port 8000 busy | Change to 8001: `uvicorn main:app --port 8001` and `ngrok http 8001` |
| /webhook returns 404 | Check `main.py` has: `app.include_router(whatsapp_router)` |

---

## 14. Final Checklist for Kiro

- [ ] 1. Create `services/` folder with `__init__.py`, `translator.py`, `groq_ai.py`, `response_builder.py`
- [ ] 2. Create `routes/whatsapp.py` with `POST /webhook` endpoint
- [ ] 3. Edit `main.py` to import and include whatsapp router
- [ ] 4. Verify `engine/rule_engine.py` has `classify_urgency()` and `get_triage_message()`
- [ ] 5. Verify `engine/symptom_keywords.py` has both keyword lists
- [ ] 6. Add `GROQ_API_KEY` to `.env`
- [ ] 7. Add new packages to `requirements.txt` and run pip install
- [ ] 8. Run uvicorn on port 8000 — confirm startup complete
- [ ] 9. Run ngrok on port 8000 — copy https URL
- [ ] 10. Set Twilio Sandbox webhook: `https://xxxx.ngrok-free.app/webhook` (HTTP POST)
- [ ] 11. Join Twilio sandbox from phone
- [ ] 12. Test: `'I have chest pain'` → Emergency reply received on WhatsApp
- [ ] 13. Test in Hindi: `'mujhe bukhar hai'` → Hindi clinic reply received
- [ ] 14. Test in Gujarati: `'mane avaaj avti nathi'` → Gujarati emergency reply received

---

*— End of PRD — MargDarshak WhatsApp Integration v1.0 — Hackathon 2026 —*
