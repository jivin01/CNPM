"""
Simple backend with working models
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.database.config import settings
from app.database.connection import get_db
from simple_models import Base, User
from app.routers import auth_router
from app.utils.auth import get_password_hash
from sqlalchemy import select

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    print("Starting AURA Backend (Simple)...")
    
    # Create tables using engine
    from app.database.connection import engine
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    print("Database initialized successfully")
    
    yield
    
    # Shutdown
    print("Shutting down AURA Backend...")

# Create FastAPI app
app = FastAPI(
    title="AURA - AI System for Retinal Vascular Health Screening",
    description="Medical platform for retinal image analysis and disease risk assessment",
    version="1.0.0",
    lifespan=lifespan
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include auth router
app.include_router(auth_router, prefix="/api/v1")

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "AURA - AI System for Retinal Vascular Health Screening",
        "version": "1.0.0",
        "status": "running"
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "aura-backend"}

@app.post("/create-test-user")
async def create_test_user():
    """Create a test user for debugging"""
    async for db in get_db():
        try:
            # Check if user exists
            stmt = select(User).where(User.email == "test@example.com")
            result = await db.execute(stmt)
            existing_user = result.scalar_one_or_none()
            
            if existing_user:
                return {"message": "Test user already exists", "user_id": existing_user.id}
            
            # Create new user
            hashed_password = get_password_hash("testpass123")
            new_user = User(
                email="test@example.com",
                password_hash=hashed_password,
                role="patient"
            )
            
            db.add(new_user)
            await db.commit()
            await db.refresh(new_user)
            
            return {"message": "Test user created", "user_id": new_user.id}
            
        except Exception as e:
            await db.rollback()
            return {"error": str(e)}
        finally:
            break

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "simple_backend:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )
