import os
import io
import base64
import uuid
import glob
import requests
import sqlite3
import datetime
from fastapi import FastAPI, File, UploadFile, HTTPException, Query
from fastapi.responses import JSONResponse, FileResponse
from processing import analyze_image
from storage import upload_if_configured, SUPABASE_PY_AVAILABLE, cloudinary

app = FastAPI(title="AI Specialist - Nguyen_Manh_Hung")

DB_PATH = os.path.join(os.path.dirname(__file__), 'storage.db')


def ensure_db(path: str = DB_PATH):
    """Ensure SQLite DB and table exist."""
    conn = sqlite3.connect(path)
    try:
        conn.execute(
            '''CREATE TABLE IF NOT EXISTS images (
                id TEXT PRIMARY KEY,
                filename TEXT,
                annotated_url TEXT,
                original_url TEXT,
                saved_path TEXT,
                created_at TEXT
            )''')
        conn.commit()
    finally:
        conn.close()


def save_image_record(id: str, filename: str, annotated_url: str | None, original_url: str | None, saved_path: str | None, path: str = DB_PATH):
    """Insert or update an image record into SQLite DB."""
    conn = sqlite3.connect(path)
    try:
        cur = conn.cursor()
        cur.execute(
            'INSERT OR REPLACE INTO images (id, filename, annotated_url, original_url, saved_path, created_at) VALUES (?,?,?,?,?,?)',
            (id, filename, annotated_url, original_url, saved_path, datetime.datetime.utcnow().isoformat())
        )
        conn.commit()
    finally:
        conn.close()


@app.get("/health")
def health():
    return {"status": "ok", "service": "ai_specialist", "version": "1.0"}


@app.post("/analyze")
async def analyze(file: UploadFile = File(...), upload: bool = False, callback_url: str | None = Query(None)):
    """Nhận một file ảnh, chạy segmentation, trả về ảnh annotated và JSON kết quả.

    Query params:
      - upload=true|false: nếu true sẽ cố gắng upload ảnh annotated lên một storage (Cloudinary/Supabase)
      - callback_url: nếu set, service sẽ POST kết quả JSON tới URL này sau khi phân tích xong
    """
    if file.content_type.split("/")[0] != "image":
        raise HTTPException(status_code=400, detail="File phải là ảnh")

    content = await file.read()

    annotated_bytes, metrics = analyze_image(content)

    # compute a simple risk score from metrics (fallback) if not provided
    # use vessel density or skeleton length as a heuristic
    risk_score = None
    try:
        if isinstance(metrics, dict):
            if 'vessel_density' in metrics:
                risk_score = float(metrics.get('vessel_density') * 100.0)
            elif 'skeleton_length_pixels' in metrics and metrics.get('width') and metrics.get('height'):
                # normalize by image size
                area = metrics.get('width') * metrics.get('height')
                risk_score = float(metrics.get('skeleton_length_pixels') / max(area, 1) * 1000.0)
    except Exception:
        risk_score = None

    if risk_score is None:
        # fallback random-ish small score
        risk_score = round(0.5, 2)

    result = {
        "id": str(uuid.uuid4()),
        "filename": file.filename,
        "metrics": metrics,
        "risk_score": float(risk_score),
        "status": "done"
    }

    # attach annotated image as base64 for backward compatibility
    result["annotated_image_base64"] = base64.b64encode(annotated_bytes).decode("ascii")

    # save annotated image on server for inspection
    try:
        base_dir = os.path.dirname(__file__)
        out_dir = os.path.join(base_dir, "output")
        os.makedirs(out_dir, exist_ok=True)
        saved_filename = f"{result['id']}.png"
        saved_path = os.path.join(out_dir, saved_filename)
        with open(saved_path, "wb") as f:
            f.write(annotated_bytes)
        # return path relative to project root for readability
        result["saved_path"] = os.path.relpath(saved_path, start=os.getcwd())
        # also include absolute path for debugging
        result["saved_path_abs"] = os.path.abspath(saved_path)
    except Exception as e:
        result["saved_path_error"] = str(e)

    # Diagnostics: which storage providers are configured/available in this environment
    providers_available = []
    try:
        # Supabase detection
        if SUPABASE_PY_AVAILABLE and os.getenv('SUPABASE_URL') and os.getenv('SUPABASE_KEY'):
            providers_available.append('supabase')
    except Exception:
        pass
    try:
        # Cloudinary detection
        if cloudinary is not None and (os.getenv('CLOUDINARY_URL') or (os.getenv('CLOUDINARY_CLOUD_NAME') and os.getenv('CLOUDINARY_API_KEY') and os.getenv('CLOUDINARY_API_SECRET'))):
            providers_available.append('cloudinary')
    except Exception:
        pass

    result["upload_providers_available"] = providers_available

    # optional upload to configured storage (cloudinary/supabase)
    annotated_url = None
    original_url = None
    if upload:
        # record that we attempted upload
        result["upload_attempted"] = True
        try:
            # upload annotated image
            print(f"Attempting upload of annotated image. Providers available: {providers_available}")
            annotated_url = upload_if_configured(annotated_bytes, public_id=f"aura_{uuid.uuid4()}", filename=saved_filename)
            result["annotated_image"] = annotated_url
            result["annotated_image_url"] = annotated_url
            result["annotated_upload_error"] = None
            print(f"Annotated upload succeeded: {annotated_url}")
        except Exception as e:
            result["annotated_upload_error"] = str(e)
            print(f"Annotated upload failed: {e}")

        try:
            # attempt to upload original image as well
            print("Attempting upload of original image")
            original_url = upload_if_configured(content, public_id=f"orig_{uuid.uuid4()}", filename=f"orig_{result['id']}.png")
            result["original_image"] = original_url
            result["original_upload_error"] = None
            print(f"Original upload succeeded: {original_url}")
        except Exception as e:
            result["original_upload_error"] = str(e)
            print(f"Original upload failed: {e}")

        # persist URLs into local sqlite DB if any upload succeeded
        try:
            ensure_db()
            save_image_record(result['id'], result.get('filename'), result.get('annotated_image') if result.get('annotated_image') and not result.get('annotated_image', '').startswith('data:') else None, result.get('original_image'), result.get('saved_path'))
            result['db_saved'] = True
        except Exception as e:
            result['db_saved'] = False
            result['db_error'] = str(e)

    else:
        result["upload_attempted"] = False

    # if not uploaded, provide annotated_image as data URI so backend/tests expecting 'annotated_image' see it
    if not result.get("annotated_image"):
        data_uri = "data:image/png;base64," + result.get("annotated_image_base64")
        result["annotated_image"] = data_uri

    # remove ambiguous cloudinary_* keys; keep legacy key if present
    if result.get("annotated_image") and 'cloudinary_url' in result:
        result.pop('cloudinary_url', None)

    # send callback if provided (fire-and-forget)
    if callback_url:
        try:
            # best-effort POST
            headers = {"Content-Type": "application/json"}
            requests.post(callback_url, json=result, headers=headers, timeout=5)
            result["callback_posted"] = True
        except Exception as e:
            result["callback_error"] = str(e)

    return JSONResponse(content=result)


@app.get("/outputs")
def list_outputs():
    """Liệt kê các file ảnh đã được lưu trong thư mục output."""
    base_dir = os.path.dirname(__file__)
    out_dir = os.path.join(base_dir, "output")
    if not os.path.isdir(out_dir):
        return {"files": []}
    files = [os.path.basename(p) for p in glob.glob(os.path.join(out_dir, "*.png"))]
    return {"files": files}


@app.get("/output/{filename}")
def get_output(filename: str):
    """Trả file ảnh đã annotate để xem trực tiếp (image/png)."""
    base_dir = os.path.dirname(__file__)
    path = os.path.join(base_dir, "output", filename)
    if not os.path.isfile(path):
        raise HTTPException(status_code=404, detail="Not found")
    return FileResponse(path, media_type="image/png")
