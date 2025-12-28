from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from typing import Optional, Callable, Any
from sqlmodel import Session, select
from passlib.context import CryptContext
from datetime import timedelta, datetime
from jose import JWTError, jwt
from ..models.models import User
from ..database import get_session
from ..config import settings

router = APIRouter(prefix="/auth", tags=["auth"])
# Use pbkdf2_sha256 for portability in test/dev environments to avoid bcrypt backend issues on some systems
pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")

class UserCreate(BaseModel):
    email: str
    password: str
    role: Optional[str] = "patient"
    registration_secret: Optional[str] = None

class Token(BaseModel):
    access_token: str
    token_type: str


def verify_password(plain, hashed):
    return pwd_context.verify(plain, hashed)


def get_password_hash(password):
    return pwd_context.hash(password)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.access_token_expire_minutes)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.secret_key, algorithm=settings.algorithm)
    return encoded_jwt


@router.post("/register")
def register(u: UserCreate):
    # allow elevated role only if registration secret matches env var
    reg_secret_env = __import__("os").getenv("REGISTRATION_SECRET")
    if u.role and u.role != "patient":
        if not u.registration_secret or u.registration_secret != reg_secret_env:
            raise HTTPException(status_code=403, detail="Invalid registration secret for role assignment")
    with get_session() as session:
        user = session.exec(select(User).where(User.email == u.email)).first()
        if user:
            raise HTTPException(status_code=400, detail="Email already registered")
        db_user = User(email=u.email, hashed_password=get_password_hash(u.password), role=u.role or "patient")
        session.add(db_user)
        session.commit()
        session.refresh(db_user)
        return {"id": db_user.id, "email": db_user.email, "role": db_user.role}


from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

@router.post("/login", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends()):
    """Login using OAuth2 form (username=email) to be compatible with OAuth2 tools."""
    email = form_data.username
    password = form_data.password
    with get_session() as session:
        user = session.exec(select(User).where(User.email == email)).first()
        if not user or not verify_password(password, user.hashed_password):
            raise HTTPException(status_code=401, detail="Invalid credentials")
        access_token_expires = timedelta(minutes=settings.access_token_expire_minutes)
        access_token = create_access_token(data={"sub": str(user.id)}, expires_delta=access_token_expires)
        # return role and id to help frontend adjust behavior
        return {"access_token": access_token, "token_type": "bearer", "role": user.role, "id": user.id}


# Dependency to get current user from Bearer token

def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=401,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    with get_session() as session:
        user = session.exec(select(User).where(User.id == int(user_id))).first()
        if user is None:
            raise credentials_exception
        return user


@router.get("/me")
def me(current_user: User = Depends(get_current_user)):
    return {"id": current_user.id, "email": current_user.email, "role": current_user.role}


# Dependency to get current user from Bearer token

def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=401,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    with get_session() as session:
        user = session.exec(select(User).where(User.id == int(user_id))).first()
        if user is None:
            raise credentials_exception
        return user


# RBAC helper - use like: current_user: User = require_roles("admin")
from typing import Callable, Any

def require_roles(*allowed_roles: str):
    def dependency(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in allowed_roles:
            raise HTTPException(status_code=403, detail="Not enough permissions")
        return current_user
    return Depends(dependency)
