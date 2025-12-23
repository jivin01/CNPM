import { useState, useEffect } from 'react';
import Patients from './Patients'; 
import Login from './Login';
// Import Lịch hẹn
import AppointmentManager from './components/Layout/AppointmentManager';
// Import Khám bệnh
import MedicalExam from './components/Layout/MedicalExam';
// Import Quản lý kho thuốc
import MedicineManager from './pages/MedicineManager'; 
// --- MỚI: Import Thu Ngân ---
import BillingManager from './pages/BillingManager';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // 1. Kiểm tra Token khi mở web
  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      setIsLoggedIn(true);
    }
  }, []);

  // 2. Hàm xử lý Đăng xuất
  const handleLogout = () => {
    localStorage.removeItem('access_token');
    setIsLoggedIn(false);
  };

  return (
    <div className="app-container">
      {isLoggedIn ? (
        <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
          {/* HEADER */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h1 style={{ color: '#003eb3' }}>🏥 Hệ Thống Quản Lý Phòng Khám AURA</h1>
            <button 
              onClick={handleLogout}
              style={{ background: '#ff4d4f', color: 'white', border: 'none', padding: '10px 20px', cursor: 'pointer', borderRadius: '6px', fontWeight: 'bold' }}
            >
              Đăng xuất
            </button>
          </div>
          
          <hr style={{ marginBottom: '30px', borderTop: '1px solid #eee' }} />

          {/* DANH SÁCH CÁC CHỨC NĂNG */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
            
            {/* 1. QUẢN LÝ BỆNH NHÂN */}
            <section style={{ border: '1px solid #e6f7ff', padding: '20px', borderRadius: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
              <h2 style={{ color: '#1890ff', borderBottom: '2px solid #1890ff', display: 'inline-block', marginBottom: '15px' }}>
                1. Danh Sách Bệnh Nhân
              </h2>
              <Patients onLogout={handleLogout} />
            </section>

            {/* 2. LỊCH HẸN */}
            <section style={{ border: '1px solid #fff1b8', padding: '20px', borderRadius: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
              <h2 style={{ color: '#faad14', borderBottom: '2px solid #faad14', display: 'inline-block', marginBottom: '15px' }}>
                2. Lịch Hẹn Khám
              </h2>
              <AppointmentManager />
            </section>

            {/* 3. PHÒNG KHÁM (BÁC SĨ) */}
            <section style={{ background: '#f6ffed', padding: '20px', borderRadius: '10px', border: '1px solid #b7eb8f' }}>
               <h2 style={{ color: '#389e0d', borderBottom: '2px solid #389e0d', display: 'inline-block', marginBottom: '15px' }}>
                   3. Phòng Khám Bệnh (Dành cho Bác sĩ)
               </h2>
               <MedicalExam />
            </section>

            {/* 4. QUẢN LÝ KHO THUỐC */}
            <section style={{ background: '#f9f0ff', padding: '20px', borderRadius: '10px', border: '1px solid #d3adf7' }}>
               <h2 style={{ color: '#722ed1', borderBottom: '2px solid #722ed1', display: 'inline-block', marginBottom: '15px' }}>
                   4. Quản Lý Kho Thuốc (Admin/Dược sĩ)
               </h2>
               <p style={{fontStyle: 'italic', color: '#666', marginBottom: '10px'}}>
                 * Tại đây nhập thuốc mới. Số lượng sẽ tự trừ khi Bác sĩ kê đơn ở mục 3.
               </p>
               <MedicineManager />
            </section>

            {/* --- MỚI THÊM: 5. THU NGÂN --- */}
            <section style={{ background: '#fff7e6', padding: '20px', borderRadius: '10px', border: '1px solid #ffd591' }}>
               <h2 style={{ color: '#d46b08', borderBottom: '2px solid #d46b08', display: 'inline-block', marginBottom: '15px' }}>
                   5. Thu Ngân & Hóa Đơn
               </h2>
               <p style={{fontStyle: 'italic', color: '#666', marginBottom: '10px'}}>
                 * Tính tiền đơn thuốc và in hóa đơn cho bệnh nhân.
               </p>
               <BillingManager />
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