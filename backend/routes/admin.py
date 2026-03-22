import json
from datetime import date, timedelta
from fastapi import APIRouter, Query, Depends, HTTPException
from database.db import get_db
from auth.dependencies import require_role
from models.schemas import OutbreakUpdateSchema

router = APIRouter()


@router.get("/summary")
def get_summary(current_user=Depends(require_role("admin"))):
    district = current_user["district"]
    today = date.today().isoformat()
    with get_db() as conn:
        rows = conn.execute(
            "SELECT triage_level FROM assessments WHERE district = ? AND date(created_at) = ?",
            (district, today)
        ).fetchall()
        alerts = conn.execute(
            "SELECT COUNT(*) FROM outbreak_alerts WHERE district = ? AND status = 'ACTIVE'",
            (district,)
        ).fetchone()[0]
        active_ashas = conn.execute(
            """SELECT COUNT(DISTINCT assessed_by) FROM assessments
               WHERE district = ? AND date(created_at) = ? AND assessed_by_role = 'asha'""",
            (district, today)
        ).fetchone()[0]

    totals = {"all": len(rows), "RED": 0, "YELLOW": 0, "GREEN": 0}
    for r in rows:
        totals[r["triage_level"]] = totals.get(r["triage_level"], 0) + 1

    return {
        "date": today,
        "district": district,
        "totals": totals,
        "active_outbreak_alerts": alerts,
        "active_ashas_today": active_ashas,
    }


@router.get("/heatmap")
def get_heatmap(
    period: str = Query("week"),
    current_user=Depends(require_role("admin")),
):
    district = current_user["district"]
    days = {"today": 1, "week": 7, "month": 30}.get(period, 7)
    from_date = (date.today() - timedelta(days=days)).isoformat()

    with get_db() as conn:
        rows = conn.execute(
            "SELECT block, symptoms FROM assessments WHERE district = ? AND date(created_at) >= ?",
            (district, from_date)
        ).fetchall()

    data: dict = {}
    blocks = set()
    symptoms_set = set()

    for r in rows:
        block = r["block"] or "Unknown"
        blocks.add(block)
        try:
            syms = json.loads(r["symptoms"] or "[]")
        except Exception:
            syms = []
        if block not in data:
            data[block] = {}
        for s in syms:
            symptoms_set.add(s)
            data[block][s] = data[block].get(s, 0) + 1

    return {
        "period": period,
        "blocks": sorted(blocks),
        "symptoms": sorted(symptoms_set),
        "data": data,
    }


@router.get("/phc-load")
def get_phc_load(current_user=Depends(require_role("admin"))):
    district = current_user["district"]
    today = date.today().isoformat()
    with get_db() as conn:
        rows = conn.execute(
            """SELECT facility_name, facility_id, block, COUNT(*) as count
               FROM assessments WHERE district = ? AND date(created_at) = ?
               AND triage_level IN ('RED','YELLOW')
               GROUP BY facility_name, facility_id, block""",
            (district, today)
        ).fetchall()

    phcs = []
    for r in rows:
        count = r["count"]
        status = "NORMAL" if count <= 10 else "MODERATE" if count <= 20 else "OVERLOADED"
        phcs.append({
            "facility_id": r["facility_id"],
            "name": r["facility_name"],
            "block": r["block"],
            "referrals_today": count,
            "status": status,
        })
    return {"phcs": phcs}


@router.get("/asha-activity")
def get_asha_activity(current_user=Depends(require_role("admin"))):
    district = current_user["district"]
    week_ago = (date.today() - timedelta(days=7)).isoformat()
    with get_db() as conn:
        users = conn.execute(
            "SELECT id, name, asha_id, block FROM users WHERE district = ? AND role = 'asha' AND is_active = 1",
            (district,)
        ).fetchall()
        ashas = []
        for u in users:
            stats = conn.execute(
                """SELECT COUNT(*) as total,
                   SUM(CASE WHEN follow_up_done = 1 THEN 1 ELSE 0 END) as done,
                   MAX(created_at) as last_active
                   FROM assessments WHERE assessed_by = ? AND date(created_at) >= ?""",
                (u["id"], week_ago)
            ).fetchone()
            total = stats["total"] or 0
            done = stats["done"] or 0
            ashas.append({
                "user_id": u["id"],
                "name": u["name"],
                "asha_id": u["asha_id"],
                "block": u["block"],
                "assessments_this_week": total,
                "followups_completed": done,
                "followup_rate": round(done / total * 100) if total else 0,
                "last_active": stats["last_active"],
                "is_inactive": total == 0,
            })
    return {"ashas": ashas}


@router.get("/outbreaks")
def get_outbreaks(current_user=Depends(require_role("admin"))):
    district = current_user["district"]
    with get_db() as conn:
        rows = conn.execute(
            "SELECT * FROM outbreak_alerts WHERE district = ? ORDER BY severity DESC",
            (district,)
        ).fetchall()
    alerts = []
    for r in rows:
        a = dict(r)
        for field in ("symptom_cluster", "affected_villages", "actions_taken"):
            try:
                a[field] = json.loads(a[field] or "[]")
            except Exception:
                a[field] = []
        alerts.append(a)
    return {"alerts": alerts}


@router.patch("/outbreaks/{alert_id}")
def update_outbreak(
    alert_id: str,
    body: OutbreakUpdateSchema,
    current_user=Depends(require_role("admin")),
):
    with get_db() as conn:
        row = conn.execute(
            "SELECT * FROM outbreak_alerts WHERE id = ?", (alert_id,)
        ).fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Alert not found")

        updates = {}
        if body.status:
            updates["status"] = body.status
        if body.notes:
            updates["admin_notes"] = body.notes
        if body.action:
            try:
                actions = json.loads(row["actions_taken"] or "[]")
            except Exception:
                actions = []
            actions.append({"action": body.action, "by": current_user["user_id"]})
            updates["actions_taken"] = json.dumps(actions)

        if updates:
            set_clause = ", ".join(f"{k} = ?" for k in updates)
            conn.execute(
                f"UPDATE outbreak_alerts SET {set_clause} WHERE id = ?",
                list(updates.values()) + [alert_id]
            )
    return {"message": "Alert updated"}


@router.get("/reports")
def get_reports(
    report_type: str = Query("weekly_summary"),
    from_date: str = Query(...),
    to_date: str = Query(...),
    block: str = Query(None),
    current_user=Depends(require_role("admin")),
):
    district = current_user["district"]
    with get_db() as conn:
        query = "SELECT * FROM assessments WHERE district = ? AND date(created_at) BETWEEN ? AND ?"
        params = [district, from_date, to_date]
        if block:
            query += " AND block = ?"
            params.append(block)
        rows = conn.execute(query, params).fetchall()

    total = len(rows)
    breakdown = {"RED": 0, "YELLOW": 0, "GREEN": 0}
    symptom_counts: dict = {}
    for r in rows:
        breakdown[r["triage_level"]] = breakdown.get(r["triage_level"], 0) + 1
        try:
            for s in json.loads(r["symptoms"] or "[]"):
                symptom_counts[s] = symptom_counts.get(s, 0) + 1
        except Exception:
            pass

    top_symptoms = sorted(symptom_counts.items(), key=lambda x: x[1], reverse=True)[:10]

    return {
        "report_type": report_type,
        "district": district,
        "period": {"from": from_date, "to": to_date},
        "total_assessments": total,
        "triage_breakdown": breakdown,
        "top_symptoms": [{"symptom": s, "count": c} for s, c in top_symptoms],
        "opd_deflection_estimate": breakdown.get("GREEN", 0),
    }
