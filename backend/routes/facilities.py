from fastapi import APIRouter, Query
from database.db import get_db
from utils.haversine import haversine

router = APIRouter()


@router.get("/nearest")
def get_nearest(
    lat: float = Query(...),
    lng: float = Query(...),
    triage_level: str = Query(...),
    district: str = Query(...),
):
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

    facilities = []
    for r in rows:
        f = dict(r)
        f["distance_km"] = round(haversine(lat, lng, f["lat"], f["lng"]), 1)
        f["embed_url"] = f"https://www.openstreetmap.org/?mlat={f['lat']}&mlon={f['lng']}&zoom=15"
        f["directions_url"] = f"https://www.google.com/maps/dir/?api=1&destination={f['lat']},{f['lng']}"
        f["call_url"] = f"tel:{f['phone']}" if f.get("phone") else None
        facilities.append(f)

    facilities.sort(key=lambda x: x["distance_km"])
    return {"facilities": facilities[:3]}
