"""
Minimal backend for testing
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.database.config import settings
from app.database.connection import init_db
from app.routers import auth_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    print("Starting AURA Backend (Minimal)...")
    await init_db()
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

# Include only auth router
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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "minimal_backend:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )
