from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from typing import List

from database import get_session
from models import Patient 
from schemas import PatientCreate, PatientOut 

# Bố đặt prefix ở đây rồi, nên bên dưới không cần viết lại "/api/patients" nữa nhé
router = APIRouter(prefix="/api/patients", tags=["Patients"])

# 1. Thêm mới
@router.post("/", response_model=Patient)
def create_patient(patient_input: PatientCreate, session: Session = Depends(get_session)):
    new_patient = Patient(
        full_name=patient_input.full_name,
        gender=patient_input.gender,
        birth_year=patient_input.birth_year,
        phone=patient_input.phone,
        address=patient_input.address,
        medical_history=patient_input.medical_history
    )
    session.add(new_patient)
    session.commit()
    session.refresh(new_patient)
    return new_patient

# 2. Lấy danh sách (Có tìm kiếm)
@router.get("/", response_model=List[Patient])
def get_patients(search: str = None, session: Session = Depends(get_session)):
    query = select(Patient)
    if search:
        query = query.where(
            (Patient.full_name.contains(search)) | 
            (Patient.phone.contains(search))
        )
    return session.exec(query).all()

# 3. Sửa thông tin (ĐÃ SỬA LỖI URL)
@router.put("/{patient_id}", response_model=Patient) 
# ^^^ Chỉ để /{patient_id} thôi, vì prefix ở trên đã lo phần "/api/patients" rồi
def update_patient(patient_id: int, patient_in: PatientCreate, session: Session = Depends(get_session)):
    """API sửa thông tin bệnh nhân"""
    # Tìm bệnh nhân cũ
    patient = session.get(Patient, patient_id)
    if not patient:
        raise HTTPException(status_code=404, detail="Không tìm thấy bệnh nhân này")
    
    # Cập nhật thông tin mới
    patient.full_name = patient_in.full_name
    patient.phone = patient_in.phone
    patient.birth_year = patient_in.birth_year
    patient.gender = patient_in.gender
    patient.medical_history = patient_in.medical_history
    patient.address = patient_in.address # Bố thêm dòng này để sửa được cả địa chỉ nhé

    # Lưu vào database
    session.add(patient)
    session.commit()
    session.refresh(patient)
    return patient
# --- Dán đoạn này vào CUỐI CÙNG file patients.py ---

@router.delete("/{patient_id}")
def delete_patient(patient_id: int, session: Session = Depends(get_session)):
    """API xóa bệnh nhân"""
    patient = session.get(Patient, patient_id)
    if not patient:
        raise HTTPException(status_code=404, detail="Không tìm thấy bệnh nhân")
    
    session.delete(patient)
    session.commit()
    return {"message": "Đã xóa thành công"}