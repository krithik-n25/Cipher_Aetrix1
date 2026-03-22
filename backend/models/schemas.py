from pydantic import BaseModel, Field
from typing import Optional, Literal


class LoginRequest(BaseModel):
    phone: str
    password: str


class TriageRequestSchema(BaseModel):
    session_id: Optional[str] = None
    assessed_by: Optional[str] = None
    assessed_by_role: str = "user"
    patient_name: Optional[str] = None
    patient_age: Optional[int] = Field(None, ge=0, le=120)
    patient_gender: Optional[str] = None
    patient_type: str = "self"
    village: Optional[str] = None
    block: Optional[str] = None
    district: Optional[str] = None
    patient_lat: Optional[float] = None
    patient_lng: Optional[float] = None
    raw_input_text: Optional[str] = None
    raw_input_language: str = "hi"
    symptoms: list[str] = Field(default_factory=list)
    symptom_answers: dict = Field(default_factory=dict)
    language: str = "hi"
    conversation_summary: Optional[str] = None


class FeedbackSchema(BaseModel):
    visited_facility: Optional[bool] = None
    outcome: Literal["better", "same", "worse"]
    patient_satisfied: Optional[bool] = None
    doctor_diagnosis: Optional[str] = None


class OutbreakUpdateSchema(BaseModel):
    status: Optional[str] = None
    action: Optional[str] = None
    notes: Optional[str] = None
