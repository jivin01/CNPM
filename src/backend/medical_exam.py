from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from database import get_session
from models import Appointment, MedicalRecord
from pydantic import BaseModel
from typing import List

router = APIRouter(prefix="/api/medical", tags=["Medical Exam"])

# Schema dữ liệu gửi lên
class ExamInput(BaseModel):
    appointment_id: int
    diagnosis: str
    prescription: str
    notes: str = ""

@router.post("/finish-exam")
def finish_examination(data: ExamInput, session: Session = Depends(get_session)):
    # 1. Tìm lịch hẹn
    appt = session.get(Appointment, data.appointment_id)
    if not appt:
        raise HTTPException(status_code=404, detail="Không tìm thấy lịch hẹn")

    # 2. Tạo hồ sơ bệnh án
    record = MedicalRecord(
        appointment_id=data.appointment_id,
        doctor_id=appt.doctor_id,
        patient_id=appt.patient_id,
        diagnosis=data.diagnosis,
        prescription=data.prescription,
        notes=data.notes
    )
    session.add(record)

    # 3. Cập nhật trạng thái lịch hẹn thành "Đã khám" (COMPLETED)
    appt.status = "COMPLETED"
    session.add(appt)

    session.commit()
    return {"message": "Đã lưu bệnh án thành công!", "record_id": record.id}
  
# Thêm API lấy lịch sử
@router.get("/history/{patient_id}")
def get_patient_history(patient_id: int, session: Session = Depends(get_session)):
    # Lấy danh sách bệnh án, sắp xếp mới nhất lên đầu
    statement = select(MedicalRecord).where(MedicalRecord.patient_id == patient_id).order_by(MedicalRecord.created_at.desc())
    results = session.exec(statement).all()
    return results