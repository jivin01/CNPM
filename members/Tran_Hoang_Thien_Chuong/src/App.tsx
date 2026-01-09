import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';

import DoctorDashboard from './pages/DoctorDashboard';
import ClinicManagerDashboard from './pages/ClinicManagerDashboard';
import PatientDashboard from './pages/PatientDashboard';
import Upload from './pages/Upload'; 
import Login from './pages/Login';
import Register from './pages/Register';

const Sidebar = () => {
  const location = useLocation();
  const [role, setRole] = useState<string | null>(localStorage.getItem('role'));

  useEffect(() => {
    const interval = setInterval(() => {
      const currentRole = localStorage.getItem('role');
      if (currentRole !== role) setRole(currentRole);
    }, 500);
    return () => clearInterval(interval);
  }, [role]);

  let menuItems: { path: string; label: string; icon: string }[] = [];

  if (role === 'doctor') {
    menuItems = [
      { path: '/doctor-dashboard', label: 'Duyệt Bệnh Án', icon: '👨‍⚕️' },
      
    ];
  } else if (role === 'clinic_manager') {
    menuItems = [
      { path: '/manager', label: 'Quản Lý Phòng Khám', icon: '🏥' },
    ];
  } else {
    menuItems = [
      { path: '/upload', label: 'Tải Ảnh Khám', icon: '📸' },
      { path: '/patients', label: 'Sổ Tay Sức Khỏe', icon: '📊' },
    ];
  }

  return (
    <div className="w-64 bg-slate-900 text-white min-h-screen flex flex-col shadow-xl">
      <div className="p-6 border-b border-slate-800 flex items-center gap-3">
        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-bold">A</div>
        <h1 className="text-xl font-bold tracking-wide">AURA AI</h1>
      </div>
      <nav className="flex-1 p-4 space-y-2 mt-2">
        {menuItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
              location.pathname === item.path ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <span className="text-xl">{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </nav>
      <div className="p-4 border-t border-slate-800">
        <button 
          onClick={() => { localStorage.clear(); window.location.href = '/login'; }}
          className="w-full p-2 text-sm text-red-400 hover:bg-red-900/20 rounded-lg transition"
        >
          🚪 Đăng xuất
        </button>
      </div>
    </div>
  );
};

const MainLayout = () => {
  const location = useLocation();
  const role = localStorage.getItem('role');
  const hideSidebar = ['/login', '/register'].includes(location.pathname);

  const HomeRedirect = () => {
    if (role === 'doctor') return <Navigate to="/doctor-dashboard" replace />;
    if (role === 'clinic_manager') return <Navigate to="/manager" replace />;
    if (role) return <Navigate to="/upload" replace />;
    return <Navigate to="/login" replace />;
  };

  return (
    <div className="flex flex-row min-h-screen bg-gray-50">
      {!hideSidebar && <Sidebar />}
      <div className="flex-1 h-screen overflow-auto">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/doctor-dashboard" element={<DoctorDashboard />} />
          <Route path="/patients" element={<PatientDashboard />} />
          <Route path="/upload" element={<Upload />} />
          <Route path="/manager" element={<ClinicManagerDashboard />} />
          <Route path="/" element={<HomeRedirect />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </div>
    </div>
  );
};

const App: React.FC = () => (
  <Router>
    <MainLayout />
  </Router>
);

export default App;