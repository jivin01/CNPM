from sqlmodel import SQLModel
from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

# === PHẦN 1: USER & AUTH ===

class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

# Khi Đăng ký
class UserCreate(BaseModel):
    full_name: str
    email: EmailStr
    password: str
    role: Optional[str] = "patient"

# Khi Đăng nhập
class UserLogin(BaseModel):
    email: EmailStr
    password: str

# Khi trả về thông tin (Giấu mật khẩu đi)
class UserOut(BaseModel):
    id: int
    full_name: str
    email: EmailStr
    role: str
    is_active: bool

# Dùng để cập nhật trạng thái user
class UserUpdate(BaseModel):
    is_active: Optional[bool] = None
    role: Optional[str] = None


# === PHẦN 2: PATIENT ===

class PatientCreate(SQLModel):
    full_name: str
    gender: str
    birth_year: int
    phone: str
    address: Optional[str] = None
    medical_history: Optional[str] = None

class PatientOut(PatientCreate):
    id: int


# === PHẦN 3: LỊCH HẸN (APPOINTMENT) ===

class AppointmentCreate(SQLModel):
    patient_id: int
    doctor_id: int
    appointment_time: datetime
    reason: Optional[str] = None

class AppointmentOut(AppointmentCreate):
    id: int
    status: str