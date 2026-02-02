import uuid
from enum import Enum
from sqlalchemy import Column, String, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from .user import Base

class ImageStatus(str, Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    ANALYZED = "analyzed"

class MedicalImage(Base):
    __tablename__ = "medical_images"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    patient_id = Column(String(36), ForeignKey("patient_profiles.id", ondelete="CASCADE"), nullable=False)
    clinic_id = Column(String(36), ForeignKey("clinics.id"), nullable=True)  # Optional clinic association
    image_url = Column(String(500), nullable=False)
    upload_date = Column(DateTime(timezone=True), server_default=func.now())
    status = Column(String(50), nullable=False, default=ImageStatus.PENDING)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    patient = relationship("PatientProfile", back_populates="medical_images")
    clinic = relationship("Clinic", back_populates="uploaded_images")
    analysis_results = relationship("AnalysisResult", back_populates="medical_image")
    
    def __repr__(self):
        return f"<MedicalImage(id={self.id}, status={self.status})>"
