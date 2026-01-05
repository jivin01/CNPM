import os
import io
from typing import Optional
import uuid

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

    # Quick validation: ensure Cloudinary credentials are present in env
    cloudinary_url = os.getenv("CLOUDINARY_URL")
    cloud_name = os.getenv("CLOUDINARY_CLOUD_NAME")
    api_key = os.getenv("CLOUDINARY_API_KEY")
    api_secret = os.getenv("CLOUDINARY_API_SECRET")

    if not cloudinary_url and not (cloud_name and api_key and api_secret):
        raise RuntimeError("Cloudinary not configured: set CLOUDINARY_URL or CLOUDINARY_CLOUD_NAME + CLOUDINARY_API_KEY + CLOUDINARY_API_SECRET")

    # configure from env (cloudinary lib reads env vars automatically but ensure secure output)
    try:
        cloudinary.config(secure=True)
    except Exception:
        # continue; config may be no-op if lib reads env automatically
        pass

    out = io.BytesIO(image_bytes)
    out.seek(0)
    res = cloudinary.uploader.upload(out, public_id=public_id, resource_type='image')
    # prefer secure_url but fall back to url
    url = res.get("secure_url") or res.get("url")
    if not url:
        raise RuntimeError(f"Cloudinary upload returned no URL: {res}")
    return url


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

    try:
        # if path includes folders ensure normalized
        path = path.lstrip("/")
        res = client.storage.from_(supabase_bucket).upload(path, image_bytes)
        # supabase-py returns {'data': None, 'error': None} or may raise; check error
        if isinstance(res, dict) and res.get('error'):
            raise RuntimeError(f"Supabase storage upload error: {res.get('error')}")
    except Exception as e:
        raise RuntimeError(f"Supabase upload failed: {e}")

    # Attempt to get public URL
    try:
        pub = client.storage.from_(supabase_bucket).get_public_url(path)
        # helper: different versions return dict or string
        if isinstance(pub, dict):
            # older versions may return {'publicUrl': 'https://...'}
            return pub.get('publicUrl') or pub.get('public_url') or str(pub)
        return pub
    except Exception:
        # fallback: return path
        return path


def upload_if_configured(image_bytes: bytes, public_id: str = None, filename: str = None) -> str:
    """Upload image bytes to a configured provider and return a public URL.

    Behavior:
      - If Supabase env vars are present and supabase client is available, prefer Supabase.
      - Otherwise if Cloudinary client is available and configured, try Cloudinary.
      - If the preferred provider fails, attempt the other provider if available.

    Returns the public URL on success or raises RuntimeError with combined errors.
    """
    errors = []

    # prepare a safe filename/path
    if not filename:
        filename = public_id or f"aura_{uuid.uuid4()}.png"
    path = filename.lstrip("/")

    # Decide preferred order: prefer Supabase when env configured
    supabase_configured = SUPABASE_PY_AVAILABLE and os.getenv("SUPABASE_URL") and os.getenv("SUPABASE_KEY") and (os.getenv("SUPABASE_BUCKET") is not None)
    cloudinary_configured = cloudinary is not None and (os.getenv("CLOUDINARY_URL") or (os.getenv("CLOUDINARY_CLOUD_NAME") and os.getenv("CLOUDINARY_API_KEY") and os.getenv("CLOUDINARY_API_SECRET")))

    providers = []
    if supabase_configured:
        providers.append('supabase')
    if cloudinary_configured:
        providers.append('cloudinary')

    # If none configured, still try whichever client is installed (to give clear errors)
    if not providers:
        if SUPABASE_PY_AVAILABLE:
            providers.append('supabase')
        if cloudinary is not None:
            providers.append('cloudinary')

    # Attempt providers in order
    for p in providers:
        try:
            if p == 'supabase':
                return upload_to_supabase(image_bytes, path)
            elif p == 'cloudinary':
                return upload_to_cloudinary(image_bytes, public_id=public_id)
        except Exception as e:
            errors.append(f"{p} error: {e}")
            # continue to next provider

    # If we reached here, all attempts failed
    raise RuntimeError("All storage upload attempts failed: " + "; ".join(errors))
