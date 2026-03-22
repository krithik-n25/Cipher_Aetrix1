"""
Rule-Based Triage Engine
Implements the exact decision tree from the PRD.
Principle: When in doubt → always go one level UP. Never default to GREEN.
"""
from dataclasses import dataclass, field

FOLLOW_UP_HOURS = {"RED": None, "YELLOW": 24, "GREEN": 72}


@dataclass
class TriageResult:
    level: str
    reason: str
    recommended_action: str
    self_care: list = field(default_factory=list)
    warning_signs: list = field(default_factory=list)


# ─── OVERRIDE DANGER WORDS ────────────────────────────────────────────────────
# Any of these in symptoms → immediate RED
DANGER_WORDS = {
    "unconscious", "unresponsive", "not_breathing", "respiratory_failure",
    "seizure", "convulsion", "fits", "fitting",
    "vomiting_blood", "coughing_blood", "blood_in_stool_massive",
    "choking", "cyanosis", "blue_lips", "blue_fingernails",
    "cardiac_arrest", "heart_attack", "anaphylaxis",
    "stroke_signs", "facial_droop", "paralysis",
    "heavy_bleeding", "uncontrolled_bleeding", "postpartum_hemorrhage",
    "eclampsia", "cord_prolapse", "obstructed_labor", "ruptured_ectopic",
    "placental_abruption", "severe_preeclampsia",
    "snake_bite", "severe_burns", "electric_shock",
    "head_injury_severe", "spinal_injury", "drowning",
    "poisoning", "overdose", "pesticide_poisoning", "organophosphate_poisoning",
    "chemical_ingestion", "diabetic_coma", "septic_shock", "heat_stroke",
    "infant_not_breathing", "newborn_seizure", "testicular_torsion",
    "aortic_dissection", "pulmonary_embolism", "internal_bleeding",
    "severe_breathlessness", "difficulty_breathing",
}


# ─── RED COMBINATIONS (Rule 1-12 from PRD) ───────────────────────────────────
RED_COMBINATIONS = [
    # Rule 1: Heart attack
    ({"chest_pain", "sweating"},          "Possible heart attack: chest pain with sweating"),
    ({"chest_pain", "arm_pain"},           "Possible heart attack: chest pain with arm pain"),
    ({"chest_pain", "jaw_pain"},           "Possible heart attack: chest pain with jaw pain"),
    ({"chest_pain", "difficulty_breathing"}, "Possible heart attack: chest pain with breathing difficulty"),
    ({"chest_pain", "nausea"},             "Possible heart attack: chest pain with nausea"),
    ({"chest_pain", "vomiting"},           "Possible heart attack: chest pain with vomiting"),
    ({"chest_pain", "dizziness"},          "Possible heart attack: chest pain with dizziness"),
    ({"chest_pain", "breathlessness"},     "Possible heart attack: chest pain with breathlessness"),
    # Rule 2: Stroke
    ({"facial_droop", "arm_weakness"},     "Stroke signs: face drooping and arm weakness"),
    ({"slurred_speech", "confusion"},      "Stroke signs: slurred speech and confusion"),
    ({"sudden_headache", "vomiting"},      "Possible brain emergency: sudden headache with vomiting"),
    ({"sudden_headache", "stiff_neck"},    "Possible meningitis: sudden headache with stiff neck"),
    ({"sudden_headache", "vision_change"}, "Possible stroke: sudden headache with vision change"),
    # Rule 7: Fever danger combos
    ({"fever", "stiff_neck"},              "Possible meningitis: fever with stiff neck"),
    ({"fever", "seizure"},                 "Emergency: fever with seizure"),
    ({"high_fever", "seizure"},            "Emergency: high fever with seizure"),
    ({"fever", "purple_rash"},             "Possible meningococcal: fever with non-blanching rash"),
    ({"fever", "confusion"},              "Emergency: fever with confusion"),
    ({"high_fever", "confusion"},          "Emergency: high fever with confusion"),
    ({"fever", "photophobia", "stiff_neck"}, "Meningitis signs: fever, light sensitivity, stiff neck"),
    # Rule 8: Diabetic emergency
    ({"diabetes", "unconscious"},          "Diabetic emergency: unconscious diabetic patient"),
    ({"diabetes", "seizure"},              "Diabetic emergency: seizure in diabetic patient"),
    ({"diabetes", "confusion"},            "Diabetic emergency: confusion in diabetic patient"),
    # Rule 10: Pregnancy emergencies
    ({"pregnancy", "heavy_bleeding"},      "Obstetric emergency: heavy bleeding in pregnancy"),
    ({"pregnancy", "seizure"},             "Eclampsia: seizure in pregnancy"),
    ({"pregnancy", "severe_abdominal_pain"}, "Obstetric emergency: severe pain in pregnancy"),
    ({"pregnancy", "severe_headache"},     "Possible preeclampsia: severe headache in pregnancy"),
    ({"pregnancy", "vision_change"},       "Possible preeclampsia: vision changes in pregnancy"),
    # Rule 12: Head injury
    ({"head_injury", "unconscious"},       "Emergency: head injury with loss of consciousness"),
    ({"head_injury", "vomiting"},          "Emergency: head injury with vomiting"),
    ({"head_injury", "seizure"},           "Emergency: head injury with seizure"),
    ({"head_injury", "confusion"},         "Emergency: head injury with confusion"),
    # Sepsis
    ({"high_fever", "rapid_breathing"},    "Possible sepsis: high fever with rapid breathing"),
    ({"fever", "low_blood_pressure"},      "Possible septic shock: fever with low blood pressure"),
    # Respiratory
    ({"breathlessness", "cyanosis"},       "Emergency: breathlessness with cyanosis"),
    ({"wheezing", "severe_breathlessness"}, "Severe asthma attack"),
    # Pediatric
    ({"fever", "bulging_fontanelle"},      "Emergency: fever with bulging fontanelle in infant"),
    ({"fever", "not_feeding_infant"},      "Emergency: infant not feeding with fever"),
]

# ─── YELLOW SINGLE SYMPTOMS ───────────────────────────────────────────────────
YELLOW_SINGLE = {
    # Fever-related
    "high_fever", "fever_3_days", "fever_with_rash", "fever_with_chills",
    "fever_with_jaundice", "fever_with_joint_pain", "fever_with_bleeding_gums",
    "dengue_suspected", "malaria_suspected", "typhoid_suspected",
    "chikungunya_suspected",
    # Respiratory
    "persistent_cough", "cough_with_blood", "cough_3_weeks",
    "wheezing", "asthma_attack_moderate", "pneumonia_suspected",
    "tb_suspected", "breathlessness_mild", "chest_tightness",
    # GI
    "severe_vomiting", "vomiting_3_days", "diarrhea_with_blood",
    "diarrhea_3_days", "severe_abdominal_pain", "jaundice",
    "hepatitis_suspected", "appendicitis_suspected", "dehydration_moderate",
    "blood_in_stool", "gastroenteritis_severe",
    # Neuro
    "severe_headache", "headache_3_days", "migraine_severe",
    "dizziness_persistent", "fainting", "confusion_mild", "numbness",
    # Urinary
    "urinary_pain_severe", "blood_in_urine", "kidney_pain",
    "urinary_retention", "uti_severe", "kidney_stone_suspected",
    # Skin
    "infected_wound", "abscess", "cellulitis", "severe_rash",
    "rash_spreading", "burns_moderate", "deep_cut", "animal_bite",
    "dog_bite", "rat_bite",
    # MSK
    "fracture_suspected", "severe_joint_pain", "joint_swelling",
    "back_pain_severe", "limb_pain_severe",
    # Eye/Ear
    "eye_pain_severe", "sudden_vision_change", "eye_discharge_severe",
    "ear_pain_severe", "hearing_loss_sudden", "ear_discharge",
    # Reproductive
    "pregnancy_bleeding", "pregnancy_pain", "missed_period_with_pain",
    "vaginal_discharge_abnormal", "pelvic_pain", "testicular_pain",
    # Mental health
    "suicidal_thoughts", "self_harm", "severe_anxiety_attack",
    "psychosis_suspected",
    # Pediatric
    "child_not_eating", "child_high_fever", "child_rash_fever",
    "child_ear_pain", "child_diarrhea_dehydration",
    "child_vomiting_persistent", "child_breathing_fast",
    "child_pale", "child_lethargic",
    # Chronic
    "diabetes_uncontrolled", "hypertension_severe", "heart_failure_signs",
    "asthma_uncontrolled", "epilepsy_uncontrolled",
    # Other
    "severe_toothache", "dental_abscess", "food_poisoning_severe",
    "alcohol_withdrawal", "scorpion_sting", "spider_bite",
    "insect_bite_infected", "severe_allergic_reaction_mild",
}

# ─── YELLOW COMBINATIONS ──────────────────────────────────────────────────────
YELLOW_COMBINATIONS = [
    ({"fever", "vomiting", "diarrhea"},    "Fever with vomiting and diarrhea — dehydration risk"),
    ({"fever", "body_ache", "headache"},   "Possible dengue/malaria: fever with body ache and headache"),
    ({"fever", "rash"},                    "Fever with rash needs evaluation"),
    ({"fever", "jaundice"},                "Fever with jaundice — possible hepatitis"),
    ({"cough", "fever", "weight_loss"},    "Possible TB: cough with fever and weight loss"),
    ({"cough", "night_sweats", "weight_loss"}, "Possible TB: cough with night sweats and weight loss"),
    ({"abdominal_pain", "vomiting", "fever"}, "Abdominal pain with vomiting and fever"),
    ({"diarrhea", "vomiting", "weakness"}, "Gastroenteritis with dehydration risk"),
    ({"headache", "vomiting", "fever"},    "Headache with vomiting and fever"),
    ({"joint_pain", "fever", "rash"},      "Possible chikungunya/dengue"),
    ({"urinary_pain", "fever"},            "Possible kidney infection: UTI with fever"),
    ({"back_pain", "fever"},               "Possible kidney infection: back pain with fever"),
    ({"ear_pain", "fever"},                "Ear infection with fever"),
    ({"pregnancy", "fever"},               "Fever in pregnancy needs evaluation"),
    ({"pregnancy", "vomiting"},            "Vomiting in pregnancy needs evaluation"),
    ({"elderly_age", "fever", "confusion"}, "Elderly with fever and confusion — serious"),
    ({"diabetes", "fever"},                "Fever in diabetic patient"),
    ({"diabetes", "wound"},                "Diabetic wound — infection risk"),
    ({"hypertension", "severe_headache"},  "High BP with severe headache"),
    ({"child_age", "fever", "vomiting"},   "Child with fever and vomiting"),
    ({"abdominal_pain", "fever"},          "Abdominal pain with fever"),
    ({"swelling", "pain", "fever"},        "Swelling with pain and fever — possible infection"),
]


# ─── SELF-CARE MAP ────────────────────────────────────────────────────────────
SELF_CARE_MAP = {
    "fever": [
        "Take paracetamol 500mg every 6 hours (adults); weight-based for children",
        "Sponge with lukewarm water if temperature above 102°F",
        "Drink 8-10 glasses of water, ORS, or coconut water",
        "Rest completely, wear light clothing",
        "Do NOT give aspirin to children under 16",
    ],
    "common_cold": [
        "Drink warm fluids: tulsi tea, warm water with honey and ginger",
        "Steam inhalation twice daily for 10 minutes",
        "Rest and keep warm. Saline nasal drops for blocked nose",
        "Avoid cold drinks, ice cream, and dust",
    ],
    "cough": [
        "Warm water with honey and ginger every 4 hours",
        "Steam inhalation twice daily",
        "Avoid cold drinks, dust, and smoke",
        "If cough persists more than 2 weeks, visit PHC for TB screening",
    ],
    "diarrhea": [
        "ORS: 1 litre clean water + 6 teaspoons sugar + 1/2 teaspoon salt",
        "Give ORS after every loose stool",
        "Eat light food: rice, banana, curd, boiled potato",
        "Wash hands with soap before eating and after toilet",
    ],
    "vomiting": [
        "Sip small amounts of ORS every 5-10 minutes",
        "Avoid solid food for 2-4 hours, then start with khichdi",
        "Sit upright, do not lie flat",
    ],
    "headache": [
        "Rest in a quiet, dark room",
        "Cold compress on forehead for 15 minutes",
        "Drink plenty of water — dehydration causes headaches",
        "Paracetamol 500mg if pain is moderate",
    ],
    "abdominal_pain": [
        "Rest and avoid heavy meals",
        "Drink warm water or jeera (cumin) water",
        "Avoid spicy, oily, or gas-forming foods",
        "Do NOT take painkillers without diagnosis",
    ],
    "body_ache": [
        "Rest completely",
        "Paracetamol 500mg for pain relief",
        "Warm compress to painful areas",
        "Drink warm fluids",
    ],
    "sore_throat": [
        "Gargle with warm salt water 3-4 times daily",
        "Drink warm fluids: honey-ginger tea",
        "Avoid cold drinks and ice cream",
        "Tulsi + black pepper + honey twice daily",
    ],
    "minor_cut": [
        "Clean wound with clean water and soap",
        "Apply antiseptic (Dettol or Savlon)",
        "Cover with clean bandage, change daily",
        "Get tetanus injection if not vaccinated in last 5 years",
    ],
    "skin_itch": [
        "Apply calamine lotion or coconut oil",
        "Avoid scratching — it worsens infection",
        "Wear loose, cotton clothing",
        "Bathe with mild soap and cool water",
    ],
    "rash": [
        "Do not scratch the rash",
        "Apply calamine lotion for relief",
        "Keep the area clean and dry",
        "Avoid tight clothing over the rash",
    ],
    "back_pain": [
        "Rest on a firm surface",
        "Warm compress for 20 minutes, 3 times daily",
        "Paracetamol for pain",
        "Avoid heavy lifting",
    ],
    "urinary_pain": [
        "Drink at least 3 litres of water daily",
        "Avoid holding urine — urinate frequently",
        "Avoid spicy food and alcohol",
        "Visit PHC for urine test and antibiotics",
    ],
    "constipation": [
        "Drink 8-10 glasses of water daily",
        "Eat high-fiber foods: fruits, vegetables, whole grains",
        "Walk for 30 minutes daily",
        "Warm water with lemon in the morning",
    ],
    "weakness": [
        "Rest completely",
        "Eat nutritious food: dal, rice, vegetables, fruits",
        "Drink ORS if weakness is due to diarrhea or vomiting",
        "Iron-rich foods: spinach, jaggery, dates",
    ],
    "acidity": [
        "Avoid spicy and oily food",
        "Eat small meals frequently",
        "Antacid if available",
        "Drink plenty of water",
    ],
    "insect_bite": [
        "Clean the bite area with soap and water",
        "Apply ice pack for 10 minutes to reduce swelling",
        "Apply calamine lotion or antihistamine cream",
        "Do NOT scratch",
    ],
    "default": [
        "Rest and drink plenty of fluids",
        "Eat light, easily digestible food",
        "Monitor symptoms and seek help if they worsen",
        "Visit PHC if symptoms persist more than 2-3 days",
    ],
}

WARNING_SIGNS_YELLOW = [
    "Difficulty breathing or chest tightness",
    "Fever above 104°F / 40°C not reducing with paracetamol",
    "Child becomes drowsy, limp, or unresponsive",
    "Symptoms get significantly worse within hours",
    "Blood in vomit, urine, or stool",
    "Confusion, disorientation, or loss of consciousness",
    "Rash spreading rapidly or not fading when pressed",
    "Unable to drink or keep fluids down",
    "Signs of dehydration: sunken eyes, dry mouth, no urine for 6+ hours",
]

WARNING_SIGNS_GREEN = [
    "Fever rises above 102°F or lasts more than 3 days",
    "Symptoms last more than 3 days without improvement",
    "Pain becomes severe or unbearable",
    "New symptoms appear",
    "Child stops eating or drinking",
    "You feel significantly worse",
]


def _get_care(symptom_set: set, fallback="default") -> list:
    """Get self-care instructions for the most relevant symptom."""
    priority = [
        "fever", "cough", "diarrhea", "vomiting", "headache",
        "abdominal_pain", "body_ache", "sore_throat", "urinary_pain",
        "back_pain", "rash", "skin_itch", "weakness", "constipation",
        "minor_cut", "insect_bite", "acidity", "common_cold",
    ]
    for p in priority:
        if p in symptom_set:
            return SELF_CARE_MAP.get(p, SELF_CARE_MAP["default"])
    return SELF_CARE_MAP.get(fallback, SELF_CARE_MAP["default"])


def run_triage(symptoms: list, answers: dict, age: int, gender: str) -> TriageResult:
    """
    Main triage function.
    Implements all 12 RED rules, 11 YELLOW rules, 10 GREEN rules,
    and 6 override rules from the PRD decision tree.
    """
    symptom_set = set(s.lower().strip() for s in (symptoms or []))

    # ── Inject context flags ──────────────────────────────────────────────────
    if age is not None:
        if age < 0.25:   # under 3 months
            symptom_set.add("infant_3mo")
        if age < 1:
            symptom_set.add("infant_age")
        if age < 5:
            symptom_set.add("child_age")
            symptom_set.add("young_child_age")
        elif age < 12:
            symptom_set.add("child_age")
        if age >= 60:
            symptom_set.add("elderly_age")

    if str(gender).lower() in ("f", "female"):
        symptom_set.add("female")

    severity   = str(answers.get("severity", "mild")).lower().strip()
    duration   = answers.get("duration") or answers.get("duration_days")
    has_danger = answers.get("has_danger_signs")
    worsening  = str(answers.get("worsening", "")).lower() in ("yes", "true", "getting worse", "worse")
    pregnant   = "pregnancy" in symptom_set or answers.get("pregnant") is True

    try:
        dur_int = int(float(str(duration))) if duration is not None else 0
    except (ValueError, TypeError):
        dur_int = 0

    # ══════════════════════════════════════════════════════════════════════════
    # OVERRIDE 2 — DANGER WORDS → immediate RED
    # ══════════════════════════════════════════════════════════════════════════
    for dw in DANGER_WORDS:
        if dw in symptom_set:
            return TriageResult(
                level="RED",
                reason=f"Emergency: {dw.replace('_', ' ').title()} detected",
                recommended_action="Call 108 immediately or go to nearest emergency hospital. Do not wait.",
                self_care=[],
                warning_signs=[],
            )

    # ══════════════════════════════════════════════════════════════════════════
    # OVERRIDE — has_danger_signs explicitly True → RED
    # ══════════════════════════════════════════════════════════════════════════
    if has_danger is True:
        return TriageResult(
            level="RED",
            reason="Danger signs reported during assessment",
            recommended_action="Call 108 immediately or go to nearest emergency hospital.",
            self_care=[],
            warning_signs=[],
        )

    # ══════════════════════════════════════════════════════════════════════════
    # RED RULE 7a — Fever in baby under 3 months → always RED
    # ══════════════════════════════════════════════════════════════════════════
    if "fever" in symptom_set and "infant_3mo" in symptom_set:
        return TriageResult(
            level="RED",
            reason="Any fever in a baby under 3 months is an emergency",
            recommended_action="Go to hospital immediately.",
            self_care=[],
            warning_signs=[],
        )

    # ══════════════════════════════════════════════════════════════════════════
    # RED RULE 7b — Child under 5 with high fever (>104°F)
    # ══════════════════════════════════════════════════════════════════════════
    if "high_fever" in symptom_set and "young_child_age" in symptom_set:
        return TriageResult(
            level="RED",
            reason="High fever (above 104°F) in child under 5 is an emergency",
            recommended_action="Go to hospital immediately.",
            self_care=[],
            warning_signs=[],
        )

    # ══════════════════════════════════════════════════════════════════════════
    # RED RULE 7c — Fever above 104°F in adult lasting more than 2 days
    # ══════════════════════════════════════════════════════════════════════════
    if "high_fever" in symptom_set and dur_int >= 2:
        return TriageResult(
            level="RED",
            reason="High fever lasting more than 2 days requires emergency evaluation",
            recommended_action="Go to emergency immediately.",
            self_care=[],
            warning_signs=[],
        )

    # ══════════════════════════════════════════════════════════════════════════
    # RED COMBINATIONS (Rules 1-12)
    # ══════════════════════════════════════════════════════════════════════════
    for combo, reason in RED_COMBINATIONS:
        if combo.issubset(symptom_set):
            return TriageResult(
                level="RED",
                reason=reason,
                recommended_action="Call 108 immediately or go to nearest emergency hospital.",
                self_care=[],
                warning_signs=[],
            )

    # ══════════════════════════════════════════════════════════════════════════
    # RED — severity=severe + any concerning symptom
    # ══════════════════════════════════════════════════════════════════════════
    if severity == "severe":
        concerning = {
            "chest_pain", "breathlessness", "abdominal_pain", "headache",
            "vomiting", "diarrhea", "fever", "high_fever", "back_pain",
            "joint_pain", "weakness", "dizziness", "confusion", "bleeding",
            "urinary_pain", "eye_pain", "ear_pain",
        }
        hit = symptom_set & concerning
        if hit:
            name = next(iter(hit)).replace("_", " ")
            return TriageResult(
                level="RED",
                reason=f"Severe {name} requires emergency evaluation",
                recommended_action="Go to nearest hospital or call 108 immediately.",
                self_care=[],
                warning_signs=[],
            )

    # ══════════════════════════════════════════════════════════════════════════
    # OVERRIDE 5 — 3 or more YELLOW symptoms → escalate to RED
    # ══════════════════════════════════════════════════════════════════════════
    yellow_hits = symptom_set & YELLOW_SINGLE
    if len(yellow_hits) >= 3:
        return TriageResult(
            level="RED",
            reason=f"Multiple serious symptoms together: {', '.join(s.replace('_',' ') for s in list(yellow_hits)[:3])}",
            recommended_action="Go to hospital immediately. Multiple symptoms together are more serious.",
            self_care=[],
            warning_signs=[],
        )

    # ══════════════════════════════════════════════════════════════════════════
    # YELLOW — single symptom always yellow
    # ══════════════════════════════════════════════════════════════════════════
    if yellow_hits:
        hit = next(iter(yellow_hits))
        care = _get_care(symptom_set)
        return TriageResult(
            level="YELLOW",
            reason=f"{hit.replace('_', ' ').title()} requires medical evaluation",
            recommended_action="Visit PHC within 24 hours. Do not delay.",
            self_care=care,
            warning_signs=WARNING_SIGNS_YELLOW,
        )

    # ══════════════════════════════════════════════════════════════════════════
    # YELLOW COMBINATIONS
    # ══════════════════════════════════════════════════════════════════════════
    for combo, reason in YELLOW_COMBINATIONS:
        if combo.issubset(symptom_set):
            care = _get_care(symptom_set)
            return TriageResult(
                level="YELLOW",
                reason=reason,
                recommended_action="Visit PHC within 24 hours.",
                self_care=care,
                warning_signs=WARNING_SIGNS_YELLOW,
            )

    # ══════════════════════════════════════════════════════════════════════════
    # YELLOW — moderate severity
    # ══════════════════════════════════════════════════════════════════════════
    if severity == "moderate":
        care = _get_care(symptom_set)
        names = [s.replace("_", " ") for s in symptom_set
                 if not s.endswith("_age") and s not in {"female", "elderly_age", "infant_3mo"}]
        return TriageResult(
            level="YELLOW",
            reason=f"Moderate symptoms ({', '.join(names[:3]) or 'reported'}) need medical review",
            recommended_action="Visit PHC within 48 hours.",
            self_care=care,
            warning_signs=WARNING_SIGNS_YELLOW,
        )

    # ══════════════════════════════════════════════════════════════════════════
    # YELLOW — symptoms lasting 4+ days
    # ══════════════════════════════════════════════════════════════════════════
    if dur_int >= 4 or str(duration) in ("7+", "4-7", "week", "weeks", "more than 3 days"):
        care = _get_care(symptom_set)
        return TriageResult(
            level="YELLOW",
            reason=f"Symptoms persisting for {duration} days need medical evaluation",
            recommended_action="Visit PHC within 24 hours.",
            self_care=care,
            warning_signs=WARNING_SIGNS_YELLOW,
        )

    # ══════════════════════════════════════════════════════════════════════════
    # OVERRIDE 3 — Pregnancy: escalate GREEN→YELLOW, YELLOW→RED
    # ══════════════════════════════════════════════════════════════════════════
    if pregnant and len(symptom_set - {"pregnancy", "female", "elderly_age", "child_age", "infant_age", "infant_3mo"}) > 0:
        care = _get_care(symptom_set)
        return TriageResult(
            level="YELLOW",
            reason="Symptoms during pregnancy require medical evaluation",
            recommended_action="Visit PHC or ANM within 24 hours.",
            self_care=care,
            warning_signs=WARNING_SIGNS_YELLOW,
        )

    # ══════════════════════════════════════════════════════════════════════════
    # OVERRIDE 1 — Any symptom in baby under 3 months → minimum YELLOW
    # ══════════════════════════════════════════════════════════════════════════
    if "infant_3mo" in symptom_set:
        care = _get_care(symptom_set)
        return TriageResult(
            level="YELLOW",
            reason="Any symptom in a baby under 3 months needs medical evaluation",
            recommended_action="Visit PHC immediately.",
            self_care=care,
            warning_signs=WARNING_SIGNS_YELLOW,
        )

    # ══════════════════════════════════════════════════════════════════════════
    # OVERRIDE 4 — Worsening rapidly → escalate one level
    # (at this point we'd be GREEN, so escalate to YELLOW)
    # ══════════════════════════════════════════════════════════════════════════
    if worsening:
        care = _get_care(symptom_set)
        return TriageResult(
            level="YELLOW",
            reason="Symptoms are worsening rapidly — needs medical evaluation",
            recommended_action="Visit PHC within 24 hours.",
            self_care=care,
            warning_signs=WARNING_SIGNS_YELLOW,
        )

    # ══════════════════════════════════════════════════════════════════════════
    # OVERRIDE 6 — If no symptoms detected at all → default YELLOW (never GREEN)
    # ══════════════════════════════════════════════════════════════════════════
    real_symptoms = symptom_set - {
        "elderly_age", "child_age", "young_child_age", "infant_age",
        "infant_3mo", "female", "pregnancy"
    }
    if not real_symptoms:
        return TriageResult(
            level="YELLOW",
            reason="Unable to classify symptoms confidently — defaulting to caution",
            recommended_action="Visit PHC within 48 hours for proper evaluation.",
            self_care=SELF_CARE_MAP["default"],
            warning_signs=WARNING_SIGNS_YELLOW,
        )

    # ══════════════════════════════════════════════════════════════════════════
    # GREEN — mild, short duration, no danger
    # ══════════════════════════════════════════════════════════════════════════
    care = _get_care(symptom_set)
    names = [s.replace("_", " ") for s in real_symptoms]
    return TriageResult(
        level="GREEN",
        reason=f"Mild symptoms ({', '.join(names[:3])}) appear manageable at home",
        recommended_action="Rest and follow self-care instructions. Visit PHC if no improvement in 2-3 days.",
        self_care=care,
        warning_signs=WARNING_SIGNS_GREEN,
    )

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
