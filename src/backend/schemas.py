from pydantic import BaseModel

# Đây là cái khuôn quy định: Khi Đăng ký thì cần gửi những gì?
class UserRegister(BaseModel):
    full_name: str
    email: str
    password: str

# Đây là cái khuôn quy định: Khi Đăng ký xong thì trả về thông tin gì? (Giấu mật khẩu đi)
class UserOut(BaseModel):
    id: int
    full_name: str
    email: str