import sys
import os

# Ensure backend directory is on path so relative imports work
sys.path.insert(0, os.path.dirname(__file__))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database.db import init_db
from routes import auth, triage, facilities, feedback, patients, admin
from routes.whatsapp import router as whatsapp_router
app = FastAPI(
    title="Margdarshak API",
    description="Multilingual rural health triage system",
    version="2.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:4173", "http://127.0.0.1:5173"],
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
app.include_router(whatsapp_router,   prefix="/whatsapp",   tags=["WhatsApp"])


@app.on_event("startup")
def startup():
    init_db()
    print("✓ Database initialized")


@app.get("/health")
def health_check():
    return {"status": "ok", "service": "margdarshak-api", "version": "2.0.0"}
