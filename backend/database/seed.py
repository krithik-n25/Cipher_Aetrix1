"""Seed realistic demo data into SQLite database."""
import sys
import os
import uuid
import json
import random
import bcrypt
from datetime import datetime, timedelta

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from database.db import get_db, init_db

def hash_pw(pw: str) -> str:
    return bcrypt.hashpw(pw.encode(), bcrypt.gensalt()).decode()

def rand_date(days_ago_max=30, days_ago_min=0):
    delta = random.randint(days_ago_min, days_ago_max)
    dt = datetime.now() - timedelta(days=delta, hours=random.randint(0,23), minutes=random.randint(0,59))
    return dt.strftime("%Y-%m-%d %H:%M:%S")

def today_date(hours_ago_max=8):
    """Return a timestamp from earlier today."""
    dt = datetime.now() - timedelta(hours=random.randint(0, hours_ago_max), minutes=random.randint(0, 59))
    return dt.strftime("%Y-%m-%d %H:%M:%S")

PATIENT_NAMES = [
    "Ramesh Jadhav","Sunita Pawar","Mohan Shinde","Priya Kamble","Arjun Patil",
    "Kavita Deshmukh","Suresh Bhosale","Anita Salve","Vijay Mane","Rekha Gaikwad",
    "Santosh Kale","Meena Thorat","Prakash Waghmare","Lata Dhole","Ganesh Nimbalkar",
    "Sushma Jagtap","Dilip Chavan","Vandana Shirke","Rajesh Lokhande","Pooja Bankar",
    "Anil Wagh","Savita Kulkarni","Sunil Yadav","Nanda Pawar","Balu Shinde",
    "Usha Kamble","Kiran Patil","Mangal Jadhav","Raju Bhosale","Sita Salve",
    "Harish Mane","Geeta Gaikwad","Vinod Kale","Pushpa Thorat","Manoj Waghmare",
    "Shobha Dhole","Ashok Nimbalkar","Radha Jagtap","Deepak Chavan","Nirmala Shirke",
]

SYMPTOM_POOLS = {
    "RED":    [["chest pain","shortness of breath"],["high fever","seizure"],["severe bleeding"],
               ["unconscious","head injury"],["chest pain","sweating","arm pain"],
               ["difficulty breathing","cyanosis"],["severe abdominal pain","vomiting blood"]],
    "YELLOW": [["fever","headache"],["cough","cold","body ache"],["vomiting","diarrhea"],
               ["stomach pain","nausea"],["fever","rash"],["joint pain","swelling"],
               ["ear pain","discharge"],["eye redness","discharge"],["back pain","fever"],
               ["urinary pain","burning"]],
    "GREEN":  [["mild cough"],["cold","runny nose"],["mild fever"],["headache"],
               ["skin rash","itching"],["mild stomach ache"],["fatigue","weakness"],
               ["sore throat"],["mild body ache"],["insomnia"]],
}

ACTIONS = {
    "RED":    "Call 108 immediately. Do not delay.",
    "YELLOW": "Visit nearest PHC within 24 hours.",
    "GREEN":  "Rest at home. Take ORS if needed.",
}

SELF_CARE = {
    "RED":    ["Do not move patient unnecessarily","Keep airway clear","Call 108 now"],
    "YELLOW": ["Take paracetamol for fever","Stay hydrated","Rest","Visit PHC if no improvement"],
    "GREEN":  ["Rest well","Drink plenty of fluids","Eat light food","Monitor symptoms"],
}

WARNINGS = {
    "RED":    ["Loss of consciousness","Breathing stops","Pulse becomes weak"],
    "YELLOW": ["Fever above 104F","Vomiting blood","Severe chest pain"],
    "GREEN":  ["Fever persists beyond 3 days","Symptoms worsen","New symptoms appear"],
}

BLOCKS   = ["Gevrai","Ashti","Patoda","Shirur","Kaij"]
VILLAGES = {
    "Gevrai": ["Gevrai","Wadgaon","Pimpalgaon","Nandgaon","Ranjangaon"],
    "Ashti":  ["Ashti","Khadgaon","Shirpur","Mandwa","Tembhurni"],
    "Patoda": ["Patoda","Pimpri","Khandala","Dhoki","Rajuri"],
    "Shirur": ["Shirur","Karegaon","Pangri","Wanjarwadi","Bhogaon"],
    "Kaij":   ["Kaij","Pangri","Nandgaon","Wadwani","Majalgaon"],
}

def seed():
    init_db()
    with get_db() as conn:
        # ── Users ──────────────────────────────────────────────
        conn.execute("DELETE FROM users")
        asha_ids = []
        users = [
            (str(uuid.uuid4()), "Admin Beed",    "9876543210", hash_pw("admin123"),
             "admin", None,     None,     "Beed", None,           "MH-BED-01", "hi"),
        ]
        asha_data = [
            ("Sunita Kamble", "9876543211", "Gevrai", "Gevrai", "ASHA-BED-001"),
            ("Rekha Pawar",   "9876543212", "Ashti",  "Ashti",  "ASHA-BED-002"),
            ("Meena Jadhav",  "9876543213", "Parli",  "Patoda", "ASHA-BED-003"),
            ("Kavita Shinde", "9876543214", "Shirur", "Shirur", "ASHA-BED-004"),
            ("Anita Deshmukh","9876543215", "Kaij",   "Kaij",   "ASHA-BED-005"),
        ]
        for name, phone, village, block, asha_id in asha_data:
            uid = str(uuid.uuid4())
            asha_ids.append((uid, block))
            users.append((uid, name, phone, hash_pw("asha123"),
                          "asha", village, block, "Beed", asha_id, None, "mr"))

        conn.executemany(
            "INSERT INTO users (id,name,phone,password_hash,role,village,block,district,asha_id,district_code,language) VALUES (?,?,?,?,?,?,?,?,?,?,?)",
            users
        )

        # ── Facilities ─────────────────────────────────────────
        conn.execute("DELETE FROM facilities")
        fac_rows = [
            (str(uuid.uuid4()), "PHC Gevrai",             "PHC",              "Beed","Gevrai","Gevrai, Beed",   18.9825,75.7123,"02446-234001","9am-4pm",0,0),
            (str(uuid.uuid4()), "CHC Ashti",              "CHC",              "Beed","Ashti", "Ashti, Beed",    18.7200,75.9800,"02446-234002","8am-8pm",0,1),
            (str(uuid.uuid4()), "District Hospital Beed", "District Hospital","Beed","Beed",  "Beed City",      18.9890,75.7600,"02442-222001","24 hours",1,1),
            (str(uuid.uuid4()), "PHC Patoda",             "PHC",              "Beed","Patoda","Patoda, Beed",   18.6500,76.2000,"02446-234004","9am-4pm",0,0),
            (str(uuid.uuid4()), "PHC Shirur",             "PHC",              "Beed","Shirur","Shirur, Beed",   18.8200,75.8900,"02446-234005","9am-4pm",0,0),
            (str(uuid.uuid4()), "PHC Kaij",               "PHC",              "Beed","Kaij",  "Kaij, Beed",     18.8500,76.5600,"02446-234006","9am-4pm",0,0),
            (str(uuid.uuid4()), "Sub-Centre Wadgaon",     "Sub-Centre",       "Beed","Gevrai","Wadgaon, Gevrai",18.9600,75.6900,None,          "9am-2pm",0,0),
        ]
        fac_id_map = {r[4]: r[0] for r in fac_rows}  # block -> facility_id
        fac_name_map = {r[4]: r[1] for r in fac_rows}
        conn.executemany(
            "INSERT INTO facilities (id,name,type,district,block,address,lat,lng,phone,hours,is_24hr,has_emergency) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)",
            fac_rows
        )

        # ── Assessments ────────────────────────────────────────
        conn.execute("DELETE FROM assessments")
        assessments = []

        def make_assessment(created_fn):
            level = random.choices(["RED","YELLOW","GREEN"], weights=[10,35,55])[0]
            syms  = random.choice(SYMPTOM_POOLS[level])
            asha_uid, block = random.choice(asha_ids)
            village = random.choice(VILLAGES.get(block, ["Unknown"]))
            name    = random.choice(PATIENT_NAMES)
            age     = random.randint(5, 80)
            gender  = random.choice(["M","F"])
            created = created_fn()
            follow_due = (datetime.strptime(created, "%Y-%m-%d %H:%M:%S") + timedelta(days=2)).strftime("%Y-%m-%d %H:%M:%S")
            follow_done = 1 if random.random() < 0.65 else 0
            fac_id   = fac_id_map.get(block)
            fac_name = fac_name_map.get(block)
            return (
                str(uuid.uuid4()), str(uuid.uuid4()),
                asha_uid, "asha",
                name, age, gender, "other",
                village, block, "Beed",
                None, None,
                " ".join(syms), "hi",
                json.dumps(syms), json.dumps({}),
                f"Patient reported {', '.join(syms)}",
                level,
                f"Based on symptoms: {', '.join(syms)}",
                ACTIONS[level],
                json.dumps(SELF_CARE[level]),
                json.dumps(WARNINGS[level]),
                fac_id, fac_name,
                round(random.uniform(0.5, 4.5), 1),
                follow_due, follow_done,
                None, 1 if level in ("RED","YELLOW") and random.random() < 0.7 else 0,
                created,
            )

        # 20 assessments from TODAY (so dashboards show live data)
        for _ in range(20):
            assessments.append(make_assessment(today_date))

        # 100 historical assessments over past 30 days
        for _ in range(100):
            assessments.append(make_assessment(lambda: rand_date(days_ago_max=30, days_ago_min=1)))

        conn.executemany("""
            INSERT INTO assessments (
                id, session_id, assessed_by, assessed_by_role,
                patient_name, patient_age, patient_gender, patient_type,
                village, block, district,
                patient_lat, patient_lng,
                raw_input_text, raw_input_language,
                symptoms, symptom_answers, conversation_summary,
                triage_level, triage_reason, recommended_action,
                self_care_instructions, warning_signs,
                facility_id, facility_name, facility_distance_km,
                follow_up_due, follow_up_done, follow_up_outcome, visited_facility,
                created_at
            ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
        """, assessments)

        # ── Outbreak Alerts ────────────────────────────────────
        conn.execute("DELETE FROM outbreak_alerts")
        outbreaks = [
            (str(uuid.uuid4()), "Gevrai", "Beed",
             json.dumps(["Fever","Rash"]), 18,
             json.dumps(["Gevrai","Wadgaon","Pimpalgaon"]),
             "HIGH", "ACTIVE",
             (datetime.now()-timedelta(days=3)).strftime("%Y-%m-%d %H:%M:%S"),
             datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
             json.dumps([{"action":"phc_notified","by":"admin"}]), "Suspected viral outbreak"),
            (str(uuid.uuid4()), "Ashti", "Beed",
             json.dumps(["Diarrhea","Vomiting"]), 22,
             json.dumps(["Ashti","Khadgaon","Shirpur","Mandwa"]),
             "CRITICAL", "INVESTIGATING",
             (datetime.now()-timedelta(days=5)).strftime("%Y-%m-%d %H:%M:%S"),
             datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
             json.dumps([{"action":"phc_notified","by":"admin"},{"action":"rrt_deployed","by":"admin"}]),
             "Water contamination suspected"),
        ]
        conn.executemany("""
            INSERT INTO outbreak_alerts
            (id,block,district,symptom_cluster,case_count,affected_villages,severity,status,
             first_reported,last_updated,actions_taken,admin_notes)
            VALUES (?,?,?,?,?,?,?,?,?,?,?,?)
        """, outbreaks)

        # ── Feedback ───────────────────────────────────────────
        conn.execute("DELETE FROM feedback")
        assessment_ids = conn.execute(
            "SELECT id FROM assessments WHERE follow_up_done = 1 LIMIT 40"
        ).fetchall()
        feedbacks = []
        for row in assessment_ids:
            feedbacks.append((
                str(uuid.uuid4()), row["id"],
                random.choice([0,1]),
                random.choice(["better","better","same","worse"]),
                random.choice([0,1]),
                None,
                random.choice([0,1]),
                None,
                rand_date(days_ago_max=25),
            ))
        conn.executemany("""
            INSERT INTO feedback
            (id,assessment_id,visited_facility,outcome,patient_satisfied,
             doctor_diagnosis,triage_was_accurate,submitted_by,created_at)
            VALUES (?,?,?,?,?,?,?,?,?)
        """, feedbacks)

    print("Database seeded with rich demo data!")
    print("")
    print("Login credentials:")
    print("  Admin  : 9876543210 / admin123")
    print("  ASHA 1 : 9876543211 / asha123  (Sunita Kamble, Gevrai)")
    print("  ASHA 2 : 9876543212 / asha123  (Rekha Pawar, Ashti)")
    print("  ASHA 3 : 9876543213 / asha123  (Meena Jadhav, Patoda)")
    print("  ASHA 4 : 9876543214 / asha123  (Kavita Shinde, Shirur)")
    print("  ASHA 5 : 9876543215 / asha123  (Anita Deshmukh, Kaij)")

if __name__ == "__main__":
    seed()
