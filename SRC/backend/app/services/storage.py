import os
from pathlib import Path
from typing import Optional

CLOUDINARY_CLOUD_NAME = os.getenv("CLOUDINARY_CLOUD_NAME")
CLOUDINARY_API_KEY = os.getenv("CLOUDINARY_API_KEY")
CLOUDINARY_API_SECRET = os.getenv("CLOUDINARY_API_SECRET")

class StorageService:
    """Simple storage adapter: local storage by default.
    If Cloudinary credentials are present, a hook function is available (not fully implemented here).
    """
    def __init__(self, base_dir: Optional[str] = None):
        self.base_dir = Path(base_dir) if base_dir else Path(__file__).resolve().parent.parent / "static" / "images"
        self.base_dir.mkdir(parents=True, exist_ok=True)

    def url_for_local_path(self, local_path: str) -> str:
        """Return a URL path for a locally served image (assumes /images/ route)."""
        return f"/images/{Path(local_path).name}"

    def upload_if_configured(self, local_path: str) -> str:
        """If cloud storage is configured, upload and return external URL; otherwise return local URL.
        This is a placeholder for Cloudinary/Supabase integration.
        """
        # Placeholder: Cloud upload not implemented; return local url
        # To implement Cloudinary: use cloudinary.uploader.upload(local_path) and return secure_url.
        return self.url_for_local_path(local_path)

storage = StorageService()