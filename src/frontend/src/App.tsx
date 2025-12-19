import { useState, useEffect } from 'react';
import Patients from './Patients'; // File quản lý bệnh nhân
import Login from './Login';       // File đăng nhập

// 1. THÊM DÒNG NÀY (Import file giao diện lịch hẹn)

import AppointmentManager from './components/Layout/AppointmentManager';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // 1. Kiểm tra chìa khóa (Token) khi mở web
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setIsLoggedIn(true);
    }
  }, []);

  // 2. Hàm xử lý Đăng xuất
  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsLoggedIn(false);
  };

  return (
    <div>
      {isLoggedIn ? (
        // Đã đăng nhập: Hiện cả Bệnh nhân và Lịch hẹn
        <div style={{ paddingBottom: '50px' }}>
            {/* Phần quản lý bệnh nhân cũ */}
            <Patients onLogout={handleLogout} />
            
            {/* 2. THÊM DÒNG NÀY (Hiển thị bảng lịch hẹn xuống dưới) */}
            <AppointmentManager /> 
        </div>
      ) : (
        // Chưa đăng nhập: Hiện trang Login
        <Login onLoginSuccess={() => setIsLoggedIn(true)} />
      )}
    </div>
  );
}

export default App;