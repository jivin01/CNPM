import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom'; // Bỏ BrowserRouter ở đây
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import LandingPage from './pages/LandingPage';

const App: React.FC = () => {
  return (
    // Không dùng BrowserRouter bao quanh ở đây nữa (vì thường main.tsx đã có rồi)
    <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
};

export default App;