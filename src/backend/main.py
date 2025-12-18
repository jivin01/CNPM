from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer
from sqlmodel import Session, select
from typing import List

from database import create_db_and_tables, get_session
from models import User
from schemas import UserCreate, UserOut, UserLogin, Token, UserUpdate
from auth_utils import (
    get_password_hash, 
    verify_password, 
    create_access_token, 
    create_refresh_token,
    SECRET_KEY,
    ALGORITHM
)
from jose import JWTError, jwt

# --- Cấu hình OAuth2 ---
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/login")

# --- Phần 1: Lifespan ---
@asynccontextmanager
async def lifespan(app: FastAPI):
    create_db_and_tables()
    print("LOG: Đã khởi tạo Database thành công!")
    yield

# --- Phần 2: Khởi tạo ứng dụng ---
app = FastAPI(lifespan=lifespan)

# --- Phần 3: CORS ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Dependencies (Middleware) ---
def get_current_user(token: str = Depends(oauth2_scheme), session: Session = Depends(get_session)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    user = session.exec(select(User).where(User.email == email)).first()
    if user is None:
        raise credentials_exception
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Tài khoản đã bị khóa")
    return user

def require_admin(current_user: User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Bạn không có quyền thực hiện hành động này")
    return current_user

# --- Phần 4: API Endpoints ---

@app.get("/")
def read_root():
    return {"message": "AURA Backend: Kết nối Database OK!"}

# --- AUTH APIs ---

@app.post("/api/register", response_model=UserOut)
def register(user_input: UserCreate, session: Session = Depends(get_session)):
    statement = select(User).where(User.email == user_input.email)
    existing_user = session.exec(statement).first()
    
    if existing_user:
        raise HTTPException(status_code=400, detail="Email này đã được sử dụng!")

    new_user = User(
        full_name=user_input.full_name,
        email=user_input.email,
        hashed_password=get_password_hash(user_input.password),
        role=user_input.role or "patient",
        is_active=True
    )
    
    session.add(new_user)
    session.commit()
    session.refresh(new_user)
    return new_user

@app.post("/api/login", response_model=Token)
def login(user_input: UserLogin, session: Session = Depends(get_session)):
    user = session.exec(select(User).where(User.email == user_input.email)).first()
    if not user or not verify_password(user_input.password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Email hoặc mật khẩu không chính xác")
    
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Tài khoản của bạn đã bị khóa")

    access_token = create_access_token(data={"sub": user.email, "role": user.role})
    refresh_token = create_refresh_token(data={"sub": user.email})
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer"
    }

@app.post("/api/refresh", response_model=Token)
def refresh_token(refresh_token: str, session: Session = Depends(get_session)):
    try:
        payload = jwt.decode(refresh_token, SECRET_KEY, algorithms=[ALGORITHM])
        if payload.get("type") != "refresh":
            raise HTTPException(status_code=401, detail="Invalid refresh token")
        email: str = payload.get("sub")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid refresh token")
    
    user = session.exec(select(User).where(User.email == email)).first()
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="User not found or inactive")
        
    new_access_token = create_access_token(data={"sub": user.email, "role": user.role})
    return {
        "access_token": new_access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer"
    }

# --- USER MANAGEMENT APIs (Staff/Doctor management) ---

@app.get("/api/profile", response_model=UserOut)
def get_profile(current_user: User = Depends(get_current_user)):
    return current_user

@app.get("/api/users", response_model=List[UserOut])
def list_users(
    session: Session = Depends(get_session), 
    admin: User = Depends(require_admin)
):
    return session.exec(select(User)).all()

@app.post("/api/users", response_model=UserOut)
def create_user_by_admin(
    user_input: UserCreate, 
    session: Session = Depends(get_session),
    admin: User = Depends(require_admin)
):
    statement = select(User).where(User.email == user_input.email)
    existing_user = session.exec(statement).first()
    
    if existing_user:
        raise HTTPException(status_code=400, detail="Email này đã được sử dụng!")

    new_user = User(
        full_name=user_input.full_name,
        email=user_input.email,
        hashed_password=get_password_hash(user_input.password),
        role=user_input.role or "doctor", # Mặc định là bác sĩ khi admin tạo
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
