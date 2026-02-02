from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.database.connection import get_db
from app.models.user import User, UserRole
from app.models.patient_profile import PatientProfile
from app.models.medical_image import MedicalImage, ImageStatus
from app.models.analysis_result import AnalysisResult
from app.schemas.analysis_result import AnalysisResultResponse, AnalysisResultUpdate
from app.schemas.medical_image import MedicalImageResponse
from app.utils.auth import get_current_active_user

router = APIRouter(prefix="/analysis", tags=["analysis"])

@router.get("/doctor/dashboard", response_model=list[dict])
async def get_doctor_dashboard(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Get dashboard data for doctors - all analyzed images"""
    # Check if user is a doctor
    if current_user.role != UserRole.DOCTOR:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only doctors can access this endpoint"
        )
    
    # Get all analyzed images with their results and patient info
    stmt = (
        select(MedicalImage)
        .options(selectinload(MedicalImage.patient))
        .options(selectinload(MedicalImage.analysis_results))
        .where(MedicalImage.status == ImageStatus.ANALYZED)
        .order_by(MedicalImage.upload_date.desc())
    )
    
    result = await db.execute(stmt)
    images = result.scalars().all()
    
    dashboard_data = []
    for image in images:
        analysis_result = image.analysis_results[0] if image.analysis_results else None
        
        dashboard_data.append({
            "image_id": str(image.id),
            "patient_name": image.patient.full_name,
            "upload_date": image.upload_date,
            "image_url": image.image_url,
            "risk_level": analysis_result.risk_level if analysis_result else None,
            "confidence_score": analysis_result.confidence_score if analysis_result else None,
            "findings": analysis_result.findings if analysis_result else None,
            "doctor_notes": analysis_result.doctor_notes if analysis_result else None,
            "analysis_id": str(analysis_result.id) if analysis_result else None
        })
    
    return dashboard_data

@router.patch("/{analysis_id}/validate", response_model=AnalysisResultResponse)
async def update_analysis_validation(
    analysis_id: str,
    update_data: AnalysisResultUpdate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Add doctor validation notes to analysis result"""
    # Check if user is a doctor
    if current_user.role != UserRole.DOCTOR:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only doctors can add validation notes"
        )
    
    # Get analysis result
    stmt = select(AnalysisResult).where(AnalysisResult.id == analysis_id)
    result = await db.execute(stmt)
    analysis_result = result.scalar_one_or_none()
    
    if not analysis_result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Analysis result not found"
        )
    
    # Update doctor notes
    if update_data.doctor_notes is not None:
        analysis_result.doctor_notes = update_data.doctor_notes
    
    await db.commit()
    await db.refresh(analysis_result)
    
    return analysis_result

@router.get("/my-results", response_model=list[AnalysisResultResponse])
async def get_my_analysis_results(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Get all analysis results for current patient"""
    # Check if user is a patient
    if current_user.role != UserRole.PATIENT:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only patients can view their results"
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
    
    # Get all analysis results for this patient
    stmt = (
        select(AnalysisResult)
        .join(MedicalImage)
        .where(MedicalImage.patient_id == patient_profile.id)
        .order_by(AnalysisResult.created_at.desc())
    )
    
    result = await db.execute(stmt)
    analysis_results = result.scalars().all()
    
    return list(analysis_results)
