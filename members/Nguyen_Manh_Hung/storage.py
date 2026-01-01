import os
import io
from typing import Optional

try:
    import cloudinary
    import cloudinary.uploader
except Exception:
    cloudinary = None

try:
    from supabase import create_client
    SUPABASE_PY_AVAILABLE = True
except Exception:
    SUPABASE_PY_AVAILABLE = False


def upload_to_cloudinary(image_bytes: bytes, public_id: Optional[str] = None) -> str:
    """Uploads bytes to Cloudinary if configured via environment variables.

    Expects CLOUDINARY_URL or CLOUDINARY_CLOUD_NAME + API keys in env.
    Returns the secure URL on success, or raises an Exception.
    """
    if cloudinary is None:
        raise RuntimeError("cloudinary package not available; install with 'pip install cloudinary'")

    # configure from env (cloudinary lib reads env vars automatically but ensure secure output)
    cloudinary.config(secure=True)

    out = io.BytesIO(image_bytes)
    out.seek(0)
    res = cloudinary.uploader.upload(out, public_id=public_id, resource_type='image')
    return res.get("secure_url")


def upload_to_supabase(image_bytes: bytes, path: str, bucket: Optional[str] = None) -> str:
    """Upload bytes to Supabase Storage using supabase-py.

    Requires environment variables SUPABASE_URL and SUPABASE_KEY and a bucket name.
    Returns a public URL (if bucket is public) or the object path.
    """
    if not SUPABASE_PY_AVAILABLE:
        raise RuntimeError("supabase package not available; install with 'pip install supabase'")

    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_KEY")
    supabase_bucket = bucket or os.getenv("SUPABASE_BUCKET")

    if not supabase_url or not supabase_key or not supabase_bucket:
        raise RuntimeError("Missing SUPABASE_URL, SUPABASE_KEY or SUPABASE_BUCKET environment variables")

    client = create_client(supabase_url, supabase_key)

    # supabase-py upload expects a file-like object or bytes; use upload from storage
    # Note: API may return dict with 'data' / 'error'
    try:
        # if path includes folders ensure normalized
        path = path.lstrip("/")
        res = client.storage.from_(supabase_bucket).upload(path, image_bytes)
    except Exception as e:
        # rethrow with helpful message
        raise RuntimeError(f"Supabase upload failed: {e}")

    # Attempt to get public URL
    try:
        pub = client.storage.from_(supabase_bucket).get_public_url(path)
        if isinstance(pub, dict) and pub.get("publicUrl"):
            return pub.get("publicUrl")
        # supabase-py may return string
        return pub
    except Exception:
        # fallback: return path
        return path
