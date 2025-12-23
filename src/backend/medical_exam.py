from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from database import get_session
from models import Appointment, MedicalRecord
from pydantic import BaseModel
from typing import List

# --- LƯU Ý QUAN TRỌNG: ---
# Nếu bên Frontend bạn gọi là /api/medical_exams thì sửa prefix ở dưới cho khớp nhé.
# Hiện tại mình giữ nguyên là /api/medical như file gốc của bạn.
router = APIRouter(prefix="/api/medical", tags=["Medical Exam"])

# Schema dữ liệu gửi lên
class ExamInput(BaseModel):
    appointment_id: int
    diagnosis: str
    prescription: str
    notes: str = ""

# 1. API Bác sĩ bấm "Hoàn tất khám"
@router.post("/finish-exam")
def finish_examination(data: ExamInput, session: Session = Depends(get_session)):
    # Tìm lịch hẹn
    appt = session.get(Appointment, data.appointment_id)
    if not appt:
        raise HTTPException(status_code=404, detail="Không tìm thấy lịch hẹn")

    # Tạo hồ sơ bệnh án
    # Lưu ý: Mặc định status là 'pending' (chưa trả tiền) nếu model có cột status
    record = MedicalRecord(
        appointment_id=data.appointment_id,
        doctor_id=appt.doctor_id,
        patient_id=appt.patient_id,
        diagnosis=data.diagnosis,
        prescription=data.prescription,
        notes=data.notes,
        status="pending" # <-- Thêm dòng này nếu model MedicalRecord có cột status
    )
    session.add(record)

    # Cập nhật trạng thái lịch hẹn thành "Đã khám"
    appt.status = "COMPLETED"
    session.add(appt)

    session.commit()
    session.refresh(record) # Refresh để lấy ID mới tạo
    return {"message": "Đã lưu bệnh án thành công!", "record_id": record.id}

# 2. API Lấy lịch sử (Cũ của bạn)
@router.get("/history/{patient_id}")
def get_patient_history(patient_id: int, session: Session = Depends(get_session)):
    statement = select(MedicalRecord).where(MedicalRecord.patient_id == patient_id).order_by(MedicalRecord.created_at.desc())
    results = session.exec(statement).all()
    return results

# --- PHẦN MỚI THÊM CHO THU NGÂN ---

# 3. API Lấy TOÀN BỘ danh sách khám bệnh (Để Thu ngân nhìn thấy ai cần trả tiền)
@router.get("/")
def get_all_medical_records(session: Session = Depends(get_session)):
    # Lấy tất cả hồ sơ, người mới khám nằm trên cùng
    statement = select(MedicalRecord).order_by(MedicalRecord.id.desc())
    results = session.exec(statement).all()
    return results

# 4. API Cập nhật trạng thái "Đã Trả Tiền"
@router.put("/{record_id}/pay")
def pay_medical_bill(record_id: int, session: Session = Depends(get_session)):
    # Tìm hồ sơ theo ID
    record = session.get(MedicalRecord, record_id)
    if not record:
        raise HTTPException(status_code=404, detail="Không tìm thấy hồ sơ")
    
    # Đổi trạng thái sang 'completed' (Đã xong/Đã thanh toán)
    # Bạn cần đảm bảo file models.py -> Class MedicalRecord có cột "status" nhé!
    record.status = "completed"
    
    session.add(record)
    session.commit()
    return {"message": "Thanh toán thành công", "status": "completed"}