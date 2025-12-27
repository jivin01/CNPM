// src/App.tsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import DoctorDashboard from './pages/DoctorDashboard';
import ClinicManagerDashboard from './pages/ClinicManagerDashboard';

// --- Component Menu bên trái ---
const Sidebar = () => {
  const location = useLocation(); // Lấy đường dẫn hiện tại để tô màu menu
  
  const menuItems = [
    { path: '/', label: '👨‍⚕️ Bác sĩ Chẩn đoán' },
    { path: '/manager', label: '🏥 Quản lý Phòng khám & dịch vụ' },
    // Đã xóa mục Gói dịch vụ ở đây
  ];

  return (
    <div className="w-64 bg-slate-900 text-white min-h-screen flex flex-col shadow-xl">
      <div className="p-6 border-b border-slate-800">
        <h1 className="text-2xl font-bold text-blue-400 tracking-wider">AURA AI</h1>
        <p className="text-xs text-slate-400 mt-1">Hệ thống hỗ trợ chẩn đoán</p>
      </div>
      
      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`flex items-center p-3 rounded-lg transition-all duration-200 ${
              location.pathname === item.path 
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50 translate-x-1' 
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <span className="font-medium">{item.label}</span>
          </Link>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-800">
        <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center font-bold">D</div>
            <div>
                <p className="text-sm font-medium">Dr. User</p>
                <p className="text-xs text-green-400">● Online</p>
            </div>
        </div>
      </div>
    </div>
  );
};

// --- Component Chính ghép mọi thứ lại ---
const App: React.FC = () => {
  return (
    <Router>
      <div className="flex flex-row min-h-screen bg-gray-50">
        <Sidebar /> {/* Menu luôn cố định bên trái */}
        
        {/* Nội dung bên phải thay đổi theo Route */}
        <div className="flex-1 h-screen overflow-auto">
          <Routes>
            <Route path="/" element={<DoctorDashboard />} />
            <Route path="/manager" element={<ClinicManagerDashboard />} />
            {/* Đã xóa Route /billing ở đây */}
          </Routes>
        </div>
      </div>
    </Router>
  );
};

export default App;