import { useEffect, useState } from 'react'
import './App.css'

function App() {
  // Tạo một biến để lưu tin nhắn từ Python gửi sang
  const [message, setMessage] = useState("Đang kết nối tới Backend...")

  // Hàm này sẽ chạy ngay khi trang web bật lên
  useEffect(() => {
    // Gọi điện sang địa chỉ của Backend
    fetch('http://127.0.0.1:8000/api/test')
      .then(response => response.json()) // Chuyển kết quả về dạng JSON
      .then(data => {
        // Lấy dữ liệu và gán vào biến hiển thị
        setMessage(data.data) 
      })
      .catch(error => {
        console.error("Lỗi:", error)
        setMessage("❌ Không thể kết nối tới Backend. Bạn đã bật server Python chưa?")
      })
  }, [])

  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <h1>🏥 AURA System</h1>
      <h3>Hệ thống Sàng lọc Sức khỏe Mạch máu Võng mạc</h3>
      
      <div style={{ 
        marginTop: '20px', 
        padding: '20px', 
        border: '2px solid #007bff', 
        borderRadius: '10px' 
      }}>
        <p>Tín hiệu từ Server Python:</p>
        <h2 style={{ color: 'green' }}>{message}</h2>
      </div>
    </div>
  )
}

export default App