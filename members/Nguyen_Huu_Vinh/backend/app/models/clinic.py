import uuid
from enum import Enum
from sqlalchemy import Column, String, DateTime, Boolean, Text, Integer, Float
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from app.models.user import Base

class ClinicStatus(str, Enum):
    PENDING = "pending"
    VERIFIED = "verified"
    SUSPENDED = "suspended"
    REJECTED = "rejected"

class Clinic(Base):
    __tablename__ = "clinics"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    phone = Column(String(50), nullable=False)
    address = Column(Text, nullable=False)
    city = Column(String(100), nullable=False)
    country = Column(String(100), nullable=False)
    postal_code = Column(String(20), nullable=False)
    
    # Verification status
    status = Column(String(50), default=ClinicStatus.PENDING, nullable=False)
    verified_at = Column(DateTime(timezone=True), nullable=True)
    verified_by = Column(String(36), nullable=True)  # Admin user ID
    
    # Business info
    license_number = Column(String(100), nullable=False)
    tax_id = Column(String(100), nullable=False)
    website = Column(String(255), nullable=True)
    
    # Contact person
    contact_person_name = Column(String(255), nullable=False)
    contact_person_email = Column(String(255), nullable=False)
    contact_person_phone = Column(String(50), nullable=False)
    
    # Service packages
    current_package = Column(String(100), default="basic", nullable=False)
    package_expires_at = Column(DateTime(timezone=True), nullable=True)
    analysis_credits = Column(Integer, default=0, nullable=False)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    profile = relationship("ClinicProfile", back_populates="clinic", uselist=False)
    users = relationship("ClinicUser", back_populates="clinic")
    uploaded_images = relationship("MedicalImage", back_populates="clinic")
    
    def __repr__(self):
        return f"<Clinic(id={self.id}, name={self.name}, status={self.status})>"

class ClinicProfile(Base):
    __tablename__ = "clinic_profiles"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    clinic_id = Column(String(36), nullable=False)
    
    # Clinic details
    description = Column(Text, nullable=True)
    specialties = Column(Text, nullable=True)  # JSON string of specialties
    facilities = Column(Text, nullable=True)  # JSON string of facilities
    
    # Statistics
    total_patients = Column(Integer, default=0, nullable=False)
    total_analyses = Column(Integer, default=0, nullable=False)
    high_risk_cases = Column(Integer, default=0, nullable=False)
    
    # Settings
    auto_assign_doctors = Column(Boolean, default=False, nullable=False)
    require_doctor_validation = Column(Boolean, default=True, nullable=False)
    notification_settings = Column(Text, nullable=True)  # JSON string
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    clinic = relationship("Clinic", back_populates="profile")
    
    def __repr__(self):
        return f"<ClinicProfile(id={self.id}, clinic_id={self.clinic_id})>"
