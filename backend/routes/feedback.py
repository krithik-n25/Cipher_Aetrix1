import uuid
from datetime import datetime
from fastapi import APIRouter, HTTPException
from models.schemas import FeedbackSchema
from database.db import get_db

router = APIRouter()


@router.post("/{assessment_id}")
def submit_feedback(assessment_id: str, body: FeedbackSchema):
    with get_db() as conn:
        row = conn.execute(
            "SELECT id, triage_level FROM assessments WHERE id = ?", (assessment_id,)
        ).fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Assessment not found")

        triage_level = row["triage_level"]
        accurate = None
        if body.visited_facility is not None:
            if triage_level == "RED" and body.visited_facility:
                accurate = True
            elif triage_level == "YELLOW" and body.visited_facility:
                accurate = True
            elif triage_level == "GREEN" and body.outcome == "better":
                accurate = True
            else:
                accurate = False

        conn.execute(
            """INSERT INTO feedback (id, assessment_id, visited_facility, outcome,
               patient_satisfied, doctor_diagnosis, triage_was_accurate, submitted_by)
               VALUES (?,?,?,?,?,?,?,?)""",
            (str(uuid.uuid4()), assessment_id, body.visited_facility,
             body.outcome, body.patient_satisfied, body.doctor_diagnosis,
             accurate, None)
        )
        conn.execute(
            """UPDATE assessments SET follow_up_done = 1, follow_up_outcome = ?,
               visited_facility = ? WHERE id = ?""",
            (body.outcome, body.visited_facility, assessment_id)
        )

    return {
        "message": "Follow-up recorded",
        "redirect_to_assessment": body.outcome == "worse",
    }


@router.get("/pending/{user_id}")
def get_pending(user_id: str):
    with get_db() as conn:
        rows = conn.execute(
            """SELECT id, patient_name, triage_level, symptoms, created_at, follow_up_due
               FROM assessments
               WHERE assessed_by = ? AND follow_up_done = 0
               AND follow_up_due < datetime('now')""",
            (user_id,)
        ).fetchall()
    return {"pending": [dict(r) for r in rows]}
