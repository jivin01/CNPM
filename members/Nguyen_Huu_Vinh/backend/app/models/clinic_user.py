import uuid
from enum import Enum
from sqlalchemy import Column, String, DateTime, Boolean, Text, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from app.models.user import Base

class ClinicUserRole(str, Enum):
    ADMIN = "admin"
    DOCTOR = "doctor"
    STAFF = "staff"
    MANAGER = "manager"

class ClinicUserStatus(str, Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    PENDING = "pending"
    SUSPENDED = "suspended"

class ClinicUser(Base):
    __tablename__ = "clinic_users"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    clinic_id = Column(String(36), ForeignKey("clinics.id"), nullable=False)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    
    # Role and permissions
    role = Column(String(50), nullable=False, default=ClinicUserRole.STAFF)
    permissions = Column(Text, nullable=True)  # JSON string of permissions
    
    # Status and management
    status = Column(String(50), default=ClinicUserStatus.ACTIVE, nullable=False)
    invited_by = Column(String(36), nullable=True)  # User ID who invited
    joined_at = Column(DateTime(timezone=True), nullable=True)
    
    # Clinic-specific settings
    department = Column(String(100), nullable=True)
    license_number = Column(String(100), nullable=True)  # For doctors
    specialization = Column(String(255), nullable=True)  # For doctors
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    clinic = relationship("Clinic", back_populates="users")
    user = relationship("User", back_populates="clinic_associations")
    
    def __repr__(self):
        return f"<ClinicUser(id={self.id}, clinic_id={self.clinic_id}, user_id={self.user_id}, role={self.role})>"
