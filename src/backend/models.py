from sqlmodel import SQLModel, Field
from typing import Optional

# Bảng Tài khoản (User)
class User(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    email: str = Field(unique=True, index=True)
    full_name: str
    hashed_password: str
    role: str = "patient"  # admin, doctor, patient
    is_active: bool = True

# Bảng Hồ sơ bệnh nhân (Patient) - Mới thêm vào
class Patient(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    full_name: str
    gender: str
    birth_year: int
    phone: str
    address: Optional[str] = None
    medical_history: Optional[str] = None