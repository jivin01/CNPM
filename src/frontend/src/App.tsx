import { useState, useEffect } from 'react';
import Patients from './Patients'; // File quản lý bệnh nhân
import Login from './Login';       // File đăng nhập

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
        // Đã đăng nhập: Hiện trang Patients và truyền hàm Logout vào trong
        <Patients onLogout={handleLogout} />
      ) : (
        // Chưa đăng nhập: Hiện trang Login
        <Login onLoginSuccess={() => setIsLoggedIn(true)} />
      )}
    </div>
  );
}

export default App;