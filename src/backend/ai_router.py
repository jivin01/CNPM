from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, status
from sqlmodel import Session, select
from database import get_session
from auth_utils import get_current_user
from models import AIDiagnosis, MedicalRecord
from typing import Optional
import os
import uuid
import shutil
import json

from pydantic import BaseModel

# Load AI predictor from src/ai-core/run_model.py (folder name has a hyphen)
import importlib.util
ai_module_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'ai-core', 'run_model.py'))
spec = importlib.util.spec_from_file_location('run_model', ai_module_path)
run_model = importlib.util.module_from_spec(spec)
spec.loader.exec_module(run_model)
predict = getattr(run_model, 'predict')
predict_json = getattr(run_model, 'predict_json', None)

router = APIRouter(prefix="/api/ai", tags=["AI"])

UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "..", "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)


class PrescribeInput(BaseModel):
    prescription: str
    notes: Optional[str] = None


@router.post("/upload")
def upload_retina_image(file: UploadFile = File(...), session: Session = Depends(get_session), current_user=Depends(get_current_user)):
    # Only patients can upload images
    if current_user.role != "patient":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Chỉ bệnh nhân được phép upload ảnh")

    # Save file
    ext = os.path.splitext(file.filename)[1]
    filename = f"{uuid.uuid4().hex}{ext}"
    dest_path = os.path.abspath(os.path.join(UPLOAD_DIR, filename))
    with open(dest_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # Call AI predictor
    try:
        result = predict(dest_path)
        result_json = json.dumps(result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI prediction failed: {e}")

    # Store record
    ai_record = AIDiagnosis(
        patient_id=current_user.id,
        image_path=dest_path,
        result_json=result_json,
        status="pending"
    )
    session.add(ai_record)
    session.commit()
    session.refresh(ai_record)

    return {"message": "AI prediction created", "ai_id": ai_record.id, "result": result}


@router.get("/pending")
def list_pending(session: Session = Depends(get_session), current_user=Depends(get_current_user)):
    # Only doctors can view pending AI results
    if current_user.role != "doctor":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Chỉ bác sĩ được phép truy cập")

    statement = select(AIDiagnosis).where(AIDiagnosis.status == "pending")
    results = session.exec(statement).all()
    return results


@router.post("/{ai_id}/prescribe")
def prescribe(ai_id: int, data: PrescribeInput, session: Session = Depends(get_session), current_user=Depends(get_current_user)):
    # Only doctors can prescribe
    if current_user.role != "doctor":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Chỉ bác sĩ được phép kê đơn")

    ai_record = session.get(AIDiagnosis, ai_id)
    if not ai_record:
        raise HTTPException(status_code=404, detail="Không tìm thấy kết quả AI")

    # Create a MedicalRecord from AI result + doctor's prescription
    record = MedicalRecord(
        appointment_id=0,
        doctor_id=current_user.id,
        patient_id=ai_record.patient_id,
        diagnosis=ai_record.result_json or "",
        prescription=data.prescription,
        notes=(data.notes or ""),
        status="completed"
    )
    session.add(record)
    session.commit()
    session.refresh(record)

    # Update AI record
    ai_record.status = "reviewed"
    ai_record.assigned_doctor_id = current_user.id
    ai_record.medical_record_id = record.id
    session.add(ai_record)
    session.commit()

    return {"message": "Đã lưu đơn thuốc và bệnh án", "record_id": record.id}
