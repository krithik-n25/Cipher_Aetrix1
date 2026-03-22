# database.md — Supabase Database Layer
### Margdarshak Backend — `backend/database/`

---

## Overview

```
database/
└── supabase_client.py      # Single Supabase client instance, imported everywhere
```

Database: Supabase (PostgreSQL under the hood)
ORM: None — direct Supabase Python client (supabase-py)
RLS: Enabled on all tables (see schema doc)

---

## `supabase_client.py`

```python
# backend/database/supabase_client.py

import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise RuntimeError("SUPABASE_URL and SUPABASE_KEY must be set in .env")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
```

### Usage in routes
```python
from database.supabase_client import supabase

# In any route file:
result = supabase.table("assessments").insert({...}).execute()
data = supabase.table("facilities").select("*").eq("district", "Beed").execute()
```

---

## MCP Integration (Supabase MCP)

Supabase MCP (Model Context Protocol) enables AI-assisted database operations.
Use it for: running migrations, generating seed data, debugging queries, and
inspecting table structure during development.

### Setup

```bash
# In your MCP config (claude_desktop_config.json or similar):
{
  "mcpServers": {
    "supabase": {
      "command": "npx",
      "args": ["-y", "@supabase/mcp-server-supabase@latest",
               "--supabase-url", "YOUR_SUPABASE_URL",
               "--supabase-service-role-key", "YOUR_SERVICE_ROLE_KEY"]
    }
  }
}
```

Use the **service role key** (not anon key) for MCP — it bypasses RLS,
which is what you want when running migrations and seeding data.
The anon key goes in `.env` for the actual running backend.

---

## Table-by-Table Query Reference

### `users` table

```python
# Get user by phone (for login)
supabase.table("users")\
    .select("*")\
    .eq("phone", phone)\
    .single()\
    .execute()

# Get all ASHA workers in a district
supabase.table("users")\
    .select("id, name, asha_id, block, village")\
    .eq("role", "asha")\
    .eq("district", district)\
    .eq("is_active", True)\
    .execute()

# Update last login
supabase.table("users")\
    .update({"last_login": datetime.utcnow().isoformat()})\
    .eq("id", user_id)\
    .execute()
```

---

### `assessments` table

```python
# Insert new assessment (core write operation)
supabase.table("assessments").insert({
    "session_id": session_id,
    "assessed_by": user_id,
    "assessed_by_role": role,
    "patient_age": age,
    "patient_gender": gender,
    "patient_type": patient_type,
    "village": village,
    "block": block,
    "district": district,
    "patient_lat": lat,
    "patient_lng": lng,
    "raw_input_text": raw_text,
    "raw_input_language": language,
    "translated_text": english_text,
    "symptoms": symptoms,                   # list → stored as text[]
    "symptom_answers": answers,             # dict → stored as jsonb
    "triage_level": level,
    "triage_reason": reason,
    "recommended_action": action,
    "self_care_instructions": self_care,    # list → text[]
    "warning_signs": warning_signs,         # list → text[]
    "facility_id": facility_id,
    "facility_name": facility_name,
    "facility_distance_km": distance,
    "follow_up_due": follow_up_due.isoformat(),
    "follow_up_done": False
}).execute()

# Get all assessments by ASHA worker, sorted by follow-up due
supabase.table("assessments")\
    .select("*")\
    .eq("assessed_by", asha_id)\
    .order("follow_up_due", desc=False)\
    .execute()

# Get pending follow-ups for a user/ASHA
supabase.table("assessments")\
    .select("id, patient_name, triage_level, symptoms, follow_up_due")\
    .eq("assessed_by", user_id)\
    .eq("follow_up_done", False)\
    .lt("follow_up_due", datetime.utcnow().isoformat())\
    .execute()

# Admin: today's totals by triage level
from datetime import date
today = date.today().isoformat()

supabase.table("assessments")\
    .select("triage_level")\
    .eq("district", district)\
    .gte("created_at", today)\
    .execute()
# Then count in Python: Counter(r["triage_level"] for r in result.data)

# Admin heatmap: symptom count by block
# NOTE: Supabase doesn't support GROUP BY directly via client
# Use Supabase RPC (stored procedure) for this:
supabase.rpc("get_symptom_heatmap", {
    "p_district": district,
    "p_from": from_date,
    "p_to": to_date
}).execute()
```

---

### `facilities` table

```python
# Get all active facilities in a district (for Haversine sorting in Python)
supabase.table("facilities")\
    .select("id, name, type, lat, lng, phone, hours, is_24hr, has_emergency, block")\
    .eq("district", district)\
    .eq("is_active", True)\
    .execute()

# Get only emergency facilities (for RED triage)
supabase.table("facilities")\
    .select("*")\
    .eq("district", district)\
    .eq("has_emergency", True)\
    .eq("is_active", True)\
    .execute()
```

---

### `outbreak_alerts` table

```python
# Get all active alerts for admin's district
supabase.table("outbreak_alerts")\
    .select("*")\
    .eq("district", district)\
    .eq("status", "ACTIVE")\
    .order("severity", desc=True)\
    .execute()

# Check if outbreak alert already exists for a block+symptom cluster
supabase.table("outbreak_alerts")\
    .select("id, case_count")\
    .eq("block", block)\
    .eq("district", district)\
    .eq("status", "ACTIVE")\
    .contains("symptom_cluster", symptom_list)\
    .execute()

# Update outbreak status (admin action)
supabase.table("outbreak_alerts")\
    .update({
        "status": new_status,
        "actions_taken": updated_actions_jsonb,
        "admin_notes": notes,
        "last_updated": datetime.utcnow().isoformat()
    })\
    .eq("id", alert_id)\
    .execute()
```

---

### `feedback` table

```python
# Insert follow-up feedback
supabase.table("feedback").insert({
    "assessment_id": assessment_id,
    "visited_facility": visited,
    "outcome": outcome,
    "patient_satisfied": satisfied,
    "doctor_diagnosis": diagnosis,
    "triage_was_accurate": is_accurate,
    "submitted_by": user_id,
}).execute()

# Also update the parent assessment row
supabase.table("assessments")\
    .update({
        "follow_up_done": True,
        "follow_up_outcome": outcome,
        "visited_facility": visited
    })\
    .eq("id", assessment_id)\
    .execute()
```

---

### `sessions` table

```python
# Create anonymous session
import secrets
session_token = secrets.token_urlsafe(32)

supabase.table("sessions").insert({
    "session_token": session_token,
    "language": language,
    "village": village,
    "block": block,
    "district": district,
}).execute()

# Get session by token
supabase.table("sessions")\
    .select("*")\
    .eq("session_token", token)\
    .single()\
    .execute()
```

---

## Stored Procedures (Supabase RPC)

Some queries can't be done cleanly with the Supabase client's filter API.
Define these as PostgreSQL functions and call them via `.rpc()`.

### `get_symptom_heatmap`
```sql
-- Run this in Supabase SQL editor
create or replace function get_symptom_heatmap(
    p_district text,
    p_from date,
    p_to date
)
returns table (
    block text,
    symptom text,
    count bigint
)
language sql
as $$
    select
        block,
        unnest(symptoms) as symptom,
        count(*) as count
    from assessments
    where district = p_district
      and created_at::date between p_from and p_to
    group by block, symptom
    order by block, count desc;
$$;
```

### `get_daily_summary`
```sql
create or replace function get_daily_summary(
    p_district text,
    p_date date
)
returns table (
    triage_level text,
    count bigint
)
language sql
as $$
    select triage_level, count(*)
    from assessments
    where district = p_district
      and created_at::date = p_date
    group by triage_level;
$$;
```

### `get_asha_stats`
```sql
create or replace function get_asha_stats(
    p_district text,
    p_from date,
    p_to date
)
returns table (
    user_id uuid,
    name text,
    asha_id text,
    block text,
    total_assessments bigint,
    followups_completed bigint,
    last_active timestamp
)
language sql
as $$
    select
        u.id,
        u.name,
        u.asha_id,
        u.block,
        count(a.id) as total_assessments,
        count(a.id) filter (where a.follow_up_done = true) as followups_completed,
        max(a.created_at) as last_active
    from users u
    left join assessments a
        on a.assessed_by = u.id
        and a.created_at::date between p_from and p_to
    where u.role = 'asha'
      and u.district = p_district
    group by u.id, u.name, u.asha_id, u.block;
$$;
```

---

## `.env` Variables

```env
SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
# Use anon key for backend. Use service role key only for MCP/migrations.
```

---

## Error Handling Pattern

```python
def safe_query(query_func):
    """Wrapper for Supabase queries with consistent error handling."""
    try:
        result = query_func()
        return result.data, None
    except Exception as e:
        print(f"[supabase] Query failed: {e}")
        return None, str(e)

# Usage:
data, error = safe_query(
    lambda: supabase.table("assessments").select("*").eq("id", id).single().execute()
)
if error:
    raise HTTPException(status_code=500, detail="Database error")
```

---

## Seed Data Execution

Run the seed in order (foreign key dependencies):
```
1. users (admin first, then ASHA workers)
2. facilities
3. assessments (needs user IDs + facility IDs)
4. outbreak_alerts (needs assessments to exist)
5. feedback (needs assessments)
```

Execute via Supabase dashboard → SQL Editor, or via MCP:
```
Run the contents of supabase/seed.sql
```
