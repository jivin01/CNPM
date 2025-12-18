from typing import Optional
from sqlmodel import Field, SQLModel

# Đây là khuôn mẫu cho bảng User trong Database
class User(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True) # ID tự tăng
    full_name: str                                            # Họ tên
    email: str = Field(index=True, unique=True)               # Email (không trùng)
    password_hash: str                                        # Mật khẩu (đã mã hóa)
    role: str = "patient"                                     # Vai trò: 'doctor' hoặc 'patient'