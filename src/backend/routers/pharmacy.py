from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from typing import List
# Import các module từ file gốc của bạn (đảm bảo đường dẫn đúng)
from database import get_session 
import models 
import schemas

router = APIRouter(prefix="/api/pharmacy", tags=["Pharmacy"])

# 1. API Lấy danh sách thuốc
@router.get("/medicines", response_model=List[schemas.MedicineOut])
def get_medicines(db: Session = Depends(get_session)):
    medicines = db.exec(select(models.Medicine)).all()
    return medicines

# 2. API Nhập thuốc mới
@router.post("/medicines", response_model=schemas.MedicineOut)
def create_medicine(med_data: schemas.MedicineCreate, db: Session = Depends(get_session)):
    new_med = models.Medicine.from_orm(med_data)
    db.add(new_med)
    db.commit()
    db.refresh(new_med)
    return new_med

# 3. API KÊ ĐƠN & TRỪ KHO (Logic quan trọng)
@router.post("/prescriptions")
def create_prescription(
    pres_data: schemas.PrescriptionCreate, 
    db: Session = Depends(get_session)
):
    # Tạo Đơn thuốc mới
    new_pres = models.Prescription(medical_record_id=pres_data.medical_record_id)
    db.add(new_pres)
    db.commit()
    db.refresh(new_pres)

    # Duyệt qua từng thuốc để trừ kho
    for item in pres_data.items:
        medicine = db.get(models.Medicine, item.medicine_id)
        
        if not medicine:
            raise HTTPException(status_code=404, detail=f"Thuốc ID {item.medicine_id} không tồn tại")
        
        if medicine.stock_quantity < item.quantity:
            raise HTTPException(status_code=400, detail=f"Thuốc '{medicine.name}' không đủ (Còn: {medicine.stock_quantity})")
        
        # Trừ kho
        medicine.stock_quantity -= item.quantity
        db.add(medicine) 

        # Lưu chi tiết
        pres_item = models.PrescriptionItem(
            prescription_id=new_pres.id,
            medicine_id=item.medicine_id,
            quantity=item.quantity
        )
        db.add(pres_item)

    db.commit()
    return {"message": "Kê đơn thành công", "prescription_id": new_pres.id}