from sqlmodel import SQLModel  # <--- QUAN TRỌNG: Phải có dòng này mới hết lỗi NameError
from pydantic import BaseModel, EmailStr
from typing import Optional

# === PHẦN 1: USER & AUTH (Code cũ của bạn) ===

# Khuôn mẫu Token
class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

# Khi Đăng ký thì cần gửi những gì?
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

# Dùng để cập nhật trạng thái user (ví dụ khóa tài khoản)
class UserUpdate(BaseModel):
    is_active: Optional[bool] = None
    role: Optional[str] = None


# === PHẦN 2: PATIENT (Bắt buộc phải thêm để chạy được main.py) ===

class PatientCreate(SQLModel):
    full_name: str
    gender: str
    birth_year: int
    phone: str
    address: Optional[str] = None
    medical_history: Optional[str] = None

class PatientOut(PatientCreate):
    id: int
class PatientCreate(SQLModel):
    full_name: str
    gender: str
    birth_year: int
    phone: str
    address: Optional[str] = None
    medical_history: Optional[str] = None

class PatientOut(PatientCreate):
    id: int