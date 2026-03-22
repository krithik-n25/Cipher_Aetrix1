import json
from fastapi import APIRouter, Query, Depends
from database.db import get_db
from auth.dependencies import require_role

router = APIRouter()


@router.get("/{asha_id}")
def get_patients(
    asha_id: str,
    sort_by: str = Query("follow_up_due"),
    triage: str = Query(None),
    page: int = Query(1),
    per_page: int = Query(20),
    current_user=Depends(require_role("asha", "admin")),
):
    with get_db() as conn:
        query = "SELECT * FROM assessments WHERE assessed_by = ?"
        params = [asha_id]
        if triage:
            query += " AND triage_level = ?"
            params.append(triage)
        query += f" ORDER BY {sort_by} ASC LIMIT ? OFFSET ?"
        params += [per_page, (page - 1) * per_page]
        rows = conn.execute(query, params).fetchall()
        total = conn.execute(
            "SELECT COUNT(*) FROM assessments WHERE assessed_by = ?", (asha_id,)
        ).fetchone()[0]

    patients = []
    for r in rows:
        p = dict(r)
        if p.get("symptoms"):
            try:
                p["symptoms"] = json.loads(p["symptoms"])
            except Exception:
                pass
        patients.append(p)

    return {"total": total, "page": page, "patients": patients}


@router.get("/followup-due/{asha_id}")
def get_followup_due(
    asha_id: str,
    current_user=Depends(require_role("asha", "admin")),
):
    with get_db() as conn:
        rows = conn.execute(
            """SELECT id, patient_name, triage_level, symptoms, created_at, follow_up_due
               FROM assessments WHERE assessed_by = ? AND follow_up_done = 0
               AND follow_up_due < datetime('now')""",
            (asha_id,)
        ).fetchall()
    return {"count": len(rows), "patients": [dict(r) for r in rows]}
