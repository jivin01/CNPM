from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func

from app.database.connection import get_db
from app.models.clinic import Clinic
from app.models.clinic_user import ClinicUser, ClinicUserRole, ClinicUserStatus
from app.models.user import User, UserRole
from app.schemas.clinic import (
    ClinicUserCreate, ClinicUserResponse, ClinicUserWithDetailsResponse, 
    ClinicUserUpdate
)
from app.utils.auth import get_current_active_user

router = APIRouter(prefix="/clinics/{clinic_id}/users", tags=["clinic-users"])

# Clinic User Management
@router.post("/", response_model=ClinicUserResponse)
async def add_clinic_user(
    clinic_id: str,
    user_data: ClinicUserCreate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Add a user to clinic (clinic admin/manager only)"""
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
    current_clinic_user = result.scalar_one_or_none()
    
    if not current_clinic_user and current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    # Check if clinic exists
    stmt = select(Clinic).where(Clinic.id == clinic_id)
    result = await db.execute(stmt)
    clinic = result.scalar_one_or_none()
    
    if not clinic:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Clinic not found"
        )
    
    # Check if user exists
    stmt = select(User).where(User.id == user_data.user_id)
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Check if user already in clinic
    stmt = select(ClinicUser).where(
        and_(
            ClinicUser.clinic_id == clinic_id,
            ClinicUser.user_id == user_data.user_id
        )
    )
    result = await db.execute(stmt)
    existing_association = result.scalar_one_or_none()
    
    if existing_association:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User already associated with this clinic"
        )
    
    # Create clinic user association
    clinic_user = ClinicUser(
        clinic_id=clinic_id,
        user_id=user_data.user_id,
        role=user_data.role,
        department=user_data.department,
        license_number=user_data.license_number,
        specialization=user_data.specialization,
        permissions=user_data.permissions or [],
        joined_at=func.now()
    )
    
    db.add(clinic_user)
    await db.commit()
    await db.refresh(clinic_user)
    
    return clinic_user

@router.get("/", response_model=List[ClinicUserWithDetailsResponse])
async def list_clinic_users(
    clinic_id: str,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    role: Optional[ClinicUserRole] = Query(None),
    status: Optional[ClinicUserStatus] = Query(None),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """List clinic users"""
    # Check permissions
    stmt = select(ClinicUser).where(
        and_(
            ClinicUser.clinic_id == clinic_id,
            ClinicUser.user_id == current_user.id,
            ClinicUser.status == ClinicUserStatus.ACTIVE
        )
    )
    result = await db.execute(stmt)
    current_clinic_user = result.scalar_one_or_none()
    
    if not current_clinic_user and current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    # Get clinic users
    stmt = select(ClinicUser).where(ClinicUser.clinic_id == clinic_id)
    
    if role:
        stmt = stmt.where(ClinicUser.role == role)
    
    if status:
        stmt = stmt.where(ClinicUser.status == status)
    
    stmt = stmt.offset(skip).limit(limit).order_by(ClinicUser.created_at.desc())
    result = await db.execute(stmt)
    clinic_users = result.scalars().all()
    
    # Get user details for each clinic user
    user_ids = [cu.user_id for cu in clinic_users]
    if user_ids:
        stmt = select(User).where(User.id.in_(user_ids))
        result = await db.execute(stmt)
        users = result.scalars().all()
        user_dict = {user.id: user for user in users}
    else:
        user_dict = {}
    
    # Combine clinic user with user details
    response = []
    for cu in clinic_users:
        user = user_dict.get(cu.user_id)
        user_details = None
        if user:
            user_details = {
                "id": user.id,
                "email": user.email,
                "role": user.role,
                "created_at": user.created_at
            }
        
        response.append(ClinicUserWithDetailsResponse(
            **cu.__dict__,
            user=user_details
        ))
    
    return response

@router.get("/{user_id}", response_model=ClinicUserWithDetailsResponse)
async def get_clinic_user(
    clinic_id: str,
    user_id: str,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Get specific clinic user details"""
    # Check permissions
    stmt = select(ClinicUser).where(
        and_(
            ClinicUser.clinic_id == clinic_id,
            ClinicUser.user_id == current_user.id,
            ClinicUser.status == ClinicUserStatus.ACTIVE
        )
    )
    result = await db.execute(stmt)
    current_clinic_user = result.scalar_one_or_none()
    
    if not current_clinic_user and current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    # Get clinic user
    stmt = select(ClinicUser).where(
        and_(
            ClinicUser.clinic_id == clinic_id,
            ClinicUser.user_id == user_id
        )
    )
    result = await db.execute(stmt)
    clinic_user = result.scalar_one_or_none()
    
    if not clinic_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Clinic user not found"
        )
    
    # Get user details
    stmt = select(User).where(User.id == user_id)
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()
    
    user_details = None
    if user:
        user_details = {
            "id": user.id,
            "email": user.email,
            "role": user.role,
            "created_at": user.created_at
        }
    
    return ClinicUserWithDetailsResponse(
        **clinic_user.__dict__,
        user=user_details
    )

@router.put("/{user_id}", response_model=ClinicUserResponse)
async def update_clinic_user(
    clinic_id: str,
    user_id: str,
    user_update: ClinicUserUpdate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Update clinic user role or status"""
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
    current_clinic_user = result.scalar_one_or_none()
    
    if not current_clinic_user and current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    # Get clinic user
    stmt = select(ClinicUser).where(
        and_(
            ClinicUser.clinic_id == clinic_id,
            ClinicUser.user_id == user_id
        )
    )
    result = await db.execute(stmt)
    clinic_user = result.scalar_one_or_none()
    
    if not clinic_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Clinic user not found"
        )
    
    # Update clinic user
    update_data = user_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(clinic_user, field, value)
    
    await db.commit()
    await db.refresh(clinic_user)
    
    return clinic_user

@router.delete("/{user_id}")
async def remove_clinic_user(
    clinic_id: str,
    user_id: str,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Remove user from clinic"""
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
    current_clinic_user = result.scalar_one_or_none()
    
    if not current_clinic_user and current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    # Get clinic user
    stmt = select(ClinicUser).where(
        and_(
            ClinicUser.clinic_id == clinic_id,
            ClinicUser.user_id == user_id
        )
    )
    result = await db.execute(stmt)
    clinic_user = result.scalar_one_or_none()
    
    if not clinic_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Clinic user not found"
        )
    
    # Cannot remove yourself if you're the admin
    if user_id == current_user.id and current_clinic_user.role == ClinicUserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot remove yourself from clinic"
        )
    
    # Delete clinic user association
    await db.delete(clinic_user)
    await db.commit()
    
    return {"message": "User removed from clinic successfully"}

# Get current user's clinic info
@router.get("/my-role", response_model=ClinicUserWithDetailsResponse)
async def get_my_clinic_role(
    clinic_id: str,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Get current user's role and permissions in clinic"""
    # Get clinic user
    stmt = select(ClinicUser).where(
        and_(
            ClinicUser.clinic_id == clinic_id,
            ClinicUser.user_id == current_user.id
        )
    )
    result = await db.execute(stmt)
    clinic_user = result.scalar_one_or_none()
    
    if not clinic_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not associated with this clinic"
        )
    
    # Get user details
    user_details = {
        "id": current_user.id,
        "email": current_user.email,
        "role": current_user.role,
        "created_at": current_user.created_at
    }
    
    return ClinicUserWithDetailsResponse(
        **clinic_user.__dict__,
        user=user_details
    )
