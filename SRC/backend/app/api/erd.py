"""
ERD Processing API Endpoints
"""
from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from fastapi.responses import FileResponse
from typing import Dict, List, Optional
import shutil
import uuid
import os
from pathlib import Path

from ..database import get_session
from ..models.models import User
from .auth import get_current_user, require_roles

# Import ERD processing modules
import sys
from pathlib import Path
BASE_DIR = Path(__file__).resolve().parent.parent.parent.parent
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

from ai.erd_parser import ERDParser
from ai.model_generator import ModelGenerator
from ai.database_generator import DatabaseGenerator

router = APIRouter(prefix="/erd", tags=["erd"])

# ERD processing directories
ERD_DIR = BASE_DIR / "backend" / "static" / "erd"
ERD_DIR.mkdir(parents=True, exist_ok=True)
GENERATED_DIR = BASE_DIR / "backend" / "generated"
GENERATED_DIR.mkdir(parents=True, exist_ok=True)

@router.post("/upload")
async def upload_erd(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    """Upload ERD diagram để xử lý"""
    
    # Validate file type
    allowed_types = ["image/png", "image/jpeg", "image/jpg", "image/svg+xml"]
    if file.content_type not in allowed_types:
        raise HTTPException(status_code=400, detail="Chỉ hỗ trợ file ảnh PNG, JPG, SVG")
    
    # Save uploaded file
    filename = f"{uuid.uuid4().hex}_{file.filename}"
    file_path = ERD_DIR / filename
    
    with file_path.open("wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    try:
        # Parse ERD
        parser = ERDParser()
        erd_result = parser.parse_from_image(str(file_path))
        
        # Generate models
        model_generator = ModelGenerator()
        models_code = model_generator.generate_models(erd_result)
        
        # Save generated models
        models_file = GENERATED_DIR / f"models_{filename.split('.')[0]}.py"
        model_generator.save_models_file(erd_result, str(models_file))
        
        # Generate database
        db_generator = DatabaseGenerator()
        db_path = GENERATED_DIR / f"database_{filename.split('.')[0]}.db"
        db_generator.generate_sql_schema(erd_result, str(db_path))
        
        return {
            "status": "success",
            "filename": filename,
            "entities": len(erd_result.entities),
            "relationships": len(erd_result.relationships),
            "confidence": erd_result.confidence,
            "models_file": str(models_file),
            "database_file": str(db_path),
            "entities_preview": [
                {
                    "name": entity.name,
                    "attributes": entity.attributes,
                    "primary_keys": entity.primary_keys,
                    "foreign_keys": entity.foreign_keys
                }
                for entity in erd_result.entities[:5]  # Preview first 5 entities
            ]
        }
        
    except Exception as e:
        # Cleanup uploaded file on error
        if file_path.exists():
            file_path.unlink()
        raise HTTPException(status_code=500, detail=f"Lỗi xử lý ERD: {str(e)}")

@router.post("/parse-text")
async def parse_erd_text(
    erd_text: Dict[str, str],
    current_user: User = Depends(get_current_user)
):
    """Parse ERD từ text description"""
    
    if "text" not in erd_text:
        raise HTTPException(status_code=400, detail="Thiếu ERD text")
    
    try:
        parser = ERDParser()
        erd_result = parser.parse_from_text(erd_text["text"])
        
        # Generate models
        model_generator = ModelGenerator()
        models_code = model_generator.generate_models(erd_result)
        
        # Generate database
        db_generator = DatabaseGenerator()
        db_path = GENERATED_DIR / f"database_text_{uuid.uuid4().hex[:8]}.db"
        db_generator.generate_sql_schema(erd_result, str(db_path))
        
        return {
            "status": "success",
            "entities": len(erd_result.entities),
            "relationships": len(erd_result.relationships),
            "confidence": erd_result.confidence,
            "models_code": models_code,
            "database_file": str(db_path),
            "entities": [
                {
                    "name": entity.name,
                    "attributes": entity.attributes,
                    "primary_keys": entity.primary_keys,
                    "foreign_keys": entity.foreign_keys
                }
                for entity in erd_result.entities
            ],
            "relationships": [
                {
                    "entity1": rel.entity1,
                    "entity2": rel.entity2,
                    "cardinality": rel.cardinality,
                    "type": rel.relationship_type
                }
                for rel in erd_result.relationships
            ]
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lỗi parse ERD text: {str(e)}")

@router.get("/download/models/{filename}")
async def download_models(
    filename: str,
    current_user: User = Depends(get_current_user)
):
    """Download generated models file"""
    file_path = GENERATED_DIR / f"models_{filename}"
    
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File không tồn tại")
    
    return FileResponse(
        file_path,
        media_type="text/x-python",
        filename=f"generated_models_{filename}"
    )

@router.get("/download/database/{filename}")
async def download_database(
    filename: str,
    current_user: User = Depends(get_current_user)
):
    """Download generated database file"""
    file_path = GENERATED_DIR / f"database_{filename}"
    
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File không tồn tại")
    
    return FileResponse(
        file_path,
        media_type="application/x-sqlite3",
        filename=f"generated_database_{filename}"
    )

@router.get("/list")
async def list_generated_files(
    current_user: User = Depends(get_current_user)
):
    """Liệt kê các file đã generated"""
    
    models_files = list(GENERATED_DIR.glob("models_*.py"))
    db_files = list(GENERATED_DIR.glob("database_*.db"))
    
    return {
        "models_files": [
            {
                "name": f.name,
                "size": f.stat().st_size,
                "created": f.stat().st_ctime
            }
            for f in models_files
        ],
        "database_files": [
            {
                "name": f.name,
                "size": f.stat().st_size,
                "created": f.stat().st_ctime
            }
            for f in db_files
        ]
    }
