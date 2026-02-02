"""
Simple schemas for testing
"""
from pydantic import BaseModel, EmailStr
from typing import Optional

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    role: Optional[str] = "patient"

class UserResponse(BaseModel):
    id: str
    email: str
    role: str
    created_at: str
    updated_at: Optional[str] = None

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None
