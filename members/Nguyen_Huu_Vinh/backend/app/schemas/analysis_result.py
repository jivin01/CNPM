from datetime import datetime
from typing import Optional, Dict, Any
from pydantic import BaseModel
from app.models.analysis_result import RiskLevel

class AnalysisResultCreate(BaseModel):
    image_id: str
    risk_level: RiskLevel
    confidence_score: float
    findings: Optional[Dict[str, Any]] = None

class AnalysisResultResponse(BaseModel):
    id: str
    image_id: str
    risk_level: RiskLevel
    confidence_score: float
    findings: Optional[Dict[str, Any]]
    doctor_notes: Optional[str]
    created_at: datetime
    
    class Config:
        from_attributes = True

class AnalysisResultUpdate(BaseModel):
    doctor_notes: Optional[str] = None
