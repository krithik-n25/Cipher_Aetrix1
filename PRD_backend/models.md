# models.md — Pydantic Schemas
### Margdarshak Backend — `backend/models/schemas.py`

All request bodies and response shapes are validated through these Pydantic models.
FastAPI uses them automatically for request parsing and OpenAPI docs generation.

---

## Request Schemas

### `LoginRequest`
```python
class LoginRequest(BaseModel):
    phone: str
    password: str
```

### `RegisterRequest`
```python
class RegisterRequest(BaseModel):
    name: str
    phone: str
    password: str
    role: Literal["user", "asha", "admin"]
    village: Optional[str] = None
    block: Optional[str] = None
    district: str
    asha_id: Optional[str] = None
    language: Literal["hi", "gu", "mr", "ta", "en"] = "hi"
```

---

### `SymptomInputSchema`
Used for `POST /triage/extract-symptoms`

```python
class SymptomInputSchema(BaseModel):
    text: str = Field(..., min_length=2, max_length=1000)
    language: Literal["hi", "gu", "mr", "ta", "en"]
    patient_age: int = Field(..., ge=0, le=120)
    patient_gender: Literal["male", "female", "other"]
    session_id: Optional[str] = None
```

---

### `TriageRequestSchema`
Used for `POST /triage/assess`

```python
class TriageRequestSchema(BaseModel):
    session_id: Optional[str] = None
    assessed_by: Optional[str] = None          # UUID of ASHA/user, null for guest
    assessed_by_role: Literal["user", "asha"]
    patient_name: Optional[str] = None
    patient_age: int = Field(..., ge=0, le=120)
    patient_gender: Literal["male", "female", "other"]
    patient_type: Literal["self", "child", "elderly", "other"]
    village: Optional[str] = None
    block: str
    district: str
    patient_lat: Optional[float] = None
    patient_lng: Optional[float] = None
    raw_input_text: Optional[str] = None
    raw_input_language: Literal["hi", "gu", "mr", "ta", "en"]
    symptoms: list[str] = Field(..., min_items=1)
    symptom_answers: dict = Field(default_factory=dict)
    language: Literal["hi", "gu", "mr", "ta", "en"]
```

---

### `FeedbackSchema`
Used for `POST /feedback/{assessment_id}`

```python
class FeedbackSchema(BaseModel):
    visited_facility: Optional[bool] = None
    outcome: Literal["better", "same", "worse"]
    patient_satisfied: Optional[bool] = None
    doctor_diagnosis: Optional[str] = None
```

---

### `OutbreakUpdateSchema`
Used for `PATCH /admin/outbreaks/{alert_id}`

```python
class OutbreakUpdateSchema(BaseModel):
    status: Optional[Literal["ACTIVE", "INVESTIGATING", "RESOLVED", "FALSE_POSITIVE"]] = None
    action: Optional[str] = None          # Action description to log
    notes: Optional[str] = None
```

---

## Response Schemas

### `AuthResponse`
```python
class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    user_id: str
    name: str
    district: str
    block: Optional[str]
    language: str
```

---

### `FollowUpQuestion`
```python
class FollowUpQuestion(BaseModel):
    id: str
    question_en: str
    question_translated: str
    type: Literal["yes_no", "options", "number"]
    options: Optional[list[str]] = None
    options_translated: Optional[list[str]] = None
```

### `SymptomExtractResponse`
```python
class SymptomExtractResponse(BaseModel):
    detected_symptoms: list[str]
    confirmation_text: str
    confirmation_text_translated: str
    follow_up_questions: list[FollowUpQuestion]
```

---

### `FacilityResponse`
```python
class FacilityResponse(BaseModel):
    id: str
    name: str
    type: str
    distance_km: float
    phone: Optional[str]
    hours: Optional[str]
    is_24hr: bool
    lat: float
    lng: float
    embed_url: str
    directions_url: str
    call_url: Optional[str]
```

### `AssessmentResponseSchema`
```python
class AssessmentResponseSchema(BaseModel):
    assessment_id: str
    triage_level: Literal["RED", "YELLOW", "GREEN"]
    triage_reason: str
    triage_reason_translated: str
    recommended_action: str
    recommended_action_translated: str
    self_care_instructions: list[str]
    self_care_instructions_translated: list[str]
    warning_signs: list[str]
    warning_signs_translated: list[str]
    facility: Optional[FacilityResponse]
    follow_up_due: Optional[str]            # ISO timestamp or null (RED has no follow-up)
    emergency_call_url: Optional[str]       # "tel:108" for RED results only
```

---

### `FeedbackResponse`
```python
class FeedbackResponse(BaseModel):
    message: str
    redirect_to_assessment: bool = False
    message_translated: Optional[str] = None
```

---

## Internal Types (not used in API, used inside engine/)

```python
from dataclasses import dataclass

@dataclass
class TriageResult:
    level: str                     # "RED" | "YELLOW" | "GREEN"
    reason: str
    recommended_action: str
    self_care: list[str]
    warning_signs: list[str]
```

---

## Validation Notes

- All UUIDs come in as `str` — FastAPI handles conversion
- `symptoms` field is `list[str]` — Supabase stores as `text[]`, supabase-py handles this automatically
- `symptom_answers` is `dict` — stored as `jsonb` in Supabase
- `patient_lat` and `patient_lng` are optional — app falls back to block-level location for facility search if GPS not available
