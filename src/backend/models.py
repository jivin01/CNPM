<<<<<<< HEAD
from datetime import datetime
=======
>>>>>>> ab94d6a9e3ad806a03b9d086343a3493e415ece9
from sqlmodel import SQLModel, Field
from typing import Optional

# Bảng Tài khoản (User)
class User(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    email: str = Field(unique=True, index=True)
    full_name: str
    hashed_password: str
    role: str = "patient"  # admin, doctor, patient
    is_active: bool = True

# Bảng Hồ sơ bệnh nhân (Patient) - Mới thêm vào
class Patient(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    full_name: str
    gender: str
    birth_year: int
    phone: str
    address: Optional[str] = None
<<<<<<< HEAD
    medical_history: Optional[str] = None




# === THÊM BẢNG LỊCH HẸN (TASK 3) ===
class Appointment(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    
    # Khóa ngoại liên kết
    patient_id: int = Field(foreign_key="patient.id")
    doctor_id: int = Field(foreign_key="user.id")
    
    appointment_time: datetime
    duration_minutes: int = 30  # Mặc định khám 30 phút
    status: str = "PENDING"     # PENDING, COMPLETED, CANCELLED
    reason: Optional[str] = None
=======
    medical_history: Optional[str] = None
>>>>>>> ab94d6a9e3ad806a03b9d086343a3493e415ece9
