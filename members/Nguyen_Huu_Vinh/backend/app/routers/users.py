from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database.connection import get_db
from app.models.user import User, UserRole
from app.models.patient_profile import PatientProfile
from app.schemas.user import UserResponse
from app.schemas.patient_profile import PatientProfileCreate, PatientProfileResponse
from app.utils.auth import get_current_active_user

router = APIRouter(prefix="/users", tags=["users"])

@router.post("/profile", response_model=PatientProfileResponse)
async def create_patient_profile(
    profile_data: PatientProfileCreate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Create patient profile for current user"""
    # Check if user is a patient
    if current_user.role != UserRole.PATIENT:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only patients can create patient profiles"
        )
    
    # Check if profile already exists
    stmt = select(PatientProfile).where(PatientProfile.user_id == current_user.id)
    result = await db.execute(stmt)
    existing_profile = result.scalar_one_or_none()
    
    if existing_profile:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Patient profile already exists"
        )
    
    # Create new patient profile
    new_profile = PatientProfile(
        user_id=current_user.id,
        full_name=profile_data.full_name,
        date_of_birth=profile_data.date_of_birth,
        medical_history=profile_data.medical_history
    )
    
    db.add(new_profile)
    await db.commit()
    await db.refresh(new_profile)
    
    return new_profile

@router.get("/profile", response_model=PatientProfileResponse)
async def get_patient_profile(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Get patient profile for current user"""
    # Check if user is a patient
    if current_user.role != UserRole.PATIENT:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only patients can view patient profiles"
        )
    
    # Get patient profile
    stmt = select(PatientProfile).where(PatientProfile.user_id == current_user.id)
    result = await db.execute(stmt)
    profile = result.scalar_one_or_none()
    
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient profile not found"
        )
    
    return profile
