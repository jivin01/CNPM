import cv2
import numpy as np

# Kích thước chuẩn cho Model AI
IMG_SIZE = (512, 512)

def preprocess_image(image_bytes: bytes) -> tuple[np.ndarray, np.ndarray]:
    """
    Input: Bytes ảnh gốc.
    Output: 
        - original_resized: Ảnh gốc đã resize (để hiển thị).
        - processed_img: Ảnh đã qua CLAHE và Resize (để đưa vào Model).
    """
    # 1. Decode ảnh
    nparr = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    
    if img is None:
        raise ValueError("Không thể đọc file ảnh.")

    # 2. Resize về kích thước chuẩn (512x512)
    img_resized = cv2.resize(img, IMG_SIZE)

    # 3. Chuyển sang Grayscale
    gray = cv2.cvtColor(img_resized, cv2.COLOR_BGR2GRAY)
    
    # 4. Áp dụng CLAHE (Làm rõ mạch máu)
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    enhanced_img = clahe.apply(gray)
    
    # QUAN TRỌNG: Phải trả về 2 giá trị tại đây
    return img_resized, enhanced_img 

if __name__ == "__main__":
    print("✅ Module preprocessing đã cập nhật chuẩn 2 đầu ra!")