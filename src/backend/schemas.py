from sqlmodel import SQLModel
from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime
from pydantic import BaseModel
from typing import List, Optional

# --- SCHEMAS CHO USER (Giữ nguyên của con nếu đã có) ---
class UserBase(BaseModel):
    full_name: str
    email: str
    role: Optional[str] = "doctor"

class UserCreate(UserBase):
    password: str

class UserOut(UserBase):
    id: int
    is_active: bool

    class Config:
        from_attributes = True

class UserUpdate(BaseModel):
    is_active: Optional[bool] = None
    role: Optional[str] = None

# --- TASK 5: SCHEMAS MỚI CHO THUỐC & KÊ ĐƠN ---

# Schema để nhập thuốc mới vào kho
class MedicineCreate(BaseModel):
    name: str
    unit: str  # viên, vỉ, chai...
    price: float
    stock_quantity: int

# Schema chi tiết từng loại thuốc trong đơn (Dùng trong mảng items)
class PrescriptionItemCreate(BaseModel):
    medicine_id: int
    quantity: int

# Schema tổng để gửi từ Frontend khi bác sĩ nhấn "Lưu đơn thuốc"
class PrescriptionCreate(BaseModel):
    medical_record_id: int # ID của phiếu khám từ Task 4
    items: List[PrescriptionItemCreate] # Danh sách các thuốc được kê

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

# ==========================================
# PHẦN THÊM MỚI (TASK 5 - SCHEMAS)
# Dán đoạn này vào cuối file schemas.py
# ==========================================

# --- Dùng cho API Thuốc ---
class MedicineCreate(BaseModel):
    name: str
    unit: str
    price: float
    stock_quantity: int

class MedicineOut(MedicineCreate):
    id: int
    class Config:
        from_attributes = True

# --- Dùng cho API Kê đơn ---

# Chi tiết 1 dòng thuốc trong đơn (Frontend gửi lên)
class PrescriptionItemCreate(BaseModel):
    medicine_id: int
    quantity: int

# Tổng thể đơn thuốc (Frontend gửi lên)
class PrescriptionCreate(BaseModel):
    medical_record_id: int
    items: List[PrescriptionItemCreate]