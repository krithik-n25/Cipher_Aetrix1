# setup.md — Environment, Config & Build Order
### Margdarshak Backend

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend framework | FastAPI (Python 3.11+) |
| ASGI server | Uvicorn |
| Database | Supabase (PostgreSQL) |
| DB client | supabase-py |
| HTTP client | httpx (async) |
| Auth | PyJWT + bcrypt |
| Translation | LibreTranslate (free, no billing) |
| Maps embed | OpenStreetMap (free) |
| Maps directions | Google Maps deep link (no API key) |
| Validation | Pydantic v2 |

---

## `requirements.txt`

```
fastapi==0.111.0
uvicorn[standard]==0.29.0
supabase==2.4.6
httpx==0.27.0
python-dotenv==1.0.1
pyjwt==2.8.0
bcrypt==4.1.2
pydantic==2.7.1
```

---

## `.env` Template

```env
# Supabase
SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
SUPABASE_KEY=eyJ...        # anon key (use service role only for MCP/migrations)

# LibreTranslate (get free key at libretranslate.com)
LIBRETRANSLATE_URL=https://libretranslate.com
LIBRETRANSLATE_API_KEY=your_key_here

# JWT
JWT_SECRET=generate_a_long_random_string_here
JWT_EXPIRY_DAYS=7

# App
ENVIRONMENT=development
PORT=8000
```

---

## `main.py` Structure

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes import auth, triage, facilities, feedback, patients, admin

app = FastAPI(
    title="Margdarshak API",
    description="Multilingual rural health triage system",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "https://margdarshak.in"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router,       prefix="/auth",       tags=["Auth"])
app.include_router(triage.router,     prefix="/triage",     tags=["Triage"])
app.include_router(facilities.router, prefix="/facilities", tags=["Facilities"])
app.include_router(feedback.router,   prefix="/feedback",   tags=["Feedback"])
app.include_router(patients.router,   prefix="/patients",   tags=["Patients"])
app.include_router(admin.router,      prefix="/admin",      tags=["Admin"])

@app.get("/health")
def health_check():
    return {"status": "ok", "service": "margdarshak-api"}
```

---

## Build Order — What to Build First

This is the critical path. Don't start frontend integration before
each backend step is tested.

```
STEP 1 — Engine (no dependencies)
  engine/symptom_keywords.py
  engine/follow_up_questions.py
  engine/rule_engine.py
  Write unit tests. All must pass before moving on.

STEP 2 — Database
  Set up Supabase project
  Run schema SQL (from schema doc)
  Run seed.sql
  Verify data in Supabase dashboard
  Set up MCP connection

STEP 3 — Services (no route dependencies)
  services/translate_service.py
  Test: translate("मुझे बुखार है", "hi", "en") → "I have fever"
  services/maps_service.py
  Test: build_embed_url(18.98, 75.71) → valid URL

STEP 4 — Core triage route (first route to build)
  routes/triage.py → POST /triage/extract-symptoms
  routes/triage.py → POST /triage/assess
  Test the full flow end-to-end with curl or Postman

STEP 5 — Facilities route
  routes/facilities.py → GET /facilities/nearest
  Test with real Beed district coordinates

STEP 6 — Auth
  routes/auth.py → POST /auth/login
  routes/auth.py → GET /auth/me
  Test all 3 roles

STEP 7 — Patient + Feedback routes
  routes/patients.py
  routes/feedback.py

STEP 8 — Admin routes
  routes/admin.py
  Set up stored procedures (RPCs) in Supabase
  Test with seed data

STEP 9 — Outbreak detector
  engine/outbreak_detector.py
  Wire into triage route (async task)
  Test by inserting 21 fever assessments for same block

STEP 10 — Auth middleware on all routes
  Add Depends(require_role("admin")) etc.
  Test that wrong role returns 403
```

---

## Running Locally

```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

API docs auto-generated at: `http://localhost:8000/docs`

---

## Auth Middleware Implementation

```python
# backend/auth/dependencies.py

import jwt
import os
from fastapi import HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

security = HTTPBearer()
JWT_SECRET = os.getenv("JWT_SECRET")

def require_role(*allowed_roles: str):
    def dependency(credentials: HTTPAuthorizationCredentials = Depends(security)):
        try:
            payload = jwt.decode(
                credentials.credentials,
                JWT_SECRET,
                algorithms=["HS256"]
            )
            if payload.get("role") not in allowed_roles:
                raise HTTPException(status_code=403, detail="Insufficient permissions")
            return payload
        except jwt.ExpiredSignatureError:
            raise HTTPException(status_code=401, detail="Token expired")
        except jwt.InvalidTokenError:
            raise HTTPException(status_code=401, detail="Invalid token")
    return dependency

# Usage in route:
@router.get("/admin/summary")
async def get_summary(user = Depends(require_role("admin"))):
    district = user["district"]
    ...
```

---

## Demo Credentials (from seed.sql)

| Role | Phone | Password |
|------|-------|---------|
| Admin | 9876543210 | demo_admin |
| ASHA Worker 1 | 9876543211 | demo_asha1 |
| ASHA Worker 2 | 9876543212 | demo_asha2 |
| ASHA Worker 3 | 9876543213 | demo_asha3 |

---

## Common Mistakes to Avoid

**Translation direction:** Always user_language → English for the engine input.
Always English → user_language for the output. Never run the rule engine on
regional language text — the keyword map only works on English.

**Haversine runs in Python, not SQL.** Load all facilities for the district from
Supabase, then sort by distance in Python. Trying to do this in SQL with the
Supabase client adds complexity for no real performance gain at this scale.

**Outbreak detector is async.** Use `asyncio.create_task()` — do not `await` it
inside the triage response handler. The user should get their result in < 2 seconds.
The outbreak check can take a few extra seconds on its own.

**Session IDs for anonymous users.** Generate these on the frontend (UUID v4)
and pass them in every request. The backend stores them but doesn't validate them.
This lets anonymous users see their own follow-up without creating an account.

**SUPABASE_KEY in .env is the anon key.** The service role key (which bypasses RLS)
should only ever be used in MCP config for migrations. Never in the running app.
