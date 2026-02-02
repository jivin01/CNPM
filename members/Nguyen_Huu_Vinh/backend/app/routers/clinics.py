from datetime import datetime, timedelta
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, and_, or_, func

from app.database.connection import get_db
from app.models.clinic import Clinic, ClinicProfile, ClinicStatus
from app.models.clinic_user import ClinicUser, ClinicUserRole, ClinicUserStatus
from app.models.user import User, UserRole
from app.schemas.clinic import (
    ClinicCreate, ClinicResponse, ClinicUpdate, ClinicWithProfileResponse,
    ClinicProfileCreate, ClinicProfileResponse, ClinicProfileUpdate,
    ClinicUserCreate, ClinicUserResponse, ClinicUserWithDetailsResponse, ClinicUserUpdate,
    ClinicVerificationRequest, ClinicVerificationResponse
)
from app.utils.auth import get_current_active_user, require_admin

router = APIRouter(prefix="/clinics", tags=["clinics"])

# Clinic Registration
@router.post("/register", response_model=ClinicResponse)
async def register_clinic(
    clinic_data: ClinicCreate,
    db: AsyncSession = Depends(get_db)
):
    """Register a new clinic"""
    # Check if clinic email already exists
    stmt = select(Clinic).where(Clinic.email == clinic_data.email)
    result = await db.execute(stmt)
    existing_clinic = result.scalar_one_or_none()
    
    if existing_clinic:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create new clinic
    new_clinic = Clinic(**clinic_data.dict())
    db.add(new_clinic)
    await db.commit()
    await db.refresh(new_clinic)
    
    # Create clinic profile
    clinic_profile = ClinicProfile(clinic_id=new_clinic.id)
    db.add(clinic_profile)
    await db.commit()
    
    return new_clinic

@router.get("/my-clinic", response_model=ClinicWithProfileResponse)
async def get_my_clinic(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Get clinic information for current user"""
    # Find clinic user association
    stmt = select(ClinicUser).where(
        and_(
            ClinicUser.user_id == current_user.id,
            ClinicUser.status == ClinicUserStatus.ACTIVE
        )
    )
    result = await db.execute(stmt)
    clinic_user = result.scalar_one_or_none()
    
    if not clinic_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not associated with any clinic"
        )
    
    # Get clinic details
    stmt = select(Clinic).where(Clinic.id == clinic_user.clinic_id)
    result = await db.execute(stmt)
    clinic = result.scalar_one_or_none()
    
    if not clinic:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Clinic not found"
        )
    
    # Get clinic profile
    stmt = select(ClinicProfile).where(ClinicProfile.clinic_id == clinic.id)
    result = await db.execute(stmt)
    profile = result.scalar_one_or_none()
    
    return ClinicWithProfileResponse(
        **clinic.__dict__,
        profile=profile
    )

@router.get("/{clinic_id}", response_model=ClinicWithProfileResponse)
async def get_clinic(
    clinic_id: str,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Get clinic details by ID (admin or clinic member only)"""
    # Check permissions
    if current_user.role == UserRole.ADMIN:
        # Admin can see any clinic
        pass
    else:
        # Check if user is member of this clinic
        stmt = select(ClinicUser).where(
            and_(
                ClinicUser.clinic_id == clinic_id,
                ClinicUser.user_id == current_user.id,
                ClinicUser.status == ClinicUserStatus.ACTIVE
            )
        )
        result = await db.execute(stmt)
        clinic_user = result.scalar_one_or_none()
        
        if not clinic_user:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied"
            )
    
    # Get clinic details
    stmt = select(Clinic).where(Clinic.id == clinic_id)
    result = await db.execute(stmt)
    clinic = result.scalar_one_or_none()
    
    if not clinic:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Clinic not found"
        )
    
    # Get clinic profile
    stmt = select(ClinicProfile).where(ClinicProfile.clinic_id == clinic.id)
    result = await db.execute(stmt)
    profile = result.scalar_one_or_none()
    
    return ClinicWithProfileResponse(
        **clinic.__dict__,
        profile=profile
    )

@router.put("/{clinic_id}", response_model=ClinicResponse)
async def update_clinic(
    clinic_id: str,
    clinic_update: ClinicUpdate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Update clinic information"""
    # Check permissions
    stmt = select(ClinicUser).where(
        and_(
            ClinicUser.clinic_id == clinic_id,
            ClinicUser.user_id == current_user.id,
            ClinicUser.role.in_([ClinicUserRole.ADMIN, ClinicUserRole.MANAGER]),
            ClinicUser.status == ClinicUserStatus.ACTIVE
        )
    )
    result = await db.execute(stmt)
    clinic_user = result.scalar_one_or_none()
    
    if not clinic_user and current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    # Get clinic
    stmt = select(Clinic).where(Clinic.id == clinic_id)
    result = await db.execute(stmt)
    clinic = result.scalar_one_or_none()
    
    if not clinic:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Clinic not found"
        )
    
    # Update clinic
    update_data = clinic_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(clinic, field, value)
    
    await db.commit()
    await db.refresh(clinic)
    
    return clinic

# Clinic Profile Management
@router.put("/{clinic_id}/profile", response_model=ClinicProfileResponse)
async def update_clinic_profile(
    clinic_id: str,
    profile_update: ClinicProfileUpdate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Update clinic profile"""
    # Check permissions
    stmt = select(ClinicUser).where(
        and_(
            ClinicUser.clinic_id == clinic_id,
            ClinicUser.user_id == current_user.id,
            ClinicUser.role.in_([ClinicUserRole.ADMIN, ClinicUserRole.MANAGER]),
            ClinicUser.status == ClinicUserStatus.ACTIVE
        )
    )
    result = await db.execute(stmt)
    clinic_user = result.scalar_one_or_none()
    
    if not clinic_user and current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    # Get clinic profile
    stmt = select(ClinicProfile).where(ClinicProfile.clinic_id == clinic_id)
    result = await db.execute(stmt)
    profile = result.scalar_one_or_none()
    
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Clinic profile not found"
        )
    
    # Update profile
    update_data = profile_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(profile, field, value)
    
    await db.commit()
    await db.refresh(profile)
    
    return profile

# Admin: List all clinics
@router.get("/", response_model=List[ClinicResponse])
async def list_clinics(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    status: Optional[ClinicStatus] = Query(None),
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    """List all clinics (admin only)"""
    stmt = select(Clinic)
    
    if status:
        stmt = stmt.where(Clinic.status == status)
    
    stmt = stmt.offset(skip).limit(limit).order_by(Clinic.created_at.desc())
    result = await db.execute(stmt)
    clinics = result.scalars().all()
    
    return clinics

# Admin: Verify/Reject/Suspend clinics
@router.post("/verify", response_model=ClinicVerificationResponse)
async def verify_clinic(
    verification: ClinicVerificationRequest,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    """Verify, reject, or suspend a clinic (admin only)"""
    # Get clinic
    stmt = select(Clinic).where(Clinic.id == verification.clinic_id)
    result = await db.execute(stmt)
    clinic = result.scalar_one_or_none()
    
    if not clinic:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Clinic not found"
        )
    
    # Update clinic status
    if verification.action == "approve":
        clinic.status = ClinicStatus.VERIFIED
        clinic.verified_at = datetime.utcnow()
        clinic.verified_by = str(current_user.id)
        message = "Clinic approved successfully"
    elif verification.action == "reject":
        clinic.status = ClinicStatus.REJECTED
        message = "Clinic rejected"
    elif verification.action == "suspend":
        clinic.status = ClinicStatus.SUSPENDED
        message = "Clinic suspended"
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid action"
        )
    
    await db.commit()
    await db.refresh(clinic)
    
    return ClinicVerificationResponse(
        success=True,
        message=message,
        clinic=clinic
    )
