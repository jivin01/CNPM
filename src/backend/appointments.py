from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from datetime import timedelta
from typing import List

# Import các file của bạn
from database import get_session
from models import Appointment, User, Patient
from schemas import AppointmentCreate, AppointmentOut

# === QUAN TRỌNG: Dòng này tạo biến 'router' mà main.py đang tìm ===
router = APIRouter(prefix="/api/appointments", tags=["Appointments"])

@router.post("/", response_model=AppointmentOut)
def create_appointment(appt_in: AppointmentCreate, session: Session = Depends(get_session)):
    
    # 1. Kiểm tra Bệnh nhân có tồn tại không?
    patient = session.get(Patient, appt_in.patient_id)
    if not patient:
        raise HTTPException(status_code=404, detail="Không tìm thấy bệnh nhân này")

    # 2. Kiểm tra Bác sĩ có tồn tại không?
    doctor = session.get(User, appt_in.doctor_id)
    if not doctor:
        raise HTTPException(status_code=404, detail="Không tìm thấy bác sĩ này")

    # 3. LOGIC CHECK TRÙNG LỊCH
    # Quy ước: Mỗi ca khám là 30 phút
    new_start = appt_in.appointment_time
    new_end = new_start + timedelta(minutes=30)

    # Lấy danh sách lịch đã có của bác sĩ đó
    statement = select(Appointment).where(
        Appointment.doctor_id == appt_in.doctor_id,
        Appointment.status != "CANCELLED"
    )
    existing_appts = session.exec(statement).all()

    # So sánh thời gian
    for old_appt in existing_appts:
        old_start = old_appt.appointment_time
        old_end = old_start + timedelta(minutes=30)

        # Công thức giao nhau
        if new_start < old_end and new_end > old_start:
            raise HTTPException(
                status_code=400, 
                detail=f"Bác sĩ đã bận vào khung giờ này! (Trùng lịch lúc {old_start.strftime('%H:%M')})"
            )

    # 4. Lưu vào Database
    new_appt = Appointment(
        patient_id=appt_in.patient_id,
        doctor_id=appt_in.doctor_id,
        appointment_time=appt_in.appointment_time,
        reason=appt_in.reason,
        status="PENDING"
    )
    
    session.add(new_appt)
    session.commit()
    session.refresh(new_appt)
    return new_appt

@router.get("/", response_model=List[AppointmentOut])
def get_all_appointments(session: Session = Depends(get_session)):
    """Lấy danh sách toàn bộ lịch hẹn (Sắp xếp theo thời gian khám tăng dần)"""
    # .order_by(...) giúp danh sách luôn hiển thị từ sáng -> chiều
    statement = select(Appointment).order_by(Appointment.appointment_time)
    return session.exec(statement).all()

# ==========================================
# MỚI THÊM: API XÓA LỊCH HẸN THỦ CÔNG
# ==========================================
@router.delete("/{appointment_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_appointment(
    appointment_id: int, 
    session: Session = Depends(get_session)
):
    """
    API xóa một lịch hẹn dựa trên ID.
    Dùng cho nút 'Xóa' ở giao diện Frontend.
    """
    # 1. Tìm lịch hẹn trong DB
    appointment = session.get(Appointment, appointment_id)
    
    # 2. Nếu không thấy thì báo lỗi 404
    if not appointment:
        raise HTTPException(status_code=404, detail="Lịch hẹn không tồn tại hoặc đã bị xóa")
    
    # 3. Thực hiện xóa và lưu thay đổi
    session.delete(appointment)
    session.commit()
    
    # Trả về None (HTTP 204) nghĩa là thành công nhưng không có nội dung trả về
    return None