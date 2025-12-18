from typing import Optional
from sqlmodel import Field, SQLModel

# Đây là khuôn mẫu cho bảng User trong Database
class User(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True) # ID tự tăng
    full_name: str                                            # Họ tên
    email: str = Field(index=True, unique=True)               # Email (không trùng)
    hashed_password: str                                      # Mật khẩu (đã mã hóa)
    role: str = "patient"                                     # Vai trò: 'admin', 'doctor', 'patient'
    is_active: bool = True                                    # Trạng thái tài khoản (True: đang hoạt động, False: bị khóa)
