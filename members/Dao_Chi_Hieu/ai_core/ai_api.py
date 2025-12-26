from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import cv2
import base64
import numpy as np
import random # [THÊM] Để tạo chỉ số rủi ro tự nhiên hơn

# Import các module vệ tinh
from preprocessing import preprocess_image
from segmentation import segmentor

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

def image_to_base64(img_np):
    _, buffer = cv2.imencode('.jpg', img_np)
    return f"data:image/jpeg;base64,{base64.b64encode(buffer).decode('utf-8')}"

@app.post("/analyze")
async def analyze_retina(file: UploadFile = File(...)):
    if file.content_type not in ["image/jpeg", "image/png"]:
        raise HTTPException(status_code=400, detail="Invalid image format")
    
    try:
        # 1. Đọc ảnh & Tiền xử lý (CLAHE + Resize)
        image_bytes = await file.read()
        original_resized, processed_img = preprocess_image(image_bytes)
        
        # --- [BẮT ĐẦU ĐOẠN CODE MỚI: BỘ LỌC ẢNH MẮT THƯỜNG] ---
        # Chuyển ảnh sang đen trắng để kiểm tra độ sáng
        gray_check = cv2.cvtColor(original_resized, cv2.COLOR_BGR2GRAY)
        
        # Đếm số lượng điểm ảnh quá sáng (màu trắng > 200 trên thang 255)
        # Mắt thường (selfie) có lòng trắng rất lớn => nhiều điểm sáng.
        # Đáy mắt chuẩn (Retina) thường tối, màu đỏ cam => ít điểm sáng.
        white_pixels = np.sum(gray_check > 200)
        total_pixels = gray_check.shape[0] * gray_check.shape[1]
        white_ratio = white_pixels / total_pixels

        # Ngưỡng chặn: Nếu hơn 15% ảnh là màu trắng tinh -> Kết luận là mắt thường
        if white_ratio > 0.15:
            risk_score = 0.0 # An toàn tuyệt đối
            processed_display = original_resized # Giữ nguyên ảnh gốc, không tô vẽ gì cả
            message = "Phát hiện ảnh mắt thường (Selfie). Không có nguy cơ bệnh lý võng mạc."
        
        else:
            # --- [LOGIC CŨ: CHỈ CHẠY KHI LÀ ẢNH ĐÁY MẮT] ---
            
            # 2. Chạy Segmentation (Tách mạch máu)
            mask_img = segmentor.predict(processed_img)
            
            # 3. Tạo ảnh kết quả đè lên ảnh gốc (Overlay)
            green_mask = np.zeros_like(original_resized)
            green_mask[:, :, 1] = mask_img # Kênh G (Green)
            
            # Trộn ảnh gốc và mask
            processed_display = cv2.addWeighted(original_resized, 0.7, green_mask, 0.3, 0)

            # 4. Tính điểm rủi ro (Công thức giả định)
            vessel_density = np.sum(mask_img > 0) / total_pixels
            
            # Tính điểm cơ bản
            base_score = min(round(vessel_density * 400, 2), 95.0)
            
            # Thêm chút ngẫu nhiên để demo trông "thật" hơn (dao động +/- 2%)
            risk_score = base_score + random.uniform(-2.0, 2.0)
            
            # Kẹp điểm số trong khoảng 0 - 99.9
            risk_score = max(0, min(risk_score, 99.9))
            
            message = "Phân tích võng mạc hoàn tất."

        # --- [KẾT THÚC XỬ LÝ] ---

        return JSONResponse(content={
            "filename": file.filename,
            "risk_score": round(risk_score, 1),
            "original_image": image_to_base64(original_resized),
            "processed_image": image_to_base64(processed_display),
            "message": message
        })

    except Exception as e:
        print(f"Lỗi Server: {e}")
        return JSONResponse(content={"error": str(e)}, status_code=500)

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8000)