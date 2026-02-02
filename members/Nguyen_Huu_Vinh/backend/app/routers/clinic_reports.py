from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func, extract

from app.database.connection import get_db
from app.models.clinic import Clinic, ClinicProfile
from app.models.clinic_user import ClinicUser, ClinicUserRole, ClinicUserStatus
from app.models.user import User, UserRole
from app.models.medical_image import MedicalImage, ImageStatus
from app.models.analysis_result import AnalysisResult, RiskLevel
from app.models.patient_profile import PatientProfile
from app.utils.auth import get_current_active_user

router = APIRouter(prefix="/clinics/{clinic_id}/reports", tags=["clinic-reports"])

@router.get("/overview")
async def get_clinic_overview(
    clinic_id: str,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Get clinic overview statistics"""
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
    
    # Get clinic info
    stmt = select(Clinic).where(Clinic.id == clinic_id)
    result = await db.execute(stmt)
    clinic = result.scalar_one_or_none()
    
    if not clinic:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Clinic not found"
        )
    
    # Get clinic profile
    stmt = select(ClinicProfile).where(ClinicProfile.clinic_id == clinic_id)
    result = await db.execute(stmt)
    profile = result.scalar_one_or_none()
    
    # Basic counts
    total_patients = await db.scalar(
        select(func.count(PatientProfile.id)).where(PatientProfile.clinic_id == clinic_id)
    )
    
    total_images = await db.scalar(
        select(func.count(MedicalImage.id)).where(MedicalImage.clinic_id == clinic_id)
    )
    
    total_analyses = await db.scalar(
        select(func.count(AnalysisResult.id))
        .join(MedicalImage, AnalysisResult.image_id == MedicalImage.id)
        .where(MedicalImage.clinic_id == clinic_id)
    )
    
    # Risk distribution
    risk_distribution_stmt = (
        select(AnalysisResult.risk_level, func.count(AnalysisResult.id))
        .join(MedicalImage, AnalysisResult.image_id == MedicalImage.id)
        .where(MedicalImage.clinic_id == clinic_id)
        .group_by(AnalysisResult.risk_level)
    )
    result = await db.execute(risk_distribution_stmt)
    risk_distribution = dict(result.all())
    
    # High risk cases
    high_risk_cases = risk_distribution.get(RiskLevel.HIGH, 0)
    
    # Recent activity (last 30 days)
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    
    recent_images = await db.scalar(
        select(func.count(MedicalImage.id))
        .where(
            and_(
                MedicalImage.clinic_id == clinic_id,
                MedicalImage.created_at >= thirty_days_ago
            )
        )
    )
    
    recent_analyses = await db.scalar(
        select(func.count(AnalysisResult.id))
        .join(MedicalImage, AnalysisResult.image_id == MedicalImage.id)
        .where(
            and_(
                MedicalImage.clinic_id == clinic_id,
                AnalysisResult.created_at >= thirty_days_ago
            )
        )
    )
    
    # Staff count
    staff_count = await db.scalar(
        select(func.count(ClinicUser.id))
        .where(
            and_(
                ClinicUser.clinic_id == clinic_id,
                ClinicUser.status == ClinicUserStatus.ACTIVE
            )
        )
    )
    
    return {
        "clinic_info": {
            "name": clinic.name,
            "status": clinic.status.value,
            "current_package": clinic.current_package,
            "analysis_credits": clinic.analysis_credits
        },
        "statistics": {
            "total_patients": total_patients or 0,
            "total_images": total_images or 0,
            "total_analyses": total_analyses or 0,
            "high_risk_cases": high_risk_cases,
            "staff_count": staff_count or 0
        },
        "risk_distribution": {
            "low": risk_distribution.get(RiskLevel.LOW, 0),
            "medium": risk_distribution.get(RiskLevel.MEDIUM, 0),
            "high": high_risk_cases
        },
        "recent_activity": {
            "recent_images": recent_images or 0,
            "recent_analyses": recent_analyses or 0
        }
    }

@router.get("/analytics")
async def get_clinic_analytics(
    clinic_id: str,
    start_date: Optional[datetime] = Query(None),
    end_date: Optional[datetime] = Query(None),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Get detailed clinic analytics"""
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
    
    # Default to last 90 days if no dates provided
    if not start_date:
        start_date = datetime.utcnow() - timedelta(days=90)
    if not end_date:
        end_date = datetime.utcnow()
    
    # Daily analysis trends
    daily_trends_stmt = (
        select(
            func.date(MedicalImage.created_at).label('date'),
            func.count(MedicalImage.id).label('images'),
            func.count(AnalysisResult.id).label('analyses')
        )
        .outerjoin(AnalysisResult, MedicalImage.id == AnalysisResult.image_id)
        .where(
            and_(
                MedicalImage.clinic_id == clinic_id,
                MedicalImage.created_at >= start_date,
                MedicalImage.created_at <= end_date
            )
        )
        .group_by(func.date(MedicalImage.created_at))
        .order_by(func.date(MedicalImage.created_at))
    )
    result = await db.execute(daily_trends_stmt)
    daily_trends = [
        {
            "date": str(row.date),
            "images": row.images,
            "analyses": row.analyses
        }
        for row in result.all()
    ]
    
    # Monthly risk trends
    monthly_risk_stmt = (
        select(
            extract('year', AnalysisResult.created_at).label('year'),
            extract('month', AnalysisResult.created_at).label('month'),
            AnalysisResult.risk_level,
            func.count(AnalysisResult.id).label('count')
        )
        .join(MedicalImage, AnalysisResult.image_id == MedicalImage.id)
        .where(
            and_(
                MedicalImage.clinic_id == clinic_id,
                AnalysisResult.created_at >= start_date,
                AnalysisResult.created_at <= end_date
            )
        )
        .group_by(
            extract('year', AnalysisResult.created_at),
            extract('month', AnalysisResult.created_at),
            AnalysisResult.risk_level
        )
        .order_by(
            extract('year', AnalysisResult.created_at),
            extract('month', AnalysisResult.created_at)
        )
    )
    result = await db.execute(monthly_risk_stmt)
    monthly_risk = [
        {
            "year": int(row.year),
            "month": int(row.month),
            "risk_level": row.risk_level.value,
            "count": row.count
        }
        for row in result.all()
    ]
    
    # Top findings
    top_findings_stmt = (
        select(
            AnalysisResult.findings,
            func.count(AnalysisResult.id).label('frequency')
        )
        .join(MedicalImage, AnalysisResult.image_id == MedicalImage.id)
        .where(
            and_(
                MedicalImage.clinic_id == clinic_id,
                AnalysisResult.created_at >= start_date,
                AnalysisResult.created_at <= end_date
            )
        )
        .group_by(AnalysisResult.findings)
        .order_by(func.count(AnalysisResult.id).desc())
        .limit(10)
    )
    result = await db.execute(top_findings_stmt)
    top_findings = [
        {
            "findings": row.findings,
            "frequency": row.frequency
        }
        for row in result.all()
    ]
    
    return {
        "period": {
            "start_date": start_date.isoformat(),
            "end_date": end_date.isoformat()
        },
        "daily_trends": daily_trends,
        "monthly_risk_trends": monthly_risk,
        "top_findings": top_findings
    }

@router.get("/patients")
async def get_clinic_patients_report(
    clinic_id: str,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    risk_level: Optional[str] = Query(None),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Get clinic patients report"""
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
    
    # Base query for patients
    patients_stmt = (
        select(PatientProfile)
        .where(PatientProfile.clinic_id == clinic_id)
        .offset(skip)
        .limit(limit)
        .order_by(PatientProfile.created_at.desc())
    )
    
    result = await db.execute(patients_stmt)
    patients = result.scalars().all()
    
    # Get analysis stats for each patient
    patients_data = []
    for patient in patients:
        # Get total images and analyses
        total_images = await db.scalar(
            select(func.count(MedicalImage.id))
            .where(MedicalImage.patient_id == patient.id)
        )
        
        # Get latest analysis
        latest_analysis_stmt = (
            select(AnalysisResult)
            .join(MedicalImage, AnalysisResult.image_id == MedicalImage.id)
            .where(MedicalImage.patient_id == patient.id)
            .order_by(AnalysisResult.created_at.desc())
            .limit(1)
        )
        result = await db.execute(latest_analysis_stmt)
        latest_analysis = result.scalar_one_or_none()
        
        # Get risk distribution
        risk_dist_stmt = (
            select(AnalysisResult.risk_level, func.count(AnalysisResult.id))
            .join(MedicalImage, AnalysisResult.image_id == MedicalImage.id)
            .where(MedicalImage.patient_id == patient.id)
            .group_by(AnalysisResult.risk_level)
        )
        result = await db.execute(risk_dist_stmt)
        risk_distribution = dict(result.all())
        
        patients_data.append({
            "patient_id": patient.id,
            "full_name": patient.full_name,
            "email": patient.email,
            "date_of_birth": patient.date_of_birth,
            "created_at": patient.created_at,
            "total_images": total_images or 0,
            "total_analyses": sum(risk_distribution.values()),
            "latest_risk_level": latest_analysis.risk_level.value if latest_analysis else None,
            "latest_analysis_date": latest_analysis.created_at if latest_analysis else None,
            "risk_distribution": {
                "low": risk_distribution.get(RiskLevel.LOW, 0),
                "medium": risk_distribution.get(RiskLevel.MEDIUM, 0),
                "high": risk_distribution.get(RiskLevel.HIGH, 0)
            }
        })
    
    # Filter by risk level if specified
    if risk_level:
        patients_data = [
            p for p in patients_data 
            if p["latest_risk_level"] == risk_level
        ]
    
    return {
        "patients": patients_data,
        "total_count": len(patients_data)
    }

@router.get("/export")
async def export_clinic_data(
    clinic_id: str,
    format: str = Query("csv", regex="^(csv|json)$"),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Export clinic data"""
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
    
    # Get all clinic data
    overview = await get_clinic_overview(clinic_id, current_user, db)
    patients_report = await get_clinic_patients_report(clinic_id, 0, 1000, None, current_user, db)
    
    export_data = {
        "clinic_overview": overview,
        "patients": patients_report["patients"],
        "export_date": datetime.utcnow().isoformat()
    }
    
    if format == "json":
        return export_data
    else:
        # For CSV, we'll return a simplified version
        # In a real implementation, you'd generate actual CSV files
        return {
            "message": "CSV export not yet implemented",
            "data": export_data
        }

@router.get("/alerts")
async def get_clinic_alerts(
    clinic_id: str,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Get clinic alerts and notifications"""
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
    
    alerts = []
    
    # Low credits alert
    stmt = select(Clinic).where(Clinic.id == clinic_id)
    result = await db.execute(stmt)
    clinic = result.scalar_one_or_none()
    
    if clinic and clinic.analysis_credits < 10:
        alerts.append({
            "type": "low_credits",
            "severity": "warning",
            "message": f"Low analysis credits: {clinic.analysis_credits} remaining",
            "action": "purchase_credits"
        })
    
    # High risk patients alert
    high_risk_stmt = (
        select(func.count(AnalysisResult.id))
        .join(MedicalImage, AnalysisResult.image_id == MedicalImage.id)
        .where(
            and_(
                MedicalImage.clinic_id == clinic_id,
                AnalysisResult.risk_level == RiskLevel.HIGH,
                AnalysisResult.created_at >= datetime.utcnow() - timedelta(days=7)
            )
        )
    )
    high_risk_count = await db.scalar(high_risk_stmt)
    
    if high_risk_count > 0:
        alerts.append({
            "type": "high_risk_patients",
            "severity": "critical",
            "message": f"{high_risk_count} high-risk patients detected in the last 7 days",
            "action": "review_patients"
        })
    
    return {
        "alerts": alerts,
        "total_alerts": len(alerts)
    }
