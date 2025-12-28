from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import select
from ..database import get_session
from ..models.models import User
from ..api import auth

router = APIRouter(prefix="/admin", tags=["admin"])

@router.get("/users")
def list_users(current_user: User = auth.require_roles("admin")):
    with get_session() as session:
        users = session.exec(select(User)).all()
        return [{"id": u.id, "email": u.email, "role": u.role} for u in users]

@router.post("/users/{user_id}/role")
def update_role(user_id: int, role: str, current_user: User = auth.require_roles("admin")):
    with get_session() as session:
        user = session.get(User, user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        user.role = role
        session.add(user)
        session.commit()
        session.refresh(user)
        return {"id": user.id, "role": user.role}
