import sqlite3
import os
from contextlib import contextmanager
from dotenv import load_dotenv

load_dotenv()

DB_PATH = os.getenv("DATABASE_PATH", "./margdarshak.db")


def get_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA foreign_keys=ON")
    return conn


@contextmanager
def get_db():
    conn = get_connection()
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


def init_db():
    with get_db() as conn:
        conn.executescript("""
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            phone TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            role TEXT NOT NULL CHECK(role IN ('user','asha','admin')),
            village TEXT,
            block TEXT,
            district TEXT NOT NULL,
            asha_id TEXT,
            district_code TEXT,
            language TEXT DEFAULT 'hi',
            is_active INTEGER DEFAULT 1,
            last_login TEXT,
            created_at TEXT DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS facilities (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            type TEXT NOT NULL,
            district TEXT NOT NULL,
            block TEXT,
            address TEXT,
            lat REAL NOT NULL,
            lng REAL NOT NULL,
            phone TEXT,
            hours TEXT,
            is_24hr INTEGER DEFAULT 0,
            has_emergency INTEGER DEFAULT 0,
            is_active INTEGER DEFAULT 1
        );

        CREATE TABLE IF NOT EXISTS assessments (
            id TEXT PRIMARY KEY,
            session_id TEXT,
            assessed_by TEXT,
            assessed_by_role TEXT DEFAULT 'user',
            patient_name TEXT,
            patient_age INTEGER,
            patient_gender TEXT,
            patient_type TEXT DEFAULT 'self',
            village TEXT,
            block TEXT,
            district TEXT,
            patient_lat REAL,
            patient_lng REAL,
            raw_input_text TEXT,
            raw_input_language TEXT DEFAULT 'hi',
            symptoms TEXT,
            symptom_answers TEXT,
            conversation_summary TEXT,
            triage_level TEXT NOT NULL CHECK(triage_level IN ('RED','YELLOW','GREEN')),
            triage_reason TEXT,
            recommended_action TEXT,
            self_care_instructions TEXT,
            warning_signs TEXT,
            facility_id TEXT,
            facility_name TEXT,
            facility_distance_km REAL,
            follow_up_due TEXT,
            follow_up_done INTEGER DEFAULT 0,
            follow_up_outcome TEXT,
            visited_facility INTEGER,
            created_at TEXT DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS feedback (
            id TEXT PRIMARY KEY,
            assessment_id TEXT NOT NULL,
            visited_facility INTEGER,
            outcome TEXT CHECK(outcome IN ('better','same','worse')),
            patient_satisfied INTEGER,
            doctor_diagnosis TEXT,
            triage_was_accurate INTEGER,
            submitted_by TEXT,
            created_at TEXT DEFAULT (datetime('now')),
            FOREIGN KEY(assessment_id) REFERENCES assessments(id)
        );

        CREATE TABLE IF NOT EXISTS outbreak_alerts (
            id TEXT PRIMARY KEY,
            block TEXT NOT NULL,
            district TEXT NOT NULL,
            symptom_cluster TEXT,
            case_count INTEGER DEFAULT 0,
            affected_villages TEXT,
            severity TEXT DEFAULT 'LOW',
            status TEXT DEFAULT 'ACTIVE',
            first_reported TEXT DEFAULT (datetime('now')),
            last_updated TEXT DEFAULT (datetime('now')),
            actions_taken TEXT DEFAULT '[]',
            admin_notes TEXT
        );

        CREATE TABLE IF NOT EXISTS sessions (
            id TEXT PRIMARY KEY,
            session_token TEXT UNIQUE NOT NULL,
            language TEXT DEFAULT 'hi',
            village TEXT,
            block TEXT,
            district TEXT,
            created_at TEXT DEFAULT (datetime('now'))
        );
        """)
