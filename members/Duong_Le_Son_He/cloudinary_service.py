import cloudinary
import cloudinary.uploader
from config.settings import CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET

# Cấu hình Cloudinary
cloudinary.config(
    cloud_name=CLOUDINARY_CLOUD_NAME,
    api_key=CLOUDINARY_API_KEY,
    api_secret=CLOUDINARY_API_SECRET
)

class CloudinaryService:
    @staticmethod
    def upload_retinal_image(file_path, patient_id):
        """
        Upload ảnh võng mạc vào folder riêng của bệnh nhân
        """
        try:
            result = cloudinary.uploader.upload(
                file_path,
                folder=f"AURA/patients/{patient_id}",
                public_id=f"fundus_{patient_id}"
            )
            return result.get("secure_url")
        except Exception as e:
            print(f"Error uploading to Cloudinary: {e}")
            return None