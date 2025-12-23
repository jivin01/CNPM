from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlmodel import Session, select
from passlib.context import CryptContext
from jose import jwt, JWTError
from datetime import datetime, timedelta
from typing import Optional

# Import file kết nối database và models
from database import get_session
from models import User
from schemas import UserCreate, UserLogin, Token, UserOut

# === CẤU HÌNH BẢO MẬT ===
SECRET_KEY = "day-la-khoa-bi-mat-cua-ban-dung-de-lo-nhe"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# Công cụ mã hóa mật khẩu
# Use pbkdf2_sha256 to avoid bcrypt backend issues in some environments
pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")

# Cấu hình để FastAPI biết lấy token ở đâu (URL đăng nhập)
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/login")

# Tạo Router
router = APIRouter(prefix="/api", tags=["Authentication"])

# === CÁC HÀM HỖ TRỢ CƠ BẢN ===

def verify_password(plain_password, hashed_password):
    """Kiểm tra mật khẩu"""
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    """Mã hóa mật khẩu"""
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """Tạo JWT Token"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

# === CÁC HÀM XÁC THỰC NGƯỜI DÙNG (Cái con đang thiếu) ===

async def get_current_user(token: str = Depends(oauth2_scheme), session: Session = Depends(get_session)):
    """
    Hàm này sẽ tự động chạy mỗi khi User gọi vào API cần bảo mật.
    Nó lấy Token từ Header -> Giải mã -> Tìm User trong Database.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Không thể xác thực thông tin đăng nhập (Token lỗi hoặc hết hạn)",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    # Tìm user trong DB
    statement = select(User).where(User.email == email)
    user = session.exec(statement).first()
    
    if user is None:
        raise credentials_exception
    return user

def require_admin(current_user: User = Depends(get_current_user)):
    """Hàm chặn cửa: Chỉ cho phép Admin đi qua"""
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Bạn không có quyền Admin!")
    return current_user

# === CÁC API ĐĂNG KÝ & ĐĂNG NHẬP ===

@router.post("/register", response_model=UserOut)
def register(user_in: UserCreate, session: Session = Depends(get_session)):
    # 1. Kiểm tra email
    statement = select(User).where(User.email == user_in.email)
    existing_user = session.exec(statement).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email này đã được đăng ký!")
    
    # 2. Tạo user mới
    hashed_pw = get_password_hash(user_in.password)
    new_user = User(
        full_name=user_in.full_name,
        email=user_in.email,
        hashed_password=hashed_pw,
        role=user_in.role
    )
    session.add(new_user)
    session.commit()
    session.refresh(new_user)
    return new_user


@router.post("/register/user", response_model=UserOut)
def register_user(user_in: UserCreate, session: Session = Depends(get_session)):
    # Force role to patient
    user_in.role = "patient"
    return register(user_in, session)


@router.post("/register/doctor", response_model=UserOut)
def register_doctor(user_in: UserCreate, session: Session = Depends(get_session)):
    # Force role to doctor
    user_in.role = "doctor"
    return register(user_in, session)

@router.post("/login", response_model=Token)
def login(user_in: UserLogin, session: Session = Depends(get_session)):
    # 1. Tìm user
    statement = select(User).where(User.email == user_in.email)
    user = session.exec(statement).first()
    
    # 2. Check pass
    if not user or not verify_password(user_in.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email hoặc mật khẩu không đúng",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # 3. Tạo token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email, "role": user.role, "id": user.id},
        expires_delta=access_token_expires
    )

    
    return {
        "access_token": access_token, 
        "refresh_token": "not-implemented", 
        "token_type": "bearer"
    }


@router.post("/login/user", response_model=Token)
def login_user(user_in: UserLogin, session: Session = Depends(get_session)):
    token = login(user_in, session)
    # verify role
    payload = jwt.decode(token["access_token"], SECRET_KEY, algorithms=[ALGORITHM])
    if payload.get("role") != "patient":
        raise HTTPException(status_code=403, detail="Tài khoản không phải bệnh nhân")
    return token


@router.post("/login/doctor", response_model=Token)
def login_doctor(user_in: UserLogin, session: Session = Depends(get_session)):
    token = login(user_in, session)
    payload = jwt.decode(token["access_token"], SECRET_KEY, algorithms=[ALGORITHM])
    if payload.get("role") != "doctor":
        raise HTTPException(status_code=403, detail="Tài khoản không phải bác sĩ")
    return token

@router.get("/profile", response_model=UserOut)
def read_users_me(current_user: User = Depends(get_current_user)):
    return current_user