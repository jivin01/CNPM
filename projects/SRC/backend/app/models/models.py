from typing import Optional
from sqlmodel import SQLModel, Field
from datetime import datetime

class User(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    email: str
    hashed_password: str
    role: str = "patient"  # patient, doctor, clinic, admin
    created_at: datetime = Field(default_factory=datetime.utcnow)

class AnalysisRecord(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int
    original_image: str
    annotated_image: Optional[str] = None
    risk_score: Optional[float] = None
    status: str = Field(default="pending")  # pending, validated, rejected
    doctor_notes: Optional[str] = None
    validated_by: Optional[int] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)


class Message(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    sender_id: int
    receiver_id: int
    content: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
