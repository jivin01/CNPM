# File: main.py
from fastapi import FastAPI, Depends, HTTPException, status, File, UploadFile
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from typing import List
import models, schemas, auth
from database import engine, get_db
from fastapi.middleware.cors import CORSMiddleware
import random 
import time   
from datetime import datetime

# Tạo bảng trong DB
models.Base.metadata.create_all(bind=engine)

app = FastAPI()

# Cấu hình CORS
origins = [
    "http://localhost:5173",
    "http://localhost:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "AURA AI Backend is running!"}

# ---------------------------------------------------------
# AUTHENTICATION
# ---------------------------------------------------------
@app.post("/auth/register", response_model=schemas.UserResponse)
def register(user: schemas.UserCreate, db: Session = Depends(get_db)):
    print(f"📥 Đang nhận yêu cầu đăng ký: Email={user.email}")
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_password = auth.get_password_hash(user.password)
    new_user = models.User(
        email=user.email,
        hashed_password=hashed_password,
        full_name=user.full_name,
        role=user.role 
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@app.post("/token", response_model=schemas.Token)
def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    print(f"🔑 Đang đăng nhập: {form_data.username}")
    user = db.query(models.User).filter(models.User.email == form_data.username).first()
    if not user or not auth.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token = auth.create_access_token(data={"sub": user.email, "role": user.role.value})
    return {"access_token": access_token, "token_type": "bearer"}

# ---------------------------------------------------------
# QUẢN LÝ BỆNH NHÂN & HỒ SƠ (CHO BÁC SĨ)
# ---------------------------------------------------------

@app.post("/patients/", response_model=schemas.PatientResponse)
def create_patient(patient: schemas.PatientCreate, db: Session = Depends(get_db), current_user: models.User = Depends(auth.require_role([models.UserRole.DOCTOR, models.UserRole.ADMIN]))):
    db_patient = models.Patient(**patient.model_dump())
    db.add(db_patient)
    db.commit()
    db.refresh(db_patient)
    return db_patient

@app.get("/patients/", response_model=List[schemas.PatientResponse])
def read_patients(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), current_user: models.User = Depends(auth.require_role([models.UserRole.DOCTOR, models.UserRole.ADMIN]))):
    patients = db.query(models.Patient).offset(skip).limit(limit).all()
    return patients

@app.post("/medical-records/", response_model=schemas.MedicalRecordResponse)
def create_medical_record(record: schemas.MedicalRecordCreate, db: Session = Depends(get_db), current_user: models.User = Depends(auth.require_role([models.UserRole.DOCTOR]))):
    patient = db.query(models.Patient).filter(models.Patient.id == record.patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    db_record = models.MedicalRecord(**record.model_dump())
    db.add(db_record)
    db.commit()
    db.refresh(db_record)
    return db_record

@app.get("/patients/{patient_id}/records", response_model=List[schemas.MedicalRecordResponse])
def read_patient_records(patient_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    records = db.query(models.MedicalRecord).filter(models.MedicalRecord.patient_id == patient_id).all()
    return records

# ---------------------------------------------------------
# API LẤY LỊCH SỬ KHÁM CỦA CHÍNH MÌNH (CHO PATIENT DASHBOARD)
# ---------------------------------------------------------
@app.get("/my-records", response_model=List[schemas.MedicalRecordResponse])
def read_own_records(db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    patient = db.query(models.Patient).filter(models.Patient.email == current_user.email).first()
    if not patient:
        return []
    records = db.query(models.MedicalRecord).filter(models.MedicalRecord.patient_id == patient.id).all()
    return records

# ---------------------------------------------------------
# API PHÂN TÍCH ẢNH (AI PREDICT)
# ---------------------------------------------------------
@app.post("/predict")
async def predict_image(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user) 
):
    print(f"📸 User {current_user.email} đang gửi ảnh: {file.filename}")
    time.sleep(1.0) # Giả lập delay
    
    # Logic chẩn đoán giả lập
    possible_diseases = ["Bình thường", "Viêm phổi", "Lao phổi", "Tim to", "Tràn dịch màng phổi"]
    prediction = random.choice(possible_diseases)
    confidence = round(random.uniform(0.75, 0.99), 2)
    
    # Lời khuyên mặc định từ AI (Chỉ tham khảo)
    advice = "Chờ bác sĩ kết luận chi tiết." 

    # --- TỰ ĐỘNG LƯU VÀO DATABASE ---
    patient = db.query(models.Patient).filter(models.Patient.email == current_user.email).first()
    
    if not patient:
        new_patient = models.Patient(
            full_name=current_user.full_name,
            date_of_birth="2000-01-01",
            gender="Unknown",
            phone="N/A",
            address="N/A",
            email=current_user.email
        )
        db.add(new_patient)
        db.commit()
        db.refresh(new_patient)
        patient = new_patient

    new_record = models.MedicalRecord(
        diagnosis=f"{prediction} (Độ tin cậy: {int(confidence*100)}%)",
        treatment=advice, 
        notes=f"Ảnh X-quang: {file.filename}",
        visit_date=datetime.now().strftime("%Y-%m-%d"),
        patient_id=patient.id,
        image_url=f"uploads/{file.filename}" # Giả lập đường dẫn ảnh
    )
    db.add(new_record)
    db.commit()
    print("✅ Đã lưu kết quả vào Lịch sử khám thành công!")

    return {
        "filename": file.filename,
        "prediction": prediction,
        "confidence": confidence,
        "advice": advice
    }

# ---------------------------------------------------------
# [MỚI] API CHO BÁC SĨ CẬP NHẬT LỜI KHUYÊN (UPDATE TREATMENT)
# ---------------------------------------------------------
@app.put("/medical-records/{record_id}")
def update_medical_record(
    record_id: int, 
    record_update: schemas.MedicalRecordUpdate, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_role([models.UserRole.DOCTOR, models.UserRole.ADMIN]))
):
    # 1. Tìm bệnh án theo ID
    db_record = db.query(models.MedicalRecord).filter(models.MedicalRecord.id == record_id).first()
    if not db_record:
        raise HTTPException(status_code=404, detail="Medical record not found")
    
    # 2. Cập nhật lời khuyên mới
    db_record.treatment = record_update.treatment
    db.commit()
    db.refresh(db_record)
    
    return db_record