from pydantic import BaseModel, EmailStr
from typing import Optional
from models import UserRole

# Dữ liệu khi Đăng ký
class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    role: UserRole = UserRole.USER  # Mặc định là User

# Dữ liệu trả về cho Client (giấu password)
class UserResponse(BaseModel):
    id: int
    email: EmailStr
    full_name: str
    role: UserRole
    is_active: bool

    class Config:
        from_attributes = True # Thay thế orm_mode trong v2

class Token(BaseModel):
    access_token: str
    token_type: str