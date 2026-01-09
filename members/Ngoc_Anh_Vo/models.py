from sqlalchemy import Boolean, Column, ForeignKey, Integer, String, DateTime, Enum as SQLEnum
from sqlalchemy.orm import relationship
from database import Base
from datetime import datetime
import enum

# --- CẬP NHẬT: Thêm role CLINIC_MANAGER vào đây ---
class UserRole(str, enum.Enum):
    ADMIN = "admin"
    DOCTOR = "doctor"
    USER = "user"
    CLINIC_MANAGER = "clinic_manager"  # <--- MỚI THÊM

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    full_name = Column(String)
    is_active = Column(Boolean, default=True)
    
    # SQLAlchemy sẽ dùng Enum ở trên để kiểm soát dữ liệu nhập vào
    role = Column(SQLEnum(UserRole), default=UserRole.USER)

class Patient(Base):
    __tablename__ = "patients"
    
    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String, index=True)
    gender = Column(String, default="Unknown")
    phone = Column(String, nullable=True)
    address = Column(String, nullable=True)
    date_of_birth = Column(String, nullable=True)
    
    # Giữ nguyên cột email để tránh lỗi "AttributeError" như lúc nãy
    email = Column(String, unique=True, index=True, nullable=True) 
    
    records = relationship("MedicalRecord", back_populates="patient")

class MedicalRecord(Base):
    __tablename__ = "medical_records"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"))
    diagnosis = Column(String)
    treatment = Column(String, nullable=True)
    notes = Column(String, nullable=True)
    image_url = Column(String, nullable=True)
    visit_date = Column(String, default=datetime.now().strftime("%Y-%m-%d"))
    created_at = Column(DateTime, default=datetime.now)

    patient = relationship("Patient", back_populates="records")