import { useState, useEffect } from 'react';
import Patients from './Patients'; 
import Login from './Login';
// Import Lịch hẹn (Nhiệm vụ Người 3)
import AppointmentManager from './components/Layout/AppointmentManager';
import MedicalExam from './components/Layout/MedicalExam';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // 1. Kiểm tra Token khi mở web
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
    <div className="app-container">
      {isLoggedIn ? (
        <div style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h1>Hệ Thống Quản Lý Phòng Khám</h1>
            <button 
              onClick={handleLogout}
              style={{ background: '#ff4d4f', color: 'white', border: 'none', padding: '8px 16px', cursor: 'pointer', borderRadius: '4px' }}
            >
              Đăng xuất
            </button>
          </div>
          
          <hr style={{ margin: '20px 0' }} />

          {/* HIỂN THỊ CÁC KHỐI CHỨC NĂNG */}
          <div style={{ display: 'grid', gap: '30px' }}>
            
            {/* 1. Quản lý bệnh nhân */}
            <section>
              <h2 style={{ color: '#1890ff' }}>1. Danh Sách Bệnh Nhân</h2>
              <Patients onLogout={handleLogout} />
            </section>

            {/* 2. Quản lý lịch hẹn (Nhiệm vụ Người 3) */}
            <section>
              <h2 style={{ color: '#1890ff' }}>2. Lịch Hẹn Khám</h2>
              <AppointmentManager />
            </section>

            {/* 2. KHÁM BỆNH (TÍNH NĂNG MỚI) */}
    <section style={{ background: '#f6ffed', padding: '20px', borderRadius: '8px', border: '1px solid #b7eb8f' }}>
        <h2 style={{ color: '#389e0d', borderBottom: '1px solid #d9f7be', paddingBottom: '10px' }}>
           2. Phòng Khám Bệnh (Dành cho Bác sĩ)
        </h2>
        <MedicalExam />
    </section>
          </div>
        </div>
      ) : (
        <Login onLoginSuccess={() => setIsLoggedIn(true)} />
      )}
    </div>
  );
}

export default App;