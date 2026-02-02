import uuid
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database.connection import get_db
from app.models.user import User, UserRole
from app.models.patient_profile import PatientProfile
from app.models.medical_image import MedicalImage, ImageStatus
from app.schemas.medical_image import MedicalImageResponse
from app.schemas.patient_profile import PatientProfileResponse
from app.utils.auth import get_current_active_user
from app.utils.cloudinary import upload_image_to_cloudinary
from app.services.ai_service import simulate_ai_analysis

router = APIRouter(prefix="/images", tags=["medical images"])

@router.post("/upload", response_model=MedicalImageResponse)
async def upload_retinal_image(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Upload retinal image for analysis"""
    # Check if user is a patient
    if current_user.role != UserRole.PATIENT:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only patients can upload images"
        )
    
    # Get patient profile
    stmt = select(PatientProfile).where(PatientProfile.user_id == current_user.id)
    result = await db.execute(stmt)
    patient_profile = result.scalar_one_or_none()
    
    if not patient_profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient profile not found. Please create a profile first."
        )
    
    # Validate file type
    if not file.content_type.startswith("image/"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File must be an image"
        )
    
    # Read file data
    file_data = await file.read()
    
    # Upload to Cloudinary
    image_url = await upload_image_to_cloudinary(file_data)
    
    if not image_url:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to upload image"
        )
    
    # Create medical image record
    new_image = MedicalImage(
        patient_id=patient_profile.id,
        image_url=image_url,
        status=ImageStatus.PENDING
    )
    
    db.add(new_image)
    await db.commit()
    await db.refresh(new_image)
    
    # Trigger AI analysis in background
    await simulate_ai_analysis(new_image.id, db)
    
    return new_image

@router.get("/my-images", response_model=list[MedicalImageResponse])
async def get_my_images(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Get all images for current patient"""
    # Check if user is a patient
    if current_user.role != UserRole.PATIENT:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only patients can view their images"
        )
    
    # Get patient profile
    stmt = select(PatientProfile).where(PatientProfile.user_id == current_user.id)
    result = await db.execute(stmt)
    patient_profile = result.scalar_one_or_none()
    
    if not patient_profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient profile not found"
        )
    
    # Get all images for this patient
    stmt = select(MedicalImage).where(MedicalImage.patient_id == patient_profile.id)
    result = await db.execute(stmt)
    images = result.scalars().all()
    
    return list(images)
