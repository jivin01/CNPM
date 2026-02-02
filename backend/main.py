from fastapi import FastAPI, Depends, HTTPException, status, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy import create_engine, Column, String, DateTime, Float, ForeignKey, Boolean
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session, relationship
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from pydantic import BaseModel, EmailStr
import uuid
import os
import shutil
import random 
from dotenv import load_dotenv

load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# --- MODELS ---
class AppUser(Base):
    __tablename__ = "AppUsers"
    Id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    Email = Column(String, unique=True, index=True, nullable=False)
    Password = Column(String, nullable=False); FullName = Column(String); Role = Column(String, default="Patient")
    CreatedAt = Column(DateTime(timezone=True), server_default=func.now())
    Images = relationship("MedicalImage", back_populates="Patient", cascade="all, delete-orphan")
    Notifications = relationship("Notification", back_populates="User", cascade="all, delete-orphan")

class MedicalImage(Base):
    __tablename__ = "MedicalImages"
    Id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    PatientId = Column(UUID(as_uuid=True), ForeignKey("AppUsers.Id"))
    ImageUrl = Column(String, nullable=False); Status = Column(String, default="Pending") 
    CreatedAt = Column(DateTime(timezone=True), server_default=func.now())
    
    Patient = relationship("AppUser", back_populates="Images")
    Analysis = relationship("AnalysisResult", back_populates="Image", uselist=False, cascade="all, delete-orphan")
    DoctorNote = relationship("DoctorDiagnosis", back_populates="Image", uselist=False, cascade="all, delete-orphan")
    Comments = relationship("Comment", back_populates="Image", cascade="all, delete-orphan")

class AnalysisResult(Base):
    __tablename__ = "AnalysisResults"
    Id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    ImageId = Column(UUID(as_uuid=True), ForeignKey("MedicalImages.Id"))
    RiskScore = Column(Float); Diagnosis = Column(String); Confidence = Column(Float)
    CreatedAt = Column(DateTime(timezone=True), server_default=func.now())
    Image = relationship("MedicalImage", back_populates="Analysis")

class DoctorDiagnosis(Base):
    __tablename__ = "DoctorDiagnoses"
    Id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    ImageId = Column(UUID(as_uuid=True), ForeignKey("MedicalImages.Id"))
    DoctorId = Column(UUID(as_uuid=True), ForeignKey("AppUsers.Id")); Conclusion = Column(String)
    CreatedAt = Column(DateTime(timezone=True), server_default=func.now())
    Image = relationship("MedicalImage", back_populates="DoctorNote")

class Comment(Base):
    __tablename__ = "Comments"
    Id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    ImageId = Column(UUID(as_uuid=True), ForeignKey("MedicalImages.Id"))
    UserId = Column(UUID(as_uuid=True), ForeignKey("AppUsers.Id"))
    Content = Column(String, nullable=False)
    CreatedAt = Column(DateTime(timezone=True), server_default=func.now())
    Image = relationship("MedicalImage", back_populates="Comments")
    User = relationship("AppUser")

class Notification(Base):
    __tablename__ = "Notifications"
    Id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    UserId = Column(UUID(as_uuid=True), ForeignKey("AppUsers.Id")) 
    Message = Column(String, nullable=False)
    IsRead = Column(Boolean, default=False)
    CreatedAt = Column(DateTime(timezone=True), server_default=func.now())
    User = relationship("AppUser", back_populates="Notifications")

Base.metadata.create_all(bind=engine)

app = FastAPI(title="AURA System")
if not os.path.exists("static/uploads"): os.makedirs("static/uploads")
app.mount("/static", StaticFiles(directory="static"), name="static")
app.add_middleware(CORSMiddleware, allow_origins=["http://localhost:5173"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

# --- SỬA LỖI CÚ PHÁP TẠI ĐÂY ---
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

class UserRegister(BaseModel):
    email: EmailStr; password: str; full_name: str; role: str = "Patient"
class UserLogin(BaseModel):
    email: EmailStr; password: str
class UserUpdate(BaseModel):
    full_name: str; password: str = None
class CommentCreate(BaseModel):
    image_id: str; user_id: str; content: str

def create_notification(db: Session, user_id, message: str):
    notif = Notification(UserId=user_id, Message=message)
    db.add(notif); db.commit()

# --- API ENDPOINTS ---
@app.post("/api/register", status_code=status.HTTP_201_CREATED)
def register(user: UserRegister, db: Session = Depends(get_db)):
    if db.query(AppUser).filter(AppUser.Email == user.email).first(): raise HTTPException(400, "Email tồn tại")
    new_user = AppUser(Email=user.email, Password=user.password, FullName=user.full_name, Role=user.role)
    db.add(new_user); db.commit(); db.refresh(new_user)
    return {"message": "Success", "userId": new_user.Id}

@app.post("/api/login")
def login(user: UserLogin, db: Session = Depends(get_db)):
    db_user = db.query(AppUser).filter(AppUser.Email == user.email).first()
    if not db_user or db_user.Password != user.password: raise HTTPException(401, "Sai thông tin")
    return {"message": "Success", "user": {"id": db_user.Id, "fullName": db_user.FullName, "role": db_user.Role}}

@app.put("/api/user/{user_id}")
def update_user(user_id: str, data: UserUpdate, db: Session = Depends(get_db)):
    try:
        user = db.query(AppUser).filter(AppUser.Id == uuid.UUID(user_id)).first()
        if not user: raise HTTPException(404, "User không tồn tại")
        user.FullName = data.full_name
        if data.password: user.Password = data.password
        db.commit()
        return {"message": "Updated", "fullName": user.FullName}
    except: raise HTTPException(500, "Lỗi Server")

@app.post("/api/upload")
def upload_image(file: UploadFile = File(...), user_id: str = Form(...), db: Session = Depends(get_db)):
    try:
        user_uuid = uuid.UUID(user_id)
        current_user = db.query(AppUser).filter(AppUser.Id == user_uuid).first()
        if not current_user: raise HTTPException(400, "User lỗi")
        
        file_ext = file.filename.split(".")[-1].lower()
        file_path = f"static/uploads/{uuid.uuid4()}.{file_ext}"
        with open(file_path, "wb+") as buffer: shutil.copyfileobj(file.file, buffer)
        
        new_image = MedicalImage(PatientId=user_uuid, ImageUrl=file_path, Status="AI_Completed")
        db.add(new_image); db.commit(); db.refresh(new_image)
        
        risk_score = round(random.uniform(10.0, 95.0), 1)
        if risk_score >= 70: diagnosis = "Nguy cơ cao"
        elif risk_score >= 40: diagnosis = "Trung bình"
        else: diagnosis = "Thấp"

        analysis = AnalysisResult(ImageId=new_image.Id, RiskScore=risk_score, Diagnosis=diagnosis, Confidence=0.98)
        db.add(analysis); db.commit()

        doctors = db.query(AppUser).filter(AppUser.Role == "Doctor").all()
        for doc in doctors:
            create_notification(db, doc.Id, f"Bệnh nhân {current_user.FullName} vừa gửi hồ sơ mới (AI: {diagnosis})")

        return {"message": "Done", "imageId": new_image.Id, "originalUrl": f"http://127.0.0.1:8000/{file_path}", "heatmapUrl": f"http://127.0.0.1:8000/{file_path}", "riskScore": risk_score, "diagnosis": diagnosis, "status": "Completed"}
    except Exception as e: print(e); raise HTTPException(400, "Lỗi Upload")

@app.get("/api/history/{user_id}")
def get_history(user_id: str, db: Session = Depends(get_db)):
    results = db.query(MedicalImage).filter(MedicalImage.PatientId == user_id).order_by(MedicalImage.CreatedAt.desc()).all()
    return [{"key": str(img.Id), "date": img.CreatedAt.strftime("%d/%m %H:%M"), "id": str(img.Id)[:8].upper(), "result": f"{img.Analysis.Diagnosis} ({img.Analysis.RiskScore}%)" if img.Analysis else "...", "status": "Đã duyệt" if img.DoctorNote else "Chờ duyệt", "doctor_conclusion": img.DoctorNote.Conclusion if img.DoctorNote else None, "image_url": f"http://127.0.0.1:8000/{img.ImageUrl}"} for img in results]

@app.delete("/api/image/{image_id}")
def delete_image(image_id: str, db: Session = Depends(get_db)):
    img = db.query(MedicalImage).filter(MedicalImage.Id == image_id).first()
    if img: db.delete(img); db.commit()
    return {"message": "Deleted"}

@app.get("/api/doctor/pending")
def get_doctor_dashboard(db: Session = Depends(get_db)):
    images = db.query(MedicalImage).order_by(MedicalImage.CreatedAt.desc()).all()
    return [{"key": str(img.Id), "patient": img.Patient.FullName if img.Patient else "Unknown", "time": img.CreatedAt.strftime("%d/%m %H:%M"), "risk": img.Analysis.Diagnosis if img.Analysis else "N/A", "riskScore": img.Analysis.RiskScore if img.Analysis else 0, "status": "Reviewed" if img.DoctorNote else "Pending", "image_url": f"http://127.0.0.1:8000/{img.ImageUrl}", "conclusion": img.DoctorNote.Conclusion if img.DoctorNote else ""} for img in images]

@app.post("/api/doctor/review")
def doctor_review(image_id: str=Form(...), doctor_id: str=Form(...), conclusion: str=Form(...), db: Session=Depends(get_db)):
    try:
        if not db.query(AppUser).filter(AppUser.Id == uuid.UUID(doctor_id)).first(): raise HTTPException(400, "Bác sĩ không tồn tại")
        db.add(DoctorDiagnosis(ImageId=uuid.UUID(image_id), DoctorId=uuid.UUID(doctor_id), Conclusion=conclusion))
        
        img = db.query(MedicalImage).filter(MedicalImage.Id == image_id).first()
        if img: 
            img.Status = "Doctor_Reviewed"
            create_notification(db, img.PatientId, f"Hồ sơ {str(img.Id)[:8]} của bạn đã được Bác sĩ thẩm định")
            
        db.commit(); return {"message": "Saved"}
    except: raise HTTPException(500, "Lỗi lưu")

@app.get("/api/statistics")
def get_stats(db: Session = Depends(get_db)):
    chart_data = [{"name": r[0], "value": r[1]} for r in db.query(AnalysisResult.Diagnosis, func.count(AnalysisResult.Id)).group_by(AnalysisResult.Diagnosis).all()]
    return {"summary": {"patients": db.query(AppUser).filter(AppUser.Role=="Patient").count(), "scans": db.query(MedicalImage).count(), "pending": db.query(MedicalImage).filter(MedicalImage.Status=="AI_Completed").count()}, "chart_data": chart_data}

@app.get("/api/admin/users")
def get_all_users(db: Session = Depends(get_db)):
    users = db.query(AppUser).order_by(AppUser.CreatedAt.desc()).all()
    return [{"key": str(u.Id), "name": u.FullName, "email": u.Email, "role": u.Role, "joined": u.CreatedAt.strftime("%d/%m/%Y")} for u in users]

@app.delete("/api/admin/user/{user_id}")
def delete_user(user_id: str, db: Session = Depends(get_db)):
    user = db.query(AppUser).filter(AppUser.Id == user_id).first()
    if not user: raise HTTPException(404, "Not Found")
    db.delete(user); db.commit() 
    return {"message": "Deleted User"}

@app.post("/api/comment")
def add_comment(data: CommentCreate, db: Session = Depends(get_db)):
    comment = Comment(ImageId=uuid.UUID(data.image_id), UserId=uuid.UUID(data.user_id), Content=data.content)
    db.add(comment); db.commit()
    return {"message": "Sent"}

@app.get("/api/comments/{image_id}")
def get_comments(image_id: str, db: Session = Depends(get_db)):
    comments = db.query(Comment).filter(Comment.ImageId == image_id).order_by(Comment.CreatedAt.asc()).all()
    return [{"id": str(c.Id), "user": c.User.FullName, "role": c.User.Role, "content": c.Content, "time": c.CreatedAt.strftime("%H:%M %d/%m")} for c in comments]

@app.get("/api/notifications/{user_id}")
def get_notifications(user_id: str, db: Session = Depends(get_db)):
    notifs = db.query(Notification).filter(Notification.UserId == user_id).order_by(Notification.CreatedAt.desc()).all()
    return [{"id": str(n.Id), "message": n.Message, "isRead": n.IsRead, "time": n.CreatedAt.strftime("%H:%M %d/%m")} for n in notifs]

@app.put("/api/notifications/read/{notif_id}")
def read_notification(notif_id: str, db: Session = Depends(get_db)):
    notif = db.query(Notification).filter(Notification.Id == notif_id).first()
    if notif:
        notif.IsRead = True
        db.commit()
    return {"message": "Read"}