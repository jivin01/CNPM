from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlmodel import select
from ..database import get_session
from ..models.models import Message, User
from ..api import auth

router = APIRouter(prefix="/messages", tags=["messages"])

class MessageIn(BaseModel):
    receiver_id: int
    content: str

@router.post("/")
def send_message(payload: MessageIn, current_user: User = Depends(auth.get_current_user)):
    with get_session() as session:
        # ensure receiver exists
        receiver = session.exec(select(User).where(User.id == payload.receiver_id)).first()
        if not receiver:
            raise HTTPException(status_code=404, detail="Receiver not found")
        msg = Message(sender_id=current_user.id, receiver_id=payload.receiver_id, content=payload.content)
        session.add(msg)
        session.commit()
        session.refresh(msg)
        return {"id": msg.id, "content": msg.content, "created_at": msg.created_at.isoformat()}

@router.get("/with/{other_user_id}")
def get_conversation(other_user_id: int, current_user: User = Depends(auth.get_current_user)):
    with get_session() as session:
        q = select(Message).where(
            (Message.sender_id == current_user.id) & (Message.receiver_id == other_user_id)
            | (Message.sender_id == other_user_id) & (Message.receiver_id == current_user.id)
        ).order_by(Message.created_at)
        rows = session.exec(q).all()
        return [{"id": r.id, "sender_id": r.sender_id, "receiver_id": r.receiver_id, "content": r.content, "created_at": r.created_at.isoformat()} for r in rows]