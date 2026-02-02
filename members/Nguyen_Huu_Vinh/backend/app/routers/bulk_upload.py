import asyncio
import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func

from app.database.connection import get_db
from app.models.clinic import Clinic
from app.models.clinic_user import ClinicUser, ClinicUserRole, ClinicUserStatus
from app.models.user import User, UserRole
from app.models.patient_profile import PatientProfile
from app.models.medical_image import MedicalImage, ImageStatus
from app.schemas.clinic import ClinicUserWithDetailsResponse
from app.utils.auth import get_current_active_user
from app.utils.cloudinary import upload_image_to_cloudinary
from app.services.ai_service import simulate_ai_analysis

router = APIRouter(prefix="/clinics/{clinic_id}/bulk-upload", tags=["bulk-upload"])

@router.post("/images")
async def bulk_upload_images(
    clinic_id: str,
    background_tasks: BackgroundTasks,
    files: List[UploadFile] = File(...),
    patient_id: Optional[str] = Form(None),
    patient_name: Optional[str] = Form(None),
    patient_email: Optional[str] = Form(None),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Bulk upload retinal images for clinic"""
    # Check permissions
    stmt = select(ClinicUser).where(
        and_(
            ClinicUser.clinic_id == clinic_id,
            ClinicUser.user_id == current_user.id,
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
    
    # Check clinic exists and has credits
    stmt = select(Clinic).where(Clinic.id == clinic_id)
    result = await db.execute(stmt)
    clinic = result.scalar_one_or_none()
    
    if not clinic:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Clinic not found"
        )
    
    if clinic.analysis_credits < len(files):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Insufficient credits. Required: {len(files)}, Available: {clinic.analysis_credits}"
        )
    
    # Handle patient creation/retrieval
    if patient_id:
        # Verify patient exists and belongs to this clinic
        stmt = select(PatientProfile).where(
            and_(
                PatientProfile.id == patient_id,
                PatientProfile.clinic_id == clinic_id
            )
        )
        result = await db.execute(stmt)
        patient = result.scalar_one_or_none()
        
        if not patient:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Patient not found"
            )
    else:
        # Create new patient profile
        if not patient_name or not patient_email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Patient name and email required for new patient"
            )
        
        patient = PatientProfile(
            full_name=patient_name,
            email=patient_email,
            clinic_id=clinic_id
        )
        db.add(patient)
        await db.commit()
        await db.refresh(patient)
        patient_id = patient.id
    
    # Upload images
    uploaded_images = []
    upload_errors = []
    
    for file in files:
        try:
            # Validate file type
            if not file.content_type.startswith('image/'):
                upload_errors.append(f"{file.filename}: Invalid file type")
                continue
            
            # Upload to Cloudinary
            image_url = await upload_image_to_cloudinary(file.file, folder=f"clinics/{clinic_id}")
            
            # Create medical image record
            medical_image = MedicalImage(
                patient_id=patient_id,
                clinic_id=clinic_id,
                image_url=image_url,
                status=ImageStatus.PENDING
            )
            db.add(medical_image)
            await db.commit()
            await db.refresh(medical_image)
            
            # Add to background processing
            background_tasks.add_task(simulate_ai_analysis, medical_image.id, db)
            
            uploaded_images.append({
                "id": medical_image.id,
                "filename": file.filename,
                "url": image_url,
                "status": "uploaded"
            })
            
        except Exception as e:
            upload_errors.append(f"{file.filename}: {str(e)}")
    
    # Update clinic credits
    clinic.analysis_credits -= len(uploaded_images)
    await db.commit()
    
    return {
        "message": f"Successfully uploaded {len(uploaded_images)} images",
        "uploaded_images": uploaded_images,
        "errors": upload_errors,
        "remaining_credits": clinic.analysis_credits,
        "patient_id": patient_id
    }

@router.get("/status/{batch_id}")
async def get_bulk_upload_status(
    clinic_id: str,
    batch_id: str,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Get status of bulk upload batch"""
    # Check permissions
    stmt = select(ClinicUser).where(
        and_(
            ClinicUser.clinic_id == clinic_id,
            ClinicUser.user_id == current_user.id,
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
    
    # Get images for this batch (assuming batch_id is stored in a separate table or as metadata)
    # For now, we'll return all recent uploads for this clinic
    stmt = select(MedicalImage).where(
        and_(
            MedicalImage.clinic_id == clinic_id,
            MedicalImage.created_at >= func.now() - timedelta(hours=24)  # Last 24 hours
        )
    ).order_by(MedicalImage.created_at.desc())
    
    result = await db.execute(stmt)
    images = result.scalars().all()
    
    # Count by status
    status_counts = {}
    for image in images:
        status = image.status.value
        status_counts[status] = status_counts.get(status, 0) + 1
    
    return {
        "batch_id": batch_id,
        "total_images": len(images),
        "status_counts": status_counts,
        "images": [
            {
                "id": img.id,
                "filename": img.image_url.split('/')[-1],
                "status": img.status.value,
                "upload_date": img.upload_date,
                "patient_id": img.patient_id
            }
            for img in images
        ]
    }

@router.post("/patients")
async def bulk_create_patients(
    clinic_id: str,
    patients_data: List[dict],
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Bulk create patients for clinic"""
    # Check permissions
    stmt = select(ClinicUser).where(
        and_(
            ClinicUser.clinic_id == clinic_id,
            ClinicUser.user_id == current_user.id,
            ClinicUser.role.in_([ClinicUserRole.ADMIN, ClinicUserRole.STAFF]),
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
    
    created_patients = []
    errors = []
    
    for patient_data in patients_data:
        try:
            # Validate required fields
            if not patient_data.get("full_name") or not patient_data.get("email"):
                errors.append(f"Patient missing required fields: {patient_data}")
                continue
            
            # Check if patient already exists
            stmt = select(PatientProfile).where(
                and_(
                    PatientProfile.email == patient_data["email"],
                    PatientProfile.clinic_id == clinic_id
                )
            )
            result = await db.execute(stmt)
            existing_patient = result.scalar_one_or_none()
            
            if existing_patient:
                errors.append(f"Patient with email {patient_data['email']} already exists")
                continue
            
            # Create patient
            patient = PatientProfile(
                full_name=patient_data["full_name"],
                email=patient_data["email"],
                date_of_birth=patient_data.get("date_of_birth"),
                phone=patient_data.get("phone"),
                medical_history=patient_data.get("medical_history"),
                clinic_id=clinic_id
            )
            
            db.add(patient)
            await db.commit()
            await db.refresh(patient)
            
            created_patients.append({
                "id": patient.id,
                "full_name": patient.full_name,
                "email": patient.email
            })
            
        except Exception as e:
            errors.append(f"Error creating patient {patient_data.get('email', 'unknown')}: {str(e)}")
    
    return {
        "message": f"Successfully created {len(created_patients)} patients",
        "created_patients": created_patients,
        "errors": errors
    }

@router.get("/recent-uploads")
async def get_recent_uploads(
    clinic_id: str,
    limit: int = 50,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Get recent uploads for clinic"""
    # Check permissions
    stmt = select(ClinicUser).where(
        and_(
            ClinicUser.clinic_id == clinic_id,
            ClinicUser.user_id == current_user.id,
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
    
    # Get recent uploads
    stmt = select(MedicalImage).where(
        MedicalImage.clinic_id == clinic_id
    ).order_by(MedicalImage.created_at.desc()).limit(limit)
    
    result = await db.execute(stmt)
    images = result.scalars().all()
    
    return {
        "recent_uploads": [
            {
                "id": img.id,
                "image_url": img.image_url,
                "status": img.status.value,
                "upload_date": img.upload_date,
                "patient_id": img.patient_id
            }
            for img in images
        ]
    }
