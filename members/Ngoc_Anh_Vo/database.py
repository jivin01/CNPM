from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# --- THAY ĐỔI: Dùng SQLite thay vì PostgreSQL để chạy test cục bộ ---
# SQLALCHEMY_DATABASE_URL = "postgresql://postgres:12345@localhost/retina_db"
SQLALCHEMY_DATABASE_URL = "sqlite:///./sql_app.db"

# Tạo engine (động cơ) kết nối
# check_same_thread=False là bắt buộc chỉ dành riêng cho SQLite
engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)

# Tạo SessionLocal (nhà máy tạo phiên làm việc)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class (cái khuôn mẫu cho các bảng User, Patient sau này)
Base = declarative_base()

# ------------------------------------------------------------------
# HÀM DEPENDENCY (Để main.py gọi dùng mỗi khi cần kết nối DB)
# ------------------------------------------------------------------
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()