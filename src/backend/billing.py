# File: src/backend/billing.py
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from typing import List
from pydantic import BaseModel
from datetime import datetime

# Import database và models (Cùng cấp thư mục nên import trực tiếp)
from database import get_session
from models import MedicalRecord, Prescription, PrescriptionItem, Medicine, Patient

router = APIRouter(
    prefix="/api/billing",
    tags=["Billing - Thu Ngân"]
)

# --- SCHEMA ---
class BillItem(BaseModel):
    medicine_name: str
    unit: str
    quantity: int
    price_per_unit: float
    total_price: float

class BillDetail(BaseModel):
    record_id: int
    patient_name: str
    diagnosis: str
    created_at: str
    exam_fee: float
    medicine_fee: float
    total_amount: float
    items: List[BillItem]

# --- API ---
@router.get("/{record_id}", response_model=BillDetail)
def get_bill_detail(record_id: int, session: Session = Depends(get_session)):
    record = session.get(MedicalRecord, record_id)
    if not record:
        raise HTTPException(status_code=404, detail="Không tìm thấy hồ sơ")
        
    patient = session.get(Patient, record.patient_id)
    patient_name = patient.full_name if patient else "Khách vãng lai"
    
    # Định dạng ngày tháng an toàn
    created_at_str = ""
    if record.created_at:
        created_at_str = record.created_at.strftime("%d/%m/%Y %H:%M")

    EXAM_FEE = 50000.0
    medicine_fee = 0.0
    bill_items = []

    prescription = session.exec(select(Prescription).where(Prescription.medical_record_id == record_id)).first()

    if prescription:
        pres_items = session.exec(select(PrescriptionItem).where(PrescriptionItem.prescription_id == prescription.id)).all()
        for item in pres_items:
            medicine = session.get(Medicine, item.medicine_id)
            if medicine:
                price = medicine.price
                item_total = price * item.quantity
                medicine_fee += item_total
                bill_items.append(BillItem(
                    medicine_name=medicine.name,
                    unit=medicine.unit,
                    quantity=item.quantity,
                    price_per_unit=price,
                    total_price=item_total
                ))

    total_amount = EXAM_FEE + medicine_fee

    return BillDetail(
        record_id=record.id,
        patient_name=patient_name,
        diagnosis=record.diagnosis or "Chưa có chẩn đoán",
        created_at=created_at_str,
        exam_fee=EXAM_FEE,
        medicine_fee=medicine_fee,
        total_amount=total_amount,
        items=bill_items
    )