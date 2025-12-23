from datetime import datetime
from sqlmodel import SQLModel, Field
from typing import Optional
from sqlmodel import SQLModel, Field, Relationship
from typing import List, Optional
from datetime import datetime
# 1. Bảng Kho thuốc
class Medicine(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(index=True)
    unit: str  # viên, vỉ, chai
    price: float
    stock_quantity: int = Field(default=0) # Số lượng tồn kho

# 2. Bảng Đơn thuốc (Quản lý riêng, thay thế cho cột string cũ nếu muốn)
class Prescription(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    # Liên kết với MedicalRecord (ID phiếu khám)
    medical_record_id: int = Field(foreign_key="medicalrecord.id") 
    created_at: datetime = Field(default_factory=datetime.now)
    
    # Quan hệ 1-nhiều: Một đơn thuốc có nhiều dòng chi tiết
    items: List["PrescriptionItem"] = Relationship(back_populates="prescription")

# 3. Bảng Chi tiết đơn thuốc (Cầu nối giữa Đơn thuốc và Thuốc để trừ kho)
class PrescriptionItem(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    prescription_id: int = Field(foreign_key="prescription.id")
    medicine_id: int = Field(foreign_key="medicine.id")
    quantity: int  # Số lượng kê
    
    # Quan hệ ngược
    prescription: Optional[Prescription] = Relationship(back_populates="items")

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
    status: str = "pending" # <--- Thêm dòng này vào models.py