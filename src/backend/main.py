from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import Session, select
from typing import List, Optional
from datetime import datetime, timedelta
from apscheduler.schedulers.background import BackgroundScheduler

# --- IMPORT DATABASE & MODELS ---
from database import create_db_and_tables, get_session, engine 
from models import User, Patient, Appointment, MedicalRecord, Medicine, Prescription, PrescriptionItem, AIDiagnosis
from schemas import UserCreate, UserOut, UserUpdate

# --- IMPORT MODULE ROUTERS ---
from routers import pharmacy      # Router thuốc (vẫn nằm trong folder routers)
import billing                    # <--- [ĐÃ SỬA] Import trực tiếp file billing.py cùng cấp
from patients import router as patients_router
import appointments 
import medical_exam 
import ai_router

# --- IMPORT AUTH TOOLS ---
from auth_utils import (
    get_password_hash, 
    get_current_user, 
    require_admin,
    router as auth_router 
)

# --- TỰ ĐỘNG XÓA LỊCH CŨ ---
def auto_delete_old_appointments():
    print("LOG: Đang quét và xóa lịch khám cũ...")
    with Session(engine) as session:
        try:
            cutoff_date = datetime.now() - timedelta(days=7)
            statement = select(Appointment).where(
                Appointment.status == "completed",
                Appointment.appointment_time < cutoff_date
            )
            results = session.exec(statement).all()
            count = 0
            for appt in results:
                session.delete(appt)
                count += 1
            session.commit()
            print(f"LOG: Đã tự động xóa {count} lịch hẹn cũ.")
        except Exception as e:
            print(f"ERROR: Lỗi khi chạy tác vụ tự động xóa: {e}")

# --- LIFESPAN ---
@asynccontextmanager
async def lifespan(app: FastAPI):
    create_db_and_tables() 
    print("LOG: Đã khởi tạo Database thành công!")

    scheduler = BackgroundScheduler()
    scheduler.add_job(auto_delete_old_appointments, 'cron', hour=0, minute=0)
    scheduler.start()
    
    yield
    scheduler.shutdown()

# --- KHỞI TẠO APP ---
app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==========================================
# ĐĂNG KÝ ROUTER
# ==========================================
app.include_router(auth_router) 
app.include_router(pharmacy.router)
app.include_router(billing.router)      # Đăng ký router tính tiền
app.include_router(patients_router)
app.include_router(appointments.router)
app.include_router(medical_exam.router)
app.include_router(ai_router.router)
# ==========================================

@app.get("/")
def read_root():
    return {"message": "AURA Backend: Hệ thống đang chạy ổn định!"}

# --- USER MANAGEMENT APIs ---

@app.get("/api/profile", response_model=UserOut)
def get_profile(current_user: User = Depends(get_current_user)):
    return current_user

@app.get("/api/users", response_model=List[UserOut])
def list_users(role: Optional[str] = None, session: Session = Depends(get_session)):
    statement = select(User)
    if role:
        statement = statement.where(User.role == role)
    return session.exec(statement).all()

@app.post("/api/users", response_model=UserOut)
def create_user_by_admin(user_input: UserCreate, session: Session = Depends(get_session), admin: User = Depends(require_admin)):
    statement = select(User).where(User.email == user_input.email)
    if session.exec(statement).first():
        raise HTTPException(status_code=400, detail="Email này đã được sử dụng!")
    new_user = User(
        full_name=user_input.full_name,
        email=user_input.email,
        hashed_password=get_password_hash(user_input.password),
        role=user_input.role or "doctor",
        is_active=True
    )
    session.add(new_user)
    session.commit()
    session.refresh(new_user)
    return new_user

@app.patch("/api/users/{user_id}", response_model=UserOut)
def update_user_status(user_id: int, update_data: UserUpdate, session: Session = Depends(get_session), admin: User = Depends(require_admin)):
    user = session.get(User, user_id)
    if not user: raise HTTPException(status_code=404, detail="Không tìm thấy người dùng")
    if update_data.is_active is not None: user.is_active = update_data.is_active
    if update_data.role is not None: user.role = update_data.role
    session.add(user)
    session.commit()
    session.refresh(user)
    return user