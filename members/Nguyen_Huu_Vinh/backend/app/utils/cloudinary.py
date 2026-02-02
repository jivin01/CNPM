import os
import uuid
import aiofiles
from typing import Optional
from app.database.config import settings

# Create uploads directory if it doesn't exist
UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

async def upload_image_to_cloudinary(
    file_data: bytes, 
    folder: str = "aura_medical_images"
) -> Optional[str]:
    """
    Upload image locally (for demo) and return the URL
    
    Args:
        file_data: Binary image data
        folder: Folder name (for future Cloudinary integration)
        
    Returns:
        URL of uploaded image or None if upload fails
    """
    try:
        # Generate unique filename
        filename = f"retinal_image_{uuid.uuid4()}.jpg"
        
        # Save file locally
        file_path = os.path.join(UPLOAD_DIR, filename)
        
        async with aiofiles.open(file_path, 'wb') as f:
            await f.write(file_data)
        
        # Return local URL (in production, this would be Cloudinary URL)
        local_url = f"http://localhost:8000/{UPLOAD_DIR}/{filename}"
        
        print(f"Image saved locally: {file_path}")
        return local_url
        
    except Exception as e:
        print(f"Error saving image locally: {e}")
        return None

async def delete_image_from_cloudinary(public_id: str) -> bool:
    """
    Delete image (placeholder for future Cloudinary integration)
    
    Args:
        public_id: Local file path or Cloudinary public ID
        
    Returns:
        True if deletion successful, False otherwise
    """
    try:
        # For local files, just delete from filesystem
        if os.path.exists(public_id):
            os.remove(public_id)
            return True
        return False
    except Exception as e:
        print(f"Error deleting image: {e}")
        return False
