from datetime import datetime
from pydantic import BaseModel
from app.models.medical_image import ImageStatus

class MedicalImageCreate(BaseModel):
    image_url: str

class MedicalImageResponse(BaseModel):
    id: str
    patient_id: str
    image_url: str
    upload_date: datetime
    status: ImageStatus
    created_at: datetime
    
    class Config:
        from_attributes = True
