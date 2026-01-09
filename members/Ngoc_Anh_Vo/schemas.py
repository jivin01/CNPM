from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime
from models import UserRole # Giữ import này để dùng cho Response, nhưng input thì thả lỏng

# --- USER SCHEMAS ---
class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    
    # --- THAY ĐỔI QUAN TRỌNG Ở ĐÂY ---
    # Thay vì "role: UserRole", ta đổi thành "str" để tránh lỗi 422
    role: str = "user" 

class UserResponse(BaseModel):
    id: int
    email: EmailStr
    full_name: str
    role: str # Đổi thành str luôn cho an toàn khi hiển thị
    is_active: bool

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

# --- PATIENT SCHEMAS ---
class PatientBase(BaseModel):
    full_name: str
    gender: str
    phone: Optional[str] = None
    address: Optional[str] = None
    email: Optional[str] = None 

class PatientCreate(PatientBase):
    pass

class PatientResponse(PatientBase):
    id: int
    # Đã bỏ age

    class Config:
        from_attributes = True

# --- MEDICAL RECORD SCHEMAS ---
class MedicalRecordCreate(BaseModel):
    patient_id: int
    diagnosis: str
    image_url: Optional[str] = None
    treatment: Optional[str] = None
    notes: Optional[str] = None

class MedicalRecordResponse(MedicalRecordCreate):
    id: int
    created_at: datetime
    visit_date: Optional[str] = None 

    class Config:
        from_attributes = True

class MedicalRecordUpdate(BaseModel):
    treatment: str