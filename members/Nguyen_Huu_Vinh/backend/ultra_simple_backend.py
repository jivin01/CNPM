"""
Ultra simple backend for testing
"""
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, Optional
import uuid
from datetime import datetime

# Simple in-memory storage
users_db: Dict[str, Dict] = {}

class UserCreate(BaseModel):
    email: str
    password: str
    role: str = "patient"

class UserResponse(BaseModel):
    id: str
    email: str
    role: str
    created_at: str

class Token(BaseModel):
    access_token: str
    token_type: str

# Create FastAPI app
app = FastAPI(
    title="AURA - Simple Test Backend",
    description="Simple backend for testing registration",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "AURA - Simple Test Backend",
        "version": "1.0.0",
        "status": "running"
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "aura-simple-backend"}

@app.post("/api/v1/auth/register", response_model=UserResponse)
async def register(user_data: UserCreate):
    """Register a new user"""
    try:
        # Check if user already exists
        for user in users_db.values():
            if user["email"] == user_data.email:
                raise HTTPException(status_code=400, detail="Email already registered")
        
        # Create new user
        user_id = str(uuid.uuid4())
        now = datetime.now().isoformat()
        
        new_user = {
            "id": user_id,
            "email": user_data.email,
            "password": user_data.password,  # In production, hash this!
            "role": user_data.role,
            "created_at": now,
            "updated_at": None
        }
        
        users_db[user_id] = new_user
        
        return UserResponse(
            id=new_user["id"],
            email=new_user["email"],
            role=new_user["role"],
            created_at=new_user["created_at"]
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Registration failed: {str(e)}")

@app.post("/api/v1/auth/login", response_model=Token)
async def login(user_data: UserCreate):
    """Login user"""
    try:
        # Find user by email
        user = None
        for u in users_db.values():
            if u["email"] == user_data.email:
                user = u
                break
        
        if not user or user["password"] != user_data.password:
            raise HTTPException(status_code=401, detail="Invalid credentials")
        
        # Generate simple token (in production, use JWT)
        token = f"simple_token_{user['id']}"
        
        return Token(access_token=token, token_type="bearer")
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Login failed: {str(e)}")

@app.get("/api/v1/users/me")
async def get_current_user():
    """Get current user (simplified)"""
    return {
        "id": "test_user_id",
        "email": "test@example.com",
        "role": "patient"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "ultra_simple_backend:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )
