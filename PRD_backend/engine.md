# engine.md — Core Intelligence Layer
### Margdarshak Backend — `backend/engine/`

This folder is the brain of the system. Zero external API calls.
Pure Python. Always works offline. Fully testable.

---

## Overview

```
engine/
├── rule_engine.py          # Triage decision logic — RED/YELLOW/GREEN
├── symptom_keywords.py     # Maps English phrases → canonical symptom names
├── follow_up_questions.py  # Maps symptoms → relevant follow-up questions
└── outbreak_detector.py   # Cluster detection on Supabase data
```

---

## 1. `rule_engine.py`

### Purpose
Takes a structured list of symptoms + follow-up answers + patient demographics,
returns a triage classification with reason, instructions, and warnings.

### Function Signature
```python
def run_triage(
    symptoms: list[str],
    answers: dict,
    age: int,
    gender: str
) -> TriageResult:
```

### Return Type
```python
@dataclass
class TriageResult:
    level: str              # "RED" | "YELLOW" | "GREEN"
    reason: str             # Plain English explanation
    recommended_action: str # What to do next
    self_care: list[str]    # Step-by-step home care
    warning_signs: list[str] # "Come back if these appear"
```

---

### Triage Logic — RED (Emergency — Call 108 / Go to Hospital Now)

These conditions trigger RED regardless of other symptoms:

```python
RED_ALWAYS = [
    "chest_pain",           # Any chest pain
    "difficulty_breathing", # Breathlessness, can't complete sentences
    "unconscious",          # Loss of consciousness, unresponsive
    "heavy_bleeding",       # Uncontrolled bleeding
    "seizure",              # Convulsion/fits
    "stroke_signs",         # Facial droop, arm weakness, slurred speech
    "snake_bite",
    "severe_burns",
    "choking",
]

# Combination triggers
RED_COMBINATIONS = [
    ["chest_pain", "sweating"],
    ["chest_pain", "arm_pain"],
    ["fever", "stiff_neck"],        # Meningitis indicator
    ["fever", "rash"],              # If rash is petechial (answer-dependent)
    ["breathlessness", "cyanosis"],
    ["vomiting_blood"],
    ["blood_in_stool"],             # With dizziness = RED
    ["high_fever", "seizure"],
]

# Age-specific RED triggers
RED_AGE_RULES = {
    "infant": ["fever"],            # Any fever in child < 3 months → RED
    "elderly": ["chest_pain", "fall_with_injury", "confusion"],
}
```

**Answer-dependent RED escalation:**
```python
# If fever duration answer is "4+ days" AND age < 5 → RED
# If breathlessness answer is "cannot complete sentence" → RED
# If diarrhea answer is "more than 10 times/day" → RED
```

---

### Triage Logic — YELLOW (Visit Clinic Within 24 Hours)

```python
YELLOW_CONDITIONS = [
    "fever",                # > 3 days duration (answer-dependent)
    "vomiting",             # Persistent, more than 3 times
    "diarrhea",             # Persistent, moderate
    "abdominal_pain",       # Moderate, not severe
    "urinary_pain",         # UTI indicators
    "ear_pain",
    "eye_infection",
    "wound_infection",      # Wound with pus/spreading redness
    "pregnancy_concern",    # Any pregnancy-related symptom
    "child_not_eating",     # Child refusing food + fever
    "rash",                 # Non-petechial rash
    "joint_pain",           # With fever
]

YELLOW_AGE_RULES = {
    "child_under_5": ["fever", "vomiting", "diarrhea"],   # Always YELLOW if not RED
    "pregnant": ["any_fever", "abdominal_pain", "headache"],
    "elderly_over_65": ["falls", "confusion", "new_weakness"],
}
```

---

### Triage Logic — GREEN (Self-Care at Home)

GREEN is the default if no RED or YELLOW conditions are matched.

```python
GREEN_CONDITIONS = [
    "common_cold",
    "mild_cough",           # Duration < 3 days, no fever
    "sore_throat",          # Mild
    "body_ache",            # No fever
    "mild_headache",        # No stiff neck, no fever
    "constipation",
    "minor_cut",            # Clean, not deep
    "insect_bite",          # No signs of allergic reaction
    "mild_stomach_ache",    # Occasional, no vomiting
]
```

---

### Self-Care Instructions (per condition)

```python
SELF_CARE_MAP = {
    "fever": [
        "Take paracetamol (500mg for adults, as per weight for children)",
        "Sponge with lukewarm water if temperature is high",
        "Drink 8-10 glasses of water or ORS",
        "Rest completely",
        "Do NOT give aspirin to children under 16"
    ],
    "common_cold": [
        "Drink warm fluids (tulsi tea, warm water with honey)",
        "Steam inhalation twice daily",
        "Rest and keep warm",
        "Honey + ginger for cough relief"
    ],
    "diarrhea": [
        "Prepare ORS: 1 litre water + 6 teaspoons sugar + 1/2 teaspoon salt",
        "Give ORS after every loose stool",
        "Continue breastfeeding if infant",
        "Eat light food: rice, banana, curd"
    ],
    # ... full map for all GREEN/YELLOW symptoms
}
```

---

### Warning Signs (per triage level)

After every YELLOW or GREEN result, the system adds warning signs:
```python
WARNING_SIGNS_YELLOW = [
    "Difficulty breathing or chest tightness",
    "High fever above 104°F / 40°C",
    "Child becomes drowsy or unresponsive",
    "Symptoms get significantly worse within hours",
    "Blood in vomit, urine, or stool"
]

WARNING_SIGNS_GREEN = [
    "Fever develops",
    "Symptoms last more than 3 days",
    "Pain becomes severe"
]
```

---

### Follow-Up Timer Logic

```python
FOLLOW_UP_HOURS = {
    "RED": None,       # No follow-up — they should be at hospital
    "YELLOW": 48,      # Check in 48 hours
    "GREEN": 72        # Check in 72 hours
}
```

---

## 2. `symptom_keywords.py`

### Purpose
Maps raw English text (after translation) to canonical symptom identifiers
that the rule engine understands.

### Why This Exists
Users say many things for the same symptom:
"my heart is hurting", "pain in chest", "tightness in chest" → all = `chest_pain`

### Structure
```python
SYMPTOM_KEYWORD_MAP: dict[str, str] = {
    # Fever
    "fever": "fever",
    "temperature": "fever",
    "hot body": "fever",
    "burning body": "fever",
    "high temperature": "high_fever",

    # Chest
    "chest pain": "chest_pain",
    "chest tightness": "chest_pain",
    "heart pain": "chest_pain",
    "pain in chest": "chest_pain",

    # Breathing
    "difficulty breathing": "difficulty_breathing",
    "breathlessness": "difficulty_breathing",
    "shortness of breath": "difficulty_breathing",
    "cant breathe": "difficulty_breathing",
    "breathing problem": "difficulty_breathing",

    # Stomach / GI
    "stomach ache": "abdominal_pain",
    "stomach pain": "abdominal_pain",
    "tummy ache": "abdominal_pain",
    "vomiting": "vomiting",
    "throwing up": "vomiting",
    "nausea": "nausea",
    "diarrhea": "diarrhea",
    "loose motion": "diarrhea",
    "loose stools": "diarrhea",
    "watery stools": "diarrhea",

    # Head / neuro
    "headache": "headache",
    "head pain": "headache",
    "migraine": "headache",
    "dizziness": "dizziness",
    "unconscious": "unconscious",
    "fainting": "unconscious",
    "fits": "seizure",
    "convulsion": "seizure",
    "seizure": "seizure",

    # Respiratory
    "cough": "cough",
    "cold": "common_cold",
    "runny nose": "common_cold",
    "sore throat": "sore_throat",

    # Skin
    "rash": "rash",
    "skin rash": "rash",
    "spots on skin": "rash",
    "itching": "skin_itch",
    "swelling": "swelling",

    # Other
    "bleeding": "bleeding",
    "blood": "bleeding",
    "snake bite": "snake_bite",
    "burn": "burns",
    "weakness": "weakness",
    "fatigue": "fatigue",
    "body pain": "body_ache",
    "body ache": "body_ache",
    "joint pain": "joint_pain",
    "back pain": "back_pain",
    "sweating": "sweating",
    "chills": "chills",
    "arm pain": "arm_pain",
    "stiff neck": "stiff_neck",
    "ear pain": "ear_pain",
    "eye pain": "eye_infection",
    "eye redness": "eye_infection",
    "urine pain": "urinary_pain",
    "urination pain": "urinary_pain",
    "burning urination": "urinary_pain",
}
```

### Extraction Function
```python
def extract_symptoms(english_text: str) -> list[str]:
    """
    Takes translated English text.
    Returns list of canonical symptom names.
    Handles partial matches and multi-word phrases.
    """
    text_lower = english_text.lower()
    found = set()
    for phrase, symptom_name in SYMPTOM_KEYWORD_MAP.items():
        if phrase in text_lower:
            found.add(symptom_name)
    return list(found)
```

---

## 3. `follow_up_questions.py`

### Purpose
Maps identified symptoms to relevant clarifying questions.
Questions are stored in English and translated by the translate service
before being sent to the frontend.

### Structure
```python
FOLLOW_UP_QUESTION_MAP: dict[str, list[dict]] = {

    "fever": [
        {
            "id": "fever_duration",
            "question": "How many days have you had fever?",
            "type": "options",
            "options": ["1 day", "2-3 days", "4+ days"]
        },
        {
            "id": "fever_infant",
            "question": "Is the patient a child under 3 months old?",
            "type": "yes_no",
            "critical": True    # If yes → escalate to RED
        }
    ],

    "chest_pain": [
        {
            "id": "chest_radiation",
            "question": "Does the pain spread to the arm, neck, or jaw?",
            "type": "yes_no",
            "critical": True
        },
        {
            "id": "chest_sweat",
            "question": "Is the patient also sweating heavily?",
            "type": "yes_no",
            "critical": True
        },
        {
            "id": "chest_breathlessness",
            "question": "Is there difficulty in breathing along with chest pain?",
            "type": "yes_no",
            "critical": True
        }
    ],

    "difficulty_breathing": [
        {
            "id": "breath_severity",
            "question": "Can the patient speak a full sentence without stopping to breathe?",
            "type": "yes_no",
            "critical": True    # If no → RED
        }
    ],

    "diarrhea": [
        {
            "id": "diarrhea_count",
            "question": "How many times in the last 24 hours?",
            "type": "options",
            "options": ["1-3 times", "4-6 times", "More than 6 times"]
        },
        {
            "id": "diarrhea_blood",
            "question": "Is there blood in the stool?",
            "type": "yes_no",
            "critical": True
        }
    ],

    "headache": [
        {
            "id": "headache_neck",
            "question": "Is there stiffness or pain in the neck?",
            "type": "yes_no",
            "critical": True    # Meningitis indicator → RED
        },
        {
            "id": "headache_vision",
            "question": "Is there any blurred vision or vomiting with the headache?",
            "type": "yes_no"
        }
    ],

    "rash": [
        {
            "id": "rash_type",
            "question": "Do the spots disappear when you press on them?",
            "type": "yes_no",
            "critical": True    # If no → petechial = RED
        }
    ],

    "vomiting": [
        {
            "id": "vomiting_blood",
            "question": "Is there blood in the vomit?",
            "type": "yes_no",
            "critical": True
        },
        {
            "id": "vomiting_count",
            "question": "How many times in the last 6 hours?",
            "type": "options",
            "options": ["1-2 times", "3-5 times", "More than 5 times"]
        }
    ],
}
```

### Selection Function
```python
def get_follow_up_questions(symptoms: list[str], max_questions: int = 4) -> list[dict]:
    """
    For a given symptom list, returns the most relevant follow-up questions.
    Critical questions (that can change triage level) are always prioritized.
    Maximum 4 questions returned to keep UX fast.
    """
    questions = []
    seen_ids = set()

    # Critical questions first
    for symptom in symptoms:
        for q in FOLLOW_UP_QUESTION_MAP.get(symptom, []):
            if q.get("critical") and q["id"] not in seen_ids:
                questions.append(q)
                seen_ids.add(q["id"])

    # Fill remaining slots with non-critical
    for symptom in symptoms:
        for q in FOLLOW_UP_QUESTION_MAP.get(symptom, []):
            if not q.get("critical") and q["id"] not in seen_ids:
                questions.append(q)
                seen_ids.add(q["id"])

    return questions[:max_questions]
```

---

## 4. `outbreak_detector.py`

### Purpose
Automatically detects disease clusters. Runs silently after every assessment is saved.
If threshold crossed → creates alert in Supabase. Non-blocking (runs async).

### Function Signature
```python
async def check_for_outbreak(
    block: str,
    district: str,
    symptoms: list[str],
    supabase_client
) -> bool:
    """
    Returns True if an outbreak alert was triggered, False otherwise.
    """
```

### Detection Logic
```python
OUTBREAK_THRESHOLD = 20      # Cases
OUTBREAK_WINDOW_HOURS = 72   # Time window
MIN_SYMPTOM_OVERLAP = 2      # At least 2 matching symptoms in cluster

async def check_for_outbreak(block, district, symptoms, db):

    # Step 1: Query Supabase for recent assessments in same block
    cutoff = datetime.utcnow() - timedelta(hours=OUTBREAK_WINDOW_HOURS)

    recent = db.table("assessments").select(
        "id, symptoms, village, created_at"
    ).eq("block", block).eq("district", district).gte(
        "created_at", cutoff.isoformat()
    ).execute()

    # Step 2: Find assessments with overlapping symptoms
    matching = []
    for assessment in recent.data:
        overlap = set(assessment["symptoms"]) & set(symptoms)
        if len(overlap) >= MIN_SYMPTOM_OVERLAP:
            matching.append(assessment)

    # Step 3: Check threshold
    if len(matching) < OUTBREAK_THRESHOLD:
        return False

    # Step 4: Check if alert already exists for this cluster
    existing = db.table("outbreak_alerts").select("id").eq(
        "block", block
    ).eq("status", "ACTIVE").contains(
        "symptom_cluster", symptoms
    ).execute()

    if existing.data:
        # Update case count on existing alert
        db.table("outbreak_alerts").update({
            "case_count": len(matching),
            "last_updated": datetime.utcnow().isoformat()
        }).eq("id", existing.data[0]["id"]).execute()
        return False

    # Step 5: Create new outbreak alert
    affected_villages = list(set(a["village"] for a in matching if a.get("village")))

    db.table("outbreak_alerts").insert({
        "block": block,
        "district": district,
        "symptom_cluster": list(set(symptoms)),
        "case_count": len(matching),
        "affected_villages": affected_villages,
        "first_reported": datetime.utcnow().isoformat(),
        "last_updated": datetime.utcnow().isoformat(),
        "status": "ACTIVE",
        "severity": _calculate_severity(len(matching))
    }).execute()

    return True


def _calculate_severity(case_count: int) -> str:
    if case_count >= 50:
        return "CRITICAL"
    elif case_count >= 35:
        return "HIGH"
    elif case_count >= 20:
        return "MEDIUM"
    return "LOW"
```

### Integration Point
Called inside `routes/triage.py` after saving the assessment:
```python
# In POST /triage/assess, after supabase insert:
asyncio.create_task(
    check_for_outbreak(
        block=body.block,
        district=body.district,
        symptoms=body.symptoms,
        supabase_client=db
    )
)
# Does NOT block the response. User gets result immediately.
```

---

## Testing Guidelines

Every function in `engine/` should be independently testable with no DB or API:

```python
# test_rule_engine.py
def test_chest_pain_sweating_is_red():
    result = run_triage(
        symptoms=["chest_pain", "sweating"],
        answers={},
        age=45,
        gender="male"
    )
    assert result.level == "RED"

def test_fever_3_days_child_is_yellow():
    result = run_triage(
        symptoms=["fever"],
        answers={"fever_duration": "2-3 days", "fever_infant": "no"},
        age=4,
        gender="female"
    )
    assert result.level == "YELLOW"

def test_mild_cough_is_green():
    result = run_triage(
        symptoms=["mild_cough"],
        answers={},
        age=28,
        gender="male"
    )
    assert result.level == "GREEN"
```

**The rule engine must be the first thing built and fully tested before wiring up APIs.**
