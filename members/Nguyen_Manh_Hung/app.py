import os
import io
import base64
import uuid
import glob
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.responses import JSONResponse, FileResponse
from processing import analyze_image
from storage import upload_to_cloudinary

app = FastAPI(title="AI Specialist - Nguyen_Manh_Hung")


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/analyze")
async def analyze(file: UploadFile = File(...), upload: bool = False):
    """Nhận một file ảnh, chạy segmentation đơn giản, trả về ảnh annotated (base64) và JSON kết quả.

    Query param `upload=true` để cố gắng upload ảnh annotated lên Cloudinary (nếu cấu hình env tồn tại).
    """
    if file.content_type.split("/")[0] != "image":
        raise HTTPException(status_code=400, detail="File phải là ảnh")

    content = await file.read()

    annotated_bytes, metrics = analyze_image(content)

    result = {
        "id": str(uuid.uuid4()),
        "filename": file.filename,
        "metrics": metrics,
    }

    # attach annotated image as base64 (small images OK)
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
        # return a relative path to the repo for easier viewing
        result["saved_path"] = os.path.relpath(saved_path, start=os.getcwd())
    except Exception as e:
        result["saved_path_error"] = str(e)

    # optional upload
    if upload:
        try:
            url = upload_to_cloudinary(annotated_bytes, public_id=f"aura_{uuid.uuid4()}")
            result["cloudinary_url"] = url
        except Exception as e:
            result["cloudinary_error"] = str(e)

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
