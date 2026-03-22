import sys, os
sys.path.insert(0, os.path.dirname(__file__))

from engine.rule_engine import run_triage
from engine.symptom_keywords import SYMPTOM_KEYWORD_MAP, extract_symptoms

print(f"Total keywords: {len(SYMPTOM_KEYWORD_MAP)}")

tests = [
    (["chest_pain", "sweating"], {"has_danger_signs": False, "severity": "severe"}, 45, "M", "RED"),
    (["fever"], {"has_danger_signs": True, "severity": "mild"}, 30, "M", "RED"),
    (["unconscious"], {"has_danger_signs": False}, 30, "M", "RED"),
    (["seizure"], {"has_danger_signs": False}, 30, "M", "RED"),
    (["fever", "stiff_neck"], {"has_danger_signs": False, "severity": "moderate"}, 25, "M", "RED"),
    (["cough"], {"has_danger_signs": False, "severity": "mild"}, 30, "M", "GREEN"),
    (["fever"], {"has_danger_signs": False, "severity": "moderate"}, 30, "M", "YELLOW"),
    (["diarrhea", "vomiting", "fever"], {"has_danger_signs": False, "severity": "moderate"}, 30, "M", "YELLOW"),
    (["fever"], {"has_danger_signs": False, "severity": "mild"}, 0, "M", "RED"),  # infant
]

all_pass = True
for syms, answers, age, gender, expected in tests:
    r = run_triage(syms, answers, age, gender)
    status = "✓" if r.level == expected else "✗ FAIL"
    if r.level != expected:
        all_pass = False
    print(f"{status} {syms} age={age} sev={answers.get('severity','?')} danger={answers.get('has_danger_signs')} → {r.level} (expected {expected}): {r.reason}")

# Test keyword extraction
extracted = extract_symptoms("patient has chest pain and sweating and cannot breathe")
print(f"\nExtracted from text: {extracted}")

print(f"\n{'ALL TESTS PASSED' if all_pass else 'SOME TESTS FAILED'}")
