import uuid
from enum import Enum
from sqlalchemy import Column, String, DateTime, Text, Float, ForeignKey, JSON
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from .user import Base

class RiskLevel(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"

class AnalysisResult(Base):
    __tablename__ = "analysis_results"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    image_id = Column(String(36), ForeignKey("medical_images.id", ondelete="CASCADE"), nullable=False)
    risk_level = Column(String(50), nullable=False)
    confidence_score = Column(Float, nullable=False)
    findings = Column(JSON, nullable=True)  # Store coordinates for heatmap, etc.
    doctor_notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    medical_image = relationship("MedicalImage", back_populates="analysis_results")
    
    def __repr__(self):
        return f"<AnalysisResult(id={self.id}, risk_level={self.risk_level}, confidence={self.confidence_score})>"
