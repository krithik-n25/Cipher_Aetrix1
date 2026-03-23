# routes.md — API Route Specifications
### Margdarshak Backend (FastAPI)

---

## Base URL
```
Development:  http://localhost:8000
Production:   https://api.margdarshak.in
```

All routes are prefixed per their router mount in `main.py`.
All responses are JSON. All timestamps are ISO 8601 UTC.

---

## AUTH ROUTES — `/auth`
**File:** `backend/routes/auth.py`

---

### POST `/auth/login`
Authenticates any of the 3 roles. Returns a JWT and role info.

**Request Body:**
```json
{
  "phone": "9876543210",
  "password": "plaintext_password"
}
```

**Response `200`:**
```json
{
  "access_token": "eyJhbGci...",
  "token_type": "bearer",
  "role": "asha",
  "user_id": "uuid",
  "name": "Sunita Kamble",
  "district": "Beed",
  "block": "Gevrai",
  "language": "mr"
}
```

**Response `401`:**
```json
{ "detail": "Invalid credentials" }
```

**Notes:**
- Passwords are verified against `password_hash` in `users` table
- JWT payload includes: `user_id`, `role`, `district`, `exp`
- Token expiry: 7 days
- No refresh token needed for hackathon scope

---

### POST `/auth/register`
Creates a new user account (used by admin to onboard ASHA workers).

**Request Body:**
```json
{
  "name": "Rekha Pawar",
  "phone": "9876543212",
  "password": "set_by_admin",
  "role": "asha",
  "village": "Ashti",
  "block": "Ashti",
  "district": "Beed",
  "asha_id": "ASHA-BED-002",
  "language": "mr"
}
```

**Response `201`:**
```json
{
  "user_id": "uuid",
  "message": "Account created successfully"
}
```

**Auth required:** Admin JWT only

---

### GET `/auth/me`
Returns current logged-in user's profile from JWT.

**Headers:** `Authorization: Bearer <token>`

**Response `200`:**
```json
{
  "id": "uuid",
  "name": "Sunita Kamble",
  "role": "asha",
  "phone": "9876543211",
  "village": "Gevrai",
  "block": "Gevrai",
  "district": "Beed",
  "language": "mr",
  "asha_id": "ASHA-BED-001"
}
```

---

## TRIAGE ROUTES — `/triage`
**File:** `backend/routes/triage.py`

This is the core of the product. Two endpoints work in sequence.

---

### POST `/triage/extract-symptoms`
Step 1 of the triage flow. Takes raw symptom text, translates to English,
extracts structured symptoms, returns follow-up questions translated back.

**Request Body:**
```json
{
  "text": "मुझे तीन दिनों से बुखार है और सिरदर्द भी है",
  "language": "hi",
  "patient_age": 34,
  "patient_gender": "male",
  "session_id": "optional_anon_session"
}
```

**Processing chain (internal):**
```
raw text
  → LibreTranslate: hi → en
  → symptom_keywords.py: extract symptom list
  → follow_up_questions.py: get relevant questions
  → LibreTranslate: questions en → hi
  → return to frontend
```

**Response `200`:**
```json
{
  "detected_symptoms": ["fever", "headache"],
  "confirmation_text": "I understood: fever, headache. Is this correct?",
  "confirmation_text_translated": "मैंने समझा: बुखार, सिरदर्द। क्या यह सही है?",
  "follow_up_questions": [
    {
      "id": "q1",
      "question_en": "How many days have you had fever?",
      "question_translated": "आपको कितने दिनों से बुखार है?",
      "type": "options",
      "options_translated": ["1 दिन", "2-3 दिन", "4+ दिन"]
    },
    {
      "id": "q2",
      "question_en": "Is the patient under 5 years old?",
      "question_translated": "क्या मरीज 5 साल से कम उम्र का है?",
      "type": "yes_no"
    }
  ]
}
```

**Response `422`:** If text is empty or language not supported.

---

### POST `/triage/assess`
Step 2. Receives symptoms + follow-up answers, runs rule engine,
saves to Supabase, triggers outbreak check, returns result + facility.

**Request Body:**
```json
{
  "session_id": "anon_session_or_null",
  "assessed_by": "uuid_or_null",
  "assessed_by_role": "user",
  "patient_name": null,
  "patient_age": 34,
  "patient_gender": "male",
  "patient_type": "self",
  "village": "Gevrai",
  "block": "Gevrai",
  "district": "Beed",
  "patient_lat": 18.9825,
  "patient_lng": 75.7123,
  "raw_input_text": "मुझे तीन दिनों से बुखार है...",
  "raw_input_language": "hi",
  "symptoms": ["fever", "headache"],
  "symptom_answers": {
    "q1": "2-3 days",
    "q2": "no"
  },
  "language": "hi"
}
```

**Processing chain (internal):**
```
symptoms + answers + age/gender
  → rule_engine.py → RED/YELLOW/GREEN
  → facilities.py (internal call) → nearest facility
  → Save assessment to Supabase
  → outbreak_detector.py (async, non-blocking)
  → Translate result → user's language
  → Return everything
```

**Response `200`:**
```json
{
  "assessment_id": "uuid",
  "triage_level": "YELLOW",
  "triage_reason": "Fever lasting more than 3 days requires clinical evaluation",
  "triage_reason_translated": "3 दिन से अधिक बुखार के लिए क्लिनिकल मूल्यांकन आवश्यक है",
  "recommended_action": "Visit PHC within 24 hours",
  "recommended_action_translated": "24 घंटे के भीतर PHC जाएं",
  "self_care_instructions": [
    "Take paracetamol if temperature is high",
    "Drink plenty of fluids",
    "Rest and avoid exertion"
  ],
  "self_care_instructions_translated": [
    "तापमान अधिक होने पर पैरासिटामोल लें",
    "खूब पानी पिएं",
    "आराम करें"
  ],
  "warning_signs": ["Difficulty breathing", "High fever above 104F"],
  "warning_signs_translated": ["सांस लेने में कठिनाई", "104F से अधिक बुखार"],
  "facility": {
    "id": "uuid",
    "name": "PHC Gevrai",
    "type": "PHC",
    "distance_km": 2.4,
    "phone": "02446-234001",
    "address": "Gevrai, Beed",
    "lat": 18.9825,
    "lng": 75.7123,
    "embed_url": "https://www.openstreetmap.org/...",
    "directions_url": "https://maps.google.com/..."
  },
  "follow_up_due": "2025-01-17T10:30:00Z"
}
```

---

## FACILITIES ROUTES — `/facilities`
**File:** `backend/routes/facilities.py`

---

### GET `/facilities/nearest`
Returns top 3 nearest facilities appropriate for the triage level.

**Query Parameters:**
```
lat          float    required   Patient latitude
lng          float    required   Patient longitude
triage_level string   required   RED | YELLOW | GREEN
district     string   required   For fallback if GPS fails
```

**Facility filter logic:**
- `RED` → only facilities where `has_emergency = true`
- `YELLOW` → PHC, CHC, District Hospital
- `GREEN` → nearest PHC or Sub-Centre

**Response `200`:**
```json
{
  "facilities": [
    {
      "id": "uuid",
      "name": "PHC Gevrai",
      "type": "PHC",
      "distance_km": 2.4,
      "phone": "02446-234001",
      "hours": "9am - 4pm",
      "is_24hr": false,
      "lat": 18.9825,
      "lng": 75.7123,
      "embed_url": "https://www.openstreetmap.org/?mlat=18.9825&mlon=75.7123&zoom=15",
      "directions_url": "https://www.google.com/maps/dir/?api=1&destination=18.9825,75.7123"
    }
  ]
}
```

**Distance calculation:** Haversine formula in `utils/haversine.py`.
All facilities for the district loaded from Supabase and sorted by distance in Python — not in SQL — to keep logic portable.

---

## FEEDBACK ROUTES — `/feedback`
**File:** `backend/routes/feedback.py`

---

### POST `/feedback/{assessment_id}`
Saves 48hr follow-up response for a completed assessment.

**Request Body:**
```json
{
  "visited_facility": true,
  "outcome": "better",
  "patient_satisfied": true,
  "doctor_diagnosis": "Viral fever"
}
```

**Processing:**
1. Updates `assessments.follow_up_done = true` and `follow_up_outcome`
2. Inserts row in `feedback` table
3. If `outcome = "worse"` → sets a flag in response so frontend can redirect to SymptomInput
4. Calculates `triage_was_accurate` (basic check: RED → visited hospital, YELLOW → visited PHC)

**Response `200`:**
```json
{
  "message": "Follow-up recorded",
  "redirect_to_assessment": false
}
```

If `outcome = "worse"`:
```json
{
  "message": "Follow-up recorded",
  "redirect_to_assessment": true,
  "message_translated": "आपकी स्थिति खराब है। कृपया फिर से जाँच करें।"
}
```

---

### GET `/feedback/pending/{user_id}`
Returns all assessments for this user/ASHA that have passed their `follow_up_due` but `follow_up_done = false`.

**Response `200`:**
```json
{
  "pending": [
    {
      "assessment_id": "uuid",
      "patient_name": "Ramu Kale",
      "triage_level": "YELLOW",
      "symptoms": ["fever", "headache"],
      "created_at": "2025-01-15T10:00:00Z",
      "follow_up_due": "2025-01-17T10:00:00Z"
    }
  ]
}
```

---

## PATIENT ROUTES — `/patients`
**File:** `backend/routes/patients.py`
**Auth required:** ASHA role

---

### GET `/patients/{asha_id}`
Returns all patients assessed by this ASHA worker, sorted by follow-up due date.

**Query Parameters:**
```
sort_by     string    optional   "follow_up_due" (default) | "created_at" | "triage_level"
triage      string    optional   Filter by RED | YELLOW | GREEN
page        int       optional   Default 1
per_page    int       optional   Default 20
```

**Response `200`:**
```json
{
  "total": 47,
  "page": 1,
  "patients": [
    {
      "assessment_id": "uuid",
      "patient_name": "Ramu Kale",
      "patient_age": 45,
      "patient_gender": "male",
      "village": "Gevrai",
      "symptoms": ["fever", "headache"],
      "triage_level": "YELLOW",
      "created_at": "2025-01-15T10:00:00Z",
      "follow_up_due": "2025-01-17T10:00:00Z",
      "follow_up_done": false
    }
  ]
}
```

---

### GET `/patients/followup-due/{asha_id}`
Returns only patients where `follow_up_due < now()` and `follow_up_done = false`.
Used by ASHA dashboard to show "pending follow-ups" badge.

**Response `200`:**
```json
{
  "count": 3,
  "patients": [ ... ]
}
```

---

## ADMIN ROUTES — `/admin`
**File:** `backend/routes/admin.py`
**Auth required:** Admin role + district match

---

### GET `/admin/summary`
Dashboard summary — today's totals.

**Response `200`:**
```json
{
  "date": "2025-01-16",
  "district": "Beed",
  "totals": {
    "all": 142,
    "RED": 12,
    "YELLOW": 67,
    "GREEN": 63
  },
  "active_outbreak_alerts": 1,
  "active_ashas_today": 8
}
```

---

### GET `/admin/heatmap`
Symptom frequency grouped by block. Used by SymptomHeatmap.jsx.

**Query Parameters:**
```
period    string    required    today | week | month
district  string    auto        From JWT
```

**Response `200`:**
```json
{
  "period": "week",
  "blocks": ["Gevrai", "Ashti", "Parli", "Wadwani"],
  "symptoms": ["fever", "cough", "vomiting", "rash"],
  "data": {
    "Gevrai": { "fever": 34, "cough": 8, "vomiting": 5, "rash": 22 },
    "Ashti":  { "fever": 12, "cough": 3, "vomiting": 2, "rash": 1  }
  }
}
```

---

### GET `/admin/phc-load`
Referral count per PHC. For PHCMonitor.jsx.

**Response `200`:**
```json
{
  "phcs": [
    {
      "facility_id": "uuid",
      "name": "PHC Gevrai",
      "block": "Gevrai",
      "phone": "02446-234001",
      "referrals_today": 18,
      "status": "OVERLOADED"
    }
  ]
}
```

**Status thresholds:**
- `NORMAL`: 0–10 referrals/day
- `MODERATE`: 11–20
- `OVERLOADED`: 21+

---

### GET `/admin/asha-activity`
Per-ASHA stats. For AshaTracker.jsx.

**Response `200`:**
```json
{
  "ashas": [
    {
      "user_id": "uuid",
      "name": "Sunita Kamble",
      "asha_id": "ASHA-BED-001",
      "block": "Gevrai",
      "assessments_this_week": 24,
      "followups_completed": 18,
      "followup_rate": 75,
      "last_active": "2025-01-16T08:30:00Z",
      "is_inactive": false
    }
  ]
}
```

---

### GET `/admin/outbreaks`
All outbreak alerts for the admin's district.

**Response `200`:**
```json
{
  "alerts": [
    {
      "id": "uuid",
      "block": "Gevrai",
      "district": "Beed",
      "symptom_cluster": ["fever", "rash"],
      "case_count": 22,
      "affected_villages": ["Gevrai", "Pimpalgaon", "Wadgaon"],
      "severity": "HIGH",
      "status": "ACTIVE",
      "first_reported": "2025-01-14T12:00:00Z",
      "actions_taken": [
        {
          "action": "PHC notified",
          "by": "admin_uuid",
          "at": "2025-01-15T09:00:00Z"
        }
      ]
    }
  ]
}
```

---

### PATCH `/admin/outbreaks/{alert_id}`
Update outbreak status or log an action taken.

**Request Body:**
```json
{
  "status": "INVESTIGATING",
  "action": "Deploy Rapid Response Team",
  "notes": "RRT dispatched to Gevrai block"
}
```

**Response `200`:**
```json
{ "message": "Alert updated" }
```

---

### GET `/admin/reports`
Aggregated data for PDF export. Date range + optional block filter.

**Query Parameters:**
```
report_type   string    required    weekly_summary | monthly_cmo | asha_performance | phc_load
from_date     date      required    YYYY-MM-DD
to_date       date      required    YYYY-MM-DD
block         string    optional    Filter to specific block
```

**Response `200`:**
```json
{
  "report_type": "weekly_summary",
  "district": "Beed",
  "period": { "from": "2025-01-10", "to": "2025-01-16" },
  "total_assessments": 342,
  "triage_breakdown": { "RED": 28, "YELLOW": 162, "GREEN": 152 },
  "top_symptoms": [
    { "symptom": "fever", "count": 187 },
    { "symptom": "cough", "count": 94 }
  ],
  "opd_deflection_estimate": 152,
  "asha_activity": [ ... ],
  "phc_load": [ ... ],
  "outbreak_events": [ ... ]
}
```

---

## HTTP STATUS CODE REFERENCE

| Code | Meaning |
|------|---------|
| 200  | OK |
| 201  | Created |
| 400  | Bad request / validation error |
| 401  | Unauthenticated |
| 403  | Wrong role / unauthorized |
| 404  | Resource not found |
| 422  | Unprocessable entity (FastAPI validation) |
| 500  | Internal server error |

---

## AUTHENTICATION MIDDLEWARE

All protected routes use a dependency injected via FastAPI's `Depends()`.

```python
# In each protected route:
async def get_admin_summary(current_user = Depends(require_role("admin"))):
    ...
```

Roles: `user`, `asha`, `admin`
Anonymous triage (no login) bypasses auth entirely — session_id used instead.
