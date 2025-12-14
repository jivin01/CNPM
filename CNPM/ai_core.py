# FILE: ai_core.py
from PIL import Image, ImageDraw, ImageFont
import random
import time

def analyze_image(image_file):
    """
    Hàm xử lý ảnh:
    Input: File ảnh gốc
    Output: Ảnh đã vẽ khung đỏ, Mức độ bệnh, Độ tin cậy
    """
    # 1. Mở ảnh
    img = Image.open(image_file).convert("RGB")
    draw = ImageDraw.Draw(img)
    
    # 2. Giả lập quá trình suy nghĩ (loading)
    time.sleep(1.5) 
    
    # 3. Random kết quả (Giả lập Model Deep Learning)
    # Tỉ lệ: 40% Bình thường, 60% có bệnh (để demo cho đẹp)
    risks = ["Normal (Bình thường)", "Mild DR (Nhẹ)", "Moderate DR (Trung bình)", "Severe DR (Nặng)"]
    weights = [0.4, 0.2, 0.2, 0.2]
    risk_result = random.choices(risks, weights=weights, k=1)[0]
    
    confidence = round(random.uniform(0.85, 0.99), 2) # Độ tin cậy giả định
    
    # 4. Nếu có bệnh, vẽ khung đỏ (Heatmap giả lập)
    if "Normal" not in risk_result:
        w, h = img.size
        # Tạo toạ độ ngẫu nhiên ở khu vực trung tâm ảnh
        x1 = random.randint(int(w*0.3), int(w*0.5))
        y1 = random.randint(int(h*0.3), int(h*0.5))
        x2 = x1 + random.randint(50, 150)
        y2 = y1 + random.randint(50, 150)
        
        # Vẽ hình chữ nhật đỏ nét đứt
        draw.rectangle([x1, y1, x2, y2], outline="red", width=5)
        
        # Vẽ chữ cảnh báo lên ảnh
        try:
            # Cố gắng load font mặc định, nếu không thì dùng default
            font = ImageFont.load_default()
        except:
            font = None
            
        draw.text((x1, y1 - 15), "ANOMALY DETECTED", fill="red", font=font)

    return img, risk_result, confidence