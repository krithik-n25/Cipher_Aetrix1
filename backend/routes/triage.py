import uuid
import json
import asyncio
from datetime import datetime, timedelta
from fastapi import APIRouter, HTTPException
from models.schemas import TriageRequestSchema
from engine.rule_engine import run_triage, FOLLOW_UP_HOURS
from engine.symptom_keywords import extract_symptoms
from database.db import get_db
from utils.haversine import haversine

router = APIRouter()


def _get_nearest_facility(district: str, lat: float | None, lng: float | None, triage_level: str):
    with get_db() as conn:
        if triage_level == "RED":
            rows = conn.execute(
                "SELECT * FROM facilities WHERE district = ? AND has_emergency = 1 AND is_active = 1",
                (district,)
            ).fetchall()
        else:
            rows = conn.execute(
                "SELECT * FROM facilities WHERE district = ? AND is_active = 1",
                (district,)
            ).fetchall()

    if not rows:
        return None

    facilities = [dict(r) for r in rows]

    if lat and lng:
        for f in facilities:
            f["distance_km"] = haversine(lat, lng, f["lat"], f["lng"])
        facilities.sort(key=lambda x: x["distance_km"])
    else:
        for f in facilities:
            f["distance_km"] = 0.0

    f = facilities[0]
    return {
        "id": f["id"],
        "name": f["name"],
        "type": f["type"],
        "distance_km": round(f["distance_km"], 1),
        "phone": f.get("phone"),
        "hours": f.get("hours"),
        "is_24hr": bool(f.get("is_24hr")),
        "lat": f["lat"],
        "lng": f["lng"],
        "embed_url": f"https://www.openstreetmap.org/?mlat={f['lat']}&mlon={f['lng']}&zoom=15",
        "directions_url": f"https://www.google.com/maps/dir/?api=1&destination={f['lat']},{f['lng']}",
        "call_url": f"tel:{f['phone']}" if f.get("phone") else None,
    }


@router.post("/assess")
def assess(body: TriageRequestSchema):
    # Extract symptoms from conversation summary if symptoms list is empty
    symptoms = body.symptoms or []
    if not symptoms and body.conversation_summary:
        symptoms = extract_symptoms(body.conversation_summary)
    if not symptoms and body.raw_input_text:
        symptoms = extract_symptoms(body.raw_input_text)
    if not symptoms:
        symptoms = ["general_discomfort"]

    answers = body.symptom_answers or {}

    result = run_triage(
        symptoms=symptoms,
        answers=answers,
        age=body.patient_age or 30,
        gender=body.patient_gender or "other",
    )

    district = body.district or "Beed"
    facility = _get_nearest_facility(district, body.patient_lat, body.patient_lng, result.level)

    follow_up_hours = FOLLOW_UP_HOURS.get(result.level)
    follow_up_due = None
    if follow_up_hours:
        follow_up_due = (datetime.utcnow() + timedelta(hours=follow_up_hours)).isoformat()

    assessment_id = str(uuid.uuid4())

    with get_db() as conn:
        conn.execute(
            """INSERT INTO assessments
            (id, session_id, assessed_by, assessed_by_role, patient_name,
             patient_age, patient_gender, patient_type, village, block, district,
             patient_lat, patient_lng, raw_input_text, raw_input_language,
             symptoms, symptom_answers, conversation_summary,
             triage_level, triage_reason, recommended_action,
             self_care_instructions, warning_signs,
             facility_id, facility_name, facility_distance_km,
             follow_up_due, follow_up_done)
            VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)""",
            (
                assessment_id,
                body.session_id,
                body.assessed_by,
                body.assessed_by_role,
                body.patient_name,
                body.patient_age,
                body.patient_gender,
                body.patient_type,
                body.village,
                body.block,
                district,
                body.patient_lat,
                body.patient_lng,
                body.raw_input_text,
                body.raw_input_language,
                json.dumps(symptoms),
                json.dumps(answers),
                body.conversation_summary,
                result.level,
                result.reason,
                result.recommended_action,
                json.dumps(result.self_care),
                json.dumps(result.warning_signs),
                facility["id"] if facility else None,
                facility["name"] if facility else None,
                facility["distance_km"] if facility else None,
                follow_up_due,
                0,
            )
        )

    return {
        "assessment_id": assessment_id,
        "triage_level": result.level,
        "triage_reason": result.reason,
        "recommended_action": result.recommended_action,
        "self_care_instructions": result.self_care,
        "warning_signs": result.warning_signs,
        "facility": facility,
        "follow_up_due": follow_up_due,
        "emergency_call_url": "tel:108" if result.level == "RED" else None,
    }
