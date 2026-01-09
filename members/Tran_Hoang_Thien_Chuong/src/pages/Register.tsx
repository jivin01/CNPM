import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { registerUser } from '../services/api';

const Register = () => {
  const navigate = useNavigate();
  
  // 1. Sửa formData: Bỏ 'username' vì schema backend không yêu cầu
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    full_name: '',
    role: 'user' 
  });
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    // 2. Gửi đúng formData (Bỏ đoạn code tự thêm username thừa thãi đi)
    try {
      // API chỉ cần: email, password, full_name, role
      await registerUser(formData); 
      
      setSuccess('Đăng ký thành công! Đang chuyển sang trang đăng nhập...');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err: any) {
      console.error(err);
      // Hiển thị lỗi chi tiết hơn nếu có
      const msg = err.response?.data?.detail || 'Đăng ký thất bại. Email có thể đã tồn tại.';
      setError(msg);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold text-center text-blue-600 mb-6">Đăng Ký Tài Khoản</h2>
        
        {error && <div className="bg-red-100 text-red-700 p-2 mb-4 rounded text-sm">{error}</div>}
        {success && <div className="bg-green-100 text-green-700 p-2 mb-4 rounded text-sm">{success}</div>}

        <form onSubmit={handleRegister} className="space-y-4">
          <input name="email" type="email" placeholder="Email" onChange={handleChange} required className="w-full border p-2 rounded" />
          <input name="password" type="password" placeholder="Mật khẩu" onChange={handleChange} required className="w-full border p-2 rounded" />
          <input name="full_name" placeholder="Họ và tên hiển thị" onChange={handleChange} required className="w-full border p-2 rounded" />
          
          {/* PHẦN QUAN TRỌNG: CHỌN QUYỀN (RBAC) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Vai trò của bạn:</label>
            <select 
              name="role" 
              onChange={handleChange} 
              value={formData.role} // Thêm binding value
              className="w-full border p-2 rounded bg-white"
            >
              <option value="user">👨‍🦱 Bệnh nhân (User)</option>
              <option value="doctor">👨‍⚕️ Bác sĩ (Doctor)</option>
              
              {/* --- [SỬA QUAN TRỌNG] Phải khớp y hệt models.py --- */}
              <option value="clinic_manager">🏥 Quản lý Phòng khám (Clinic)</option>
              
              <option value="admin">🔑 Quản trị viên (Admin)</option>
            </select>
          </div>

          <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700">Đăng Ký</button>
        </form>
        
        <p className="mt-4 text-center text-sm">
          Đã có tài khoản? <Link to="/login" className="text-blue-600 font-bold">Đăng nhập</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;