import uuid
import jwt
import bcrypt
import os
from datetime import datetime, timedelta
from fastapi import APIRouter, HTTPException, Depends
from models.schemas import LoginRequest
from database.db import get_db
from auth.dependencies import require_role
from dotenv import load_dotenv

load_dotenv()

router = APIRouter()
JWT_SECRET = os.getenv("JWT_SECRET", "margdarshak_secret")
JWT_EXPIRY_DAYS = int(os.getenv("JWT_EXPIRY_DAYS", 7))


def make_token(user: dict) -> str:
    payload = {
        "user_id": user["id"],
        "role": user["role"],
        "district": user["district"],
        "exp": datetime.utcnow() + timedelta(days=JWT_EXPIRY_DAYS),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm="HS256")


@router.post("/login")
def login(body: LoginRequest):
    with get_db() as conn:
        row = conn.execute(
            "SELECT * FROM users WHERE phone = ? AND is_active = 1", (body.phone,)
        ).fetchone()

    if not row:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    if not bcrypt.checkpw(body.password.encode(), row["password_hash"].encode()):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    user = dict(row)
    token = make_token(user)

    # Update last login
    with get_db() as conn:
        conn.execute(
            "UPDATE users SET last_login = ? WHERE id = ?",
            (datetime.utcnow().isoformat(), user["id"])
        )

    return {
        "access_token": token,
        "token_type": "bearer",
        "role": user["role"],
        "user_id": user["id"],
        "name": user["name"],
        "district": user["district"],
        "block": user.get("block"),
        "language": user.get("language", "hi"),
        "asha_id": user.get("asha_id"),
        "village": user.get("village"),
    }


@router.get("/me")
def get_me(current_user=Depends(require_role("user", "asha", "admin"))):
    with get_db() as conn:
        row = conn.execute(
            "SELECT id,name,role,phone,village,block,district,language,asha_id FROM users WHERE id = ?",
            (current_user["user_id"],)
        ).fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="User not found")
    return dict(row)
