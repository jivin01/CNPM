from fastapi import FastAPI, UploadFile, File, Depends, HTTPException, WebSocket
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from .database import init_db, get_session
from .models.models import AnalysisRecord, User, Message
from .api import auth, messages, admin, erd
# Ensure top-level project packages like `ai/` are importable during tests and runtime
import sys
from pathlib import Path
BASE_DIR = Path(__file__).resolve().parent.parent
PROJECT_ROOT = BASE_DIR.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))
from ai.engine import analyze_image
from .services.storage import storage
import shutil
import uuid
import os
from typing import Dict, List, Optional

app = FastAPI(title="AURA - SP26SE025")

app.include_router(auth.router)
app.include_router(erd.router)
from .api import messages, admin
from .api.auth import require_roles
app.include_router(messages.router)
app.include_router(admin.router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE_DIR = Path(__file__).resolve().parent.parent
MEDIA_DIR = BASE_DIR / "static" / "images"
MEDIA_DIR.mkdir(parents=True, exist_ok=True)

# Connection manager for WebSocket clients
class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[int, List[WebSocket]] = {}

    async def connect(self, user_id: int, websocket: WebSocket):
        await websocket.accept()
        conns = self.active_connections.get(user_id, [])
        conns.append(websocket)
        self.active_connections[user_id] = conns

    def disconnect(self, user_id: int, websocket: WebSocket):
        conns = self.active_connections.get(user_id, [])
        if websocket in conns:
            conns.remove(websocket)
        if conns:
            self.active_connections[user_id] = conns
        else:
            self.active_connections.pop(user_id, None)

    async def send_personal_message(self, user_id: int, message: str):
        conns = self.active_connections.get(user_id, [])
        for ws in conns:
            try:
                await ws.send_text(message)
            except Exception:
                pass

    async def broadcast(self, message: str):
        for conns in self.active_connections.values():
            for ws in conns:
                try:
                    await ws.send_text(message)
                except Exception:
                    pass

manager = ConnectionManager()

from .api.auth import get_password_hash

@app.on_event("startup")
def on_startup():
    init_db()
    # Seed test users for local development when SEED_TEST_USERS=1 (default)
    if os.getenv("SEED_TEST_USERS", "1") == "1":
        with get_session() as session:
            from sqlmodel import select
            def ensure_user(email, role, pwd):
                u = session.exec(select(User).where(User.email == email)).first()
                if not u:
                    u = User(email=email, hashed_password=get_password_hash(pwd), role=role)
                    session.add(u)
            ensure_user("patient@example.com", "patient", "pass")
            ensure_user("doc@example.com", "doctor", "pass")
            ensure_user("admin@example.com", "admin", "adminpass")
            session.commit()

@app.post("/upload")
async def upload_image(file: UploadFile = File(...), current_user: User = Depends(auth.get_current_user)):
    # save file
    filename = f"{uuid.uuid4().hex}_{file.filename}"
    dest = MEDIA_DIR / filename
    with dest.open("wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # call AI engine
    annotated_name = f"annotated_{filename}"
    annotated_path = MEDIA_DIR / annotated_name
    try:
        risk, annotated = analyze_image(str(dest), str(annotated_path))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    # upload / map to URL
    original_url = storage.upload_if_configured(str(dest))
    annotated_url = storage.upload_if_configured(str(annotated_path))

    # write to DB using get_session
    with get_session() as session:
        rec = AnalysisRecord(user_id=current_user.id if current_user else 0, original_image=original_url, annotated_image=annotated_url, risk_score=risk)
        session.add(rec)
        session.commit()
        session.refresh(rec)

    # notify user via websocket if connected
    await manager.send_personal_message(current_user.id, f"Analysis complete: record_id={rec.id}, risk={rec.risk_score:.2f}")

    return {"id": rec.id, "risk_score": rec.risk_score, "annotated_image": annotated_url, "original_image": original_url, "status": rec.status, "created_at": rec.created_at.isoformat()}

# Patient endpoints
@app.get("/patient/records")
def get_patient_records(current_user: User = Depends(auth.get_current_user)):
    """Get all analysis records for the current patient"""
    with get_session() as session:
        from sqlmodel import select
        rows = session.exec(select(AnalysisRecord).where(AnalysisRecord.user_id == current_user.id).order_by(AnalysisRecord.created_at.desc())).all()
        return [{"id": r.id, "risk_score": r.risk_score, "original_image": r.original_image, "annotated_image": r.annotated_image, "status": r.status, "doctor_notes": r.doctor_notes, "created_at": r.created_at.isoformat()} for r in rows]

@app.get("/patient/records/{record_id}")
def get_patient_record(record_id: int, current_user: User = Depends(auth.get_current_user)):
    """Get a specific analysis record for the current patient"""
    with get_session() as session:
        rec = session.get(AnalysisRecord, record_id)
        if not rec:
            raise HTTPException(status_code=404, detail="Record not found")
        if rec.user_id != current_user.id:
            raise HTTPException(status_code=403, detail="Access denied")
        return {"id": rec.id, "risk_score": rec.risk_score, "original_image": rec.original_image, "annotated_image": rec.annotated_image, "status": rec.status, "doctor_notes": rec.doctor_notes, "created_at": rec.created_at.isoformat()}


# Doctor endpoints
from pydantic import BaseModel

class ValidationIn(BaseModel):
    validated: bool
    notes: Optional[str] = None

@app.get("/doctor/records/pending")
def list_pending_records(current_user: User = require_roles("doctor")):
    with get_session() as session:
        rows = session.exec(__import__("sqlmodel").select(AnalysisRecord).where(AnalysisRecord.status == "pending")).all()
        return [{"id": r.id, "user_id": r.user_id, "risk_score": r.risk_score, "annotated_image": r.annotated_image, "created_at": r.created_at.isoformat()} for r in rows]

@app.get("/doctor/records/{record_id}")
def get_record(record_id: int, current_user: User = require_roles("doctor")):
    with get_session() as session:
        rec = session.get(AnalysisRecord, record_id)
        if not rec:
            raise HTTPException(status_code=404, detail="Record not found")
        return {"id": rec.id, "user_id": rec.user_id, "risk_score": rec.risk_score, "original_image": rec.original_image, "annotated_image": rec.annotated_image, "status": rec.status, "doctor_notes": rec.doctor_notes, "validated_by": rec.validated_by}

@app.post("/doctor/records/{record_id}/validate")
async def validate_record(record_id: int, payload: ValidationIn, current_user: User = require_roles("doctor")):
    with get_session() as session:
        rec = session.get(AnalysisRecord, record_id)
        if not rec:
            raise HTTPException(status_code=404, detail="Record not found")
        rec.status = "validated" if payload.validated else "rejected"
        rec.doctor_notes = payload.notes
        rec.validated_by = current_user.id
        session.add(rec)
        session.commit()
        session.refresh(rec)

    # notify patient if connected
    await manager.send_personal_message(rec.user_id, f"Your analysis #{rec.id} was reviewed: {rec.status}")
    return {"id": rec.id, "status": rec.status, "doctor_notes": rec.doctor_notes}

@app.get("/images/{image_name}")
def get_image(image_name: str):
    p = MEDIA_DIR / image_name
    if not p.exists():
        raise HTTPException(status_code=404, detail="Not found")
    return FileResponse(p)

@app.websocket("/ws/{client_id}")
async def websocket_endpoint(websocket: WebSocket, client_id: str):
    # client_id should be user id
    try:
        user_id = int(client_id)
    except Exception:
        await websocket.close()
        return
    await manager.connect(user_id, websocket)
    try:
        while True:
            data = await websocket.receive_text()
            # echo back for now
            await manager.send_personal_message(user_id, f"Server received: {data}")
    except Exception:
        manager.disconnect(user_id, websocket)
        await websocket.close()