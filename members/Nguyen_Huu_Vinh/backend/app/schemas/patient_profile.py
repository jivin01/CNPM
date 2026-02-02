from datetime import datetime
from typing import Optional
from pydantic import BaseModel

class PatientProfileCreate(BaseModel):
    full_name: str
    date_of_birth: datetime
    medical_history: Optional[str] = None

class PatientProfileResponse(BaseModel):
    id: str
    user_id: str
    full_name: str
    date_of_birth: datetime
    medical_history: Optional[str]
    created_at: datetime
    
    class Config:
        from_attributes = True
