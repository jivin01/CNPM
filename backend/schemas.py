from pydantic import BaseModel, EmailStr
from uuid import UUID
from datetime import datetime
from typing import Optional

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    role: str = "Patient" # Patient, Doctor, Clinic, Admin

class UserResponse(BaseModel):
    id: UUID
    email: EmailStr
    full_name: str
    role: str
    created_at: datetime
    class Config:
        from_attributes = True

class LoginRequest(BaseModel):
    email: EmailStr
    password: str