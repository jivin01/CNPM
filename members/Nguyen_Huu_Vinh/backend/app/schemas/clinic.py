from pydantic import BaseModel, EmailStr, validator
from typing import Optional, List
from datetime import datetime
from enum import Enum

class ClinicStatus(str, Enum):
    PENDING = "pending"
    VERIFIED = "verified"
    SUSPENDED = "suspended"
    REJECTED = "rejected"

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

# Base schemas
class ClinicBase(BaseModel):
    name: str
    email: EmailStr
    phone: str
    address: str
    city: str
    country: str
    postal_code: str
    license_number: str
    tax_id: str
    website: Optional[str] = None
    contact_person_name: str
    contact_person_email: EmailStr
    contact_person_phone: str

class ClinicCreate(ClinicBase):
    pass

class ClinicUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    country: Optional[str] = None
    postal_code: Optional[str] = None
    website: Optional[str] = None
    contact_person_name: Optional[str] = None
    contact_person_email: Optional[EmailStr] = None
    contact_person_phone: Optional[str] = None

class ClinicResponse(ClinicBase):
    id: str
    status: ClinicStatus
    verified_at: Optional[datetime] = None
    verified_by: Optional[str] = None
    current_package: str
    package_expires_at: Optional[datetime] = None
    analysis_credits: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# Clinic Profile schemas
class ClinicProfileBase(BaseModel):
    description: Optional[str] = None
    specialties: Optional[List[str]] = []
    facilities: Optional[List[str]] = []
    auto_assign_doctors: bool = False
    require_doctor_validation: bool = True

class ClinicProfileCreate(ClinicProfileBase):
    pass

class ClinicProfileUpdate(BaseModel):
    description: Optional[str] = None
    specialties: Optional[List[str]] = None
    facilities: Optional[List[str]] = None
    auto_assign_doctors: Optional[bool] = None
    require_doctor_validation: Optional[bool] = None

class ClinicProfileResponse(ClinicProfileBase):
    id: str
    clinic_id: str
    total_patients: int
    total_analyses: int
    high_risk_cases: int
    notification_settings: Optional[dict] = {}
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# Clinic User schemas
class ClinicUserBase(BaseModel):
    role: ClinicUserRole
    department: Optional[str] = None
    license_number: Optional[str] = None
    specialization: Optional[str] = None

class ClinicUserCreate(ClinicUserBase):
    user_id: str
    permissions: Optional[List[str]] = []

class ClinicUserUpdate(BaseModel):
    role: Optional[ClinicUserRole] = None
    status: Optional[ClinicUserStatus] = None
    department: Optional[str] = None
    license_number: Optional[str] = None
    specialization: Optional[str] = None
    permissions: Optional[List[str]] = None

class ClinicUserResponse(ClinicUserBase):
    id: str
    clinic_id: str
    user_id: str
    status: ClinicUserStatus
    permissions: Optional[List[str]] = []
    invited_by: Optional[str] = None
    joined_at: Optional[datetime] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# Combined schemas
class ClinicWithProfileResponse(ClinicResponse):
    profile: Optional[ClinicProfileResponse] = None

class ClinicUserWithDetailsResponse(ClinicUserResponse):
    user: Optional[dict] = None  # Basic user info

# Verification schemas
class ClinicVerificationRequest(BaseModel):
    clinic_id: str
    action: str  # "approve", "reject", "suspend"
    reason: Optional[str] = None

class ClinicVerificationResponse(BaseModel):
    success: bool
    message: str
    clinic: Optional[ClinicResponse] = None
