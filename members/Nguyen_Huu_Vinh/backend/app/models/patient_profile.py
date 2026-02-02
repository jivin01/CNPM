import uuid
from sqlalchemy import Column, String, DateTime, Text, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from .user import Base

class PatientProfile(Base):
    __tablename__ = "patient_profiles"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=True)  # Optional for clinic-created patients
    clinic_id = Column(String(36), ForeignKey("clinics.id"), nullable=True)  # Optional for individual patients
    full_name = Column(String(255), nullable=False)
    email = Column(String(255), nullable=True)  # Required for clinic patients
    date_of_birth = Column(DateTime(timezone=True), nullable=True)
    phone = Column(String(50), nullable=True)
    medical_history = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    # user = relationship("User", back_populates="patient_profile", foreign_keys=[user_id])
    medical_images = relationship("MedicalImage", back_populates="patient")
    
    def __repr__(self):
        return f"<PatientProfile(id={self.id}, full_name={self.full_name})>"
