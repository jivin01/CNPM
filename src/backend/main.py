from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import Session, select
from typing import List

# Import Database & Models
from database import create_db_and_tables, get_session
# Quan trọng: Import Models để SQLModel tạo bảng
from models import User, Patient 

from schemas import UserCreate, UserOut, UserUpdate

# Import Auth Tools
from auth_utils import (
    get_password_hash, 
    get_current_user, 
    require_admin,
    router as auth_router # <--- Import Router chứa Login/Register xịn
)

# Import Module
from patients import router as patients_router

# --- Phần 1: Lifespan (Tự động tạo bảng) ---
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Tạo bảng nếu chưa có
    create_db_and_tables() 
    print("LOG: Đã khởi tạo Database thành công (aura_new.db)!")
    yield

# --- Phần 2: Khởi tạo ứng dụng ---
app = FastAPI(lifespan=lifespan)

# --- Phần 3: CORS (Cho phép Frontend kết nối) ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# === ĐĂNG KÝ ROUTER ===
# Đưa tính năng Login/Register vào
app.include_router(auth_router) 
# Đưa tính năng Bệnh nhân vào
app.include_router(patients_router)


# --- Phần 4: API Endpoints (Hệ thống) ---

@app.get("/")
def read_root():
    return {"message": "AURA Backend: Kết nối Database OK!"}

# --- USER MANAGEMENT APIs (Dành cho Admin quản lý) ---
# Lưu ý: Các API Login/Register đã nằm trong auth_router nên không viết lại ở đây nữa

@app.get("/api/profile", response_model=UserOut)
def get_profile(current_user: User = Depends(get_current_user)):
    return current_user

@app.get("/api/users", response_model=List[UserOut])
def list_users(
    session: Session = Depends(get_session), 
    admin: User = Depends(require_admin)
):
    """API cho Admin xem danh sách tất cả user"""
    return session.exec(select(User)).all()

@app.post("/api/users", response_model=UserOut)
def create_user_by_admin(
    user_input: UserCreate, 
    session: Session = Depends(get_session),
    admin: User = Depends(require_admin)
):
    """API cho Admin tạo nhanh bác sĩ/nhân viên"""
    statement = select(User).where(User.email == user_input.email)
    existing_user = session.exec(statement).first()
    
    if existing_user:
        raise HTTPException(status_code=400, detail="Email này đã được sử dụng!")

    new_user = User(
        full_name=user_input.full_name,
        email=user_input.email,
        hashed_password=get_password_hash(user_input.password),
        role=user_input.role or "doctor", # Mặc định admin tạo là tạo doctor
        is_active=True
    )
    
    session.add(new_user)
    session.commit()
    session.refresh(new_user)
    return new_user

@app.patch("/api/users/{user_id}", response_model=UserOut)
def update_user_status(
    user_id: int, 
    update_data: UserUpdate, 
    session: Session = Depends(get_session),
    admin: User = Depends(require_admin)
):
    """API cho Admin khóa/mở khóa tài khoản"""
    user = session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Không tìm thấy người dùng")
    
    if update_data.is_active is not None:
        user.is_active = update_data.is_active
    if update_data.role is not None:
        user.role = update_data.role
        
    session.add(user)
    session.commit()
    session.refresh(user)
    return user