from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import create_db_and_tables # Import hàm tạo DB từ file database.py

# --- Phần 1: Cấu hình vòng đời ứng dụng (Lifespan) ---
# Hàm này sẽ chạy tự động 1 lần duy nhất khi bạn bấm chạy Server
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Tạo file database (aura.db) và các bảng nếu chưa có
    create_db_and_tables()
    print("LOG: Đã khởi tạo Database thành công!")
    yield

# --- Phần 2: Khởi tạo ứng dụng ---
# Gắn cái lifespan vào ứng dụng chính
app = FastAPI(lifespan=lifespan)

# --- Phần 3: Cấu hình CORS (Để Frontend gọi được) ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Phần 4: Các đường dẫn API (Router) ---
@app.get("/")
def read_root():
    return {"message": "AURA Backend: Kết nối Database OK!"}

@app.get("/api/test")
def test_api():
    return {"status": "success", "data": "Backend Python + SQLite đang chạy ngon lành!"}
from sqlmodel import Session, select
from models import User
from database import get_session
from schemas import UserRegister, UserOut
from fastapi import Depends, HTTPException

# --- API Đăng ký tài khoản ---
@app.post("/api/register", response_model=UserOut)
def register(user_input: UserRegister, session: Session = Depends(get_session)):
    # 1. Kiểm tra xem email đã tồn tại chưa
    statement = select(User).where(User.email == user_input.email)
    existing_user = session.exec(statement).first()
    
    if existing_user:
        raise HTTPException(status_code=400, detail="Email này đã được sử dụng!")

    # 2. Tạo user mới (Lưu ý: Thực tế phải mã hóa password, nhưng giờ mình lưu tạm text trần cho dễ hiểu)
    new_user = User(
        full_name=user_input.full_name,
        email=user_input.email,
        password_hash=user_input.password # Đồ án thật thì phải hash nhé, đây là làm demo
    )
    
    # 3. Lưu vào Database
    session.add(new_user)
    session.commit()
    session.refresh(new_user)
    
    return new_user