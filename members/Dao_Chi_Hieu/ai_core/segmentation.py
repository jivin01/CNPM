import cv2
import numpy as np
import os
import torch

# Đường dẫn đến file model (Sau này bạn copy file .pth vào thư mục model/)
MODEL_PATH = "model/unet_vessel.pth"

class VesselSegmentation:
    def __init__(self):
        self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        self.model = self.load_model()

    def load_model(self):
        # Kiểm tra nếu có file model thì load, không thì báo warning
        if os.path.exists(MODEL_PATH):
            print(f"✅ Đang load model từ {MODEL_PATH}...")
            # model = torch.load(MODEL_PATH) 
            # model.eval()
            # return model
            return None # Placeholder
        else:
            print("⚠️ Chưa tìm thấy file model trọng số! Đang chạy chế độ giả lập (Dummy).")
            return None

    def predict(self, processed_image: np.ndarray) -> np.ndarray:
        """
        Input: Ảnh xám đã qua CLAHE (512x512)
        Output: Ảnh nhị phân (Mask) tách mạch máu
        """
        
        # --- LOGIC CHẠY AI THẬT (Khi có model) ---
        if self.model:
            # Chuyển ảnh sang Tensor -> Đưa vào Model -> Lấy output -> Chuyển về ảnh
            # tensor_img = torch.from_numpy(processed_image).unsqueeze(0).float()
            # with torch.no_grad():
            #     output = self.model(tensor_img)
            # return output_mask
            pass

        # --- LOGIC GIẢ LẬP (Dùng thuật toán Thresholding đơn giản để demo) ---
        # Tạm thời dùng Adaptive Threshold để tách mạch máu thay cho AI
        mask = cv2.adaptiveThreshold(
            processed_image, 
            255, 
            cv2.ADAPTIVE_THRESH_GAUSSIAN_C, 
            cv2.THRESH_BINARY_INV, 
            11, 
            2
        )
        return mask

# Khởi tạo object để dùng bên api
segmentor = VesselSegmentation()