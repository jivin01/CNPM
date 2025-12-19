<<<<<<< HEAD
from sqlmodel import SQLModel
from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

# === PHẦN 1: USER & AUTH ===
=======
from sqlmodel import SQLModel  # <--- QUAN TRỌNG: Phải có dòng này mới hết lỗi NameError
from pydantic import BaseModel, EmailStr
from typing import Optional

# === PHẦN 1: USER & AUTH (Code cũ của bạn) ===

# Khuôn mẫu Token
>>>>>>> ab94d6a9e3ad806a03b9d086343a3493e415ece9
class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

<<<<<<< HEAD
=======
# Khi Đăng ký thì cần gửi những gì?
>>>>>>> ab94d6a9e3ad806a03b9d086343a3493e415ece9
class UserCreate(BaseModel):
    full_name: str
    email: EmailStr
    password: str
    role: Optional[str] = "patient"

<<<<<<< HEAD
=======
# Khi Đăng nhập
>>>>>>> ab94d6a9e3ad806a03b9d086343a3493e415ece9
class UserLogin(BaseModel):
    email: EmailStr
    password: str

<<<<<<< HEAD
=======
# Khi trả về thông tin (Giấu mật khẩu đi)
>>>>>>> ab94d6a9e3ad806a03b9d086343a3493e415ece9
class UserOut(BaseModel):
    id: int
    full_name: str
    email: EmailStr
    role: str
    is_active: bool

<<<<<<< HEAD
=======
# Dùng để cập nhật trạng thái user (ví dụ khóa tài khoản)
>>>>>>> ab94d6a9e3ad806a03b9d086343a3493e415ece9
class UserUpdate(BaseModel):
    is_active: Optional[bool] = None
    role: Optional[str] = None

<<<<<<< HEAD
# === PHẦN 2: PATIENT ===
=======

# === PHẦN 2: PATIENT (Bắt buộc phải thêm để chạy được main.py) ===

>>>>>>> ab94d6a9e3ad806a03b9d086343a3493e415ece9
class PatientCreate(SQLModel):
    full_name: str
    gender: str
    birth_year: int
    phone: str
    address: Optional[str] = None
    medical_history: Optional[str] = None

class PatientOut(PatientCreate):
    id: int
<<<<<<< HEAD

# === PHẦN 3: LỊCH HẸN (TASK 3) - BẠN ĐANG THIẾU PHẦN NÀY ===
class AppointmentCreate(SQLModel):
    patient_id: int
    doctor_id: int
    appointment_time: datetime
    reason: Optional[str] = None

class AppointmentOut(AppointmentCreate):
    id: int
    status: str
=======
class PatientCreate(SQLModel):
    full_name: str
    gender: str
    birth_year: int
    phone: str
    address: Optional[str] = None
    medical_history: Optional[str] = None

class PatientOut(PatientCreate):
    id: int
>>>>>>> ab94d6a9e3ad806a03b9d086343a3493e415ece9
