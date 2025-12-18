from pydantic import BaseModel, EmailStr
from typing import Optional

# Khuôn mẫu Token
class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

# Khi Đăng ký thì cần gửi những gì?
class UserCreate(BaseModel):
    full_name: str
    email: EmailStr
    password: str
    role: Optional[str] = "patient"

# Khi Đăng nhập
class UserLogin(BaseModel):
    email: EmailStr
    password: str

# Khi trả về thông tin (Giấu mật khẩu đi)
class UserOut(BaseModel):
    id: int
    full_name: str
    email: EmailStr
    role: str
    is_active: bool

# Dùng để cập nhật trạng thái user (ví dụ khóa tài khoản)
class UserUpdate(BaseModel):
    is_active: Optional[bool] = None
    role: Optional[str] = None
