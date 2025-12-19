import { useState, useEffect } from 'react';
import Patients from './Patients'; // File quản lý bệnh nhân
import Login from './Login';       // File đăng nhập

<<<<<<< HEAD
// 1. THÊM DÒNG NÀY (Import file giao diện lịch hẹn)

import AppointmentManager from './components/Layout/AppointmentManager';

=======
>>>>>>> ab94d6a9e3ad806a03b9d086343a3493e415ece9
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
<<<<<<< HEAD
        // Đã đăng nhập: Hiện cả Bệnh nhân và Lịch hẹn
        <div style={{ paddingBottom: '50px' }}>
            {/* Phần quản lý bệnh nhân cũ */}
            <Patients onLogout={handleLogout} />
            
            {/* 2. THÊM DÒNG NÀY (Hiển thị bảng lịch hẹn xuống dưới) */}
            <AppointmentManager /> 
        </div>
=======
        // Đã đăng nhập: Hiện trang Patients và truyền hàm Logout vào trong
        <Patients onLogout={handleLogout} />
>>>>>>> ab94d6a9e3ad806a03b9d086343a3493e415ece9
      ) : (
        // Chưa đăng nhập: Hiện trang Login
        <Login onLoginSuccess={() => setIsLoggedIn(true)} />
      )}
    </div>
  );
}

export default App;