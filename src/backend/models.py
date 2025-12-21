from datetime import datetime
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

# Bảng Hồ sơ bệnh nhân (Patient)
class Patient(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    full_name: str
    gender: str
    birth_year: int
    phone: str
    address: Optional[str] = None
    medical_history: Optional[str] = None

# Bảng Lịch hẹn (Appointment)
class Appointment(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    
    # Khóa ngoại liên kết
    patient_id: int = Field(foreign_key="patient.id")
    doctor_id: int = Field(foreign_key="user.id")
    
    appointment_time: datetime
    duration_minutes: int = 30  # Mặc định khám 30 phút
    status: str = "PENDING"     # PENDING, COMPLETED, CANCELLED
    reason: Optional[str] = None
# Bảng Hồ sơ Khám bệnh (Lưu kết quả khám)
class MedicalRecord(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    
    appointment_id: int = Field(foreign_key="appointment.id") # Link với lịch hẹn
    doctor_id: int
    patient_id: int
    
    diagnosis: str          # Chẩn đoán bệnh
    prescription: str       # Đơn thuốc
    notes: Optional[str] = None # Ghi chú thêm
    created_at: datetime = Field(default_factory=datetime.now)