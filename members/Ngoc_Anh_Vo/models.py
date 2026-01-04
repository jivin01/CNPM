from sqlalchemy import Column, Integer, String, Boolean, Enum
from database import Base
import enum

class UserRole(str, enum.Enum):
    ADMIN = "admin"
    DOCTOR = "doctor"
    CLINIC = "clinic"
    USER = "user"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    is_active = Column(Boolean, default=True)
    
    # Cột phân quyền (RBAC)
    role = Column(Enum(UserRole), default=UserRole.USER)