import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

const parseJwt = (token: string) => {
  try { return JSON.parse(atob(token.split('.')[1])); } 
  catch (e) { return null; }
};

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const formData = new URLSearchParams();
    formData.append('username', email);
    formData.append('password', password);

    try {
      const response = await axios.post('http://127.0.0.1:8000/token', formData);
      const { access_token } = response.data;
      
      localStorage.setItem('token', access_token);
      const decoded = parseJwt(access_token);
      const role = decoded?.role || 'patient';
      localStorage.setItem('role', role);

      // Điều hướng ngay lập tức dựa trên role
      if (role === 'doctor') navigate('/doctor-dashboard');
      else if (role === 'clinic_manager') navigate('/manager');
      else navigate('/upload');

    } catch (err: any) {
      setError('Email hoặc mật khẩu không chính xác.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-100 p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md">
        <h2 className="text-3xl font-bold text-center text-blue-700 mb-8">AURA AI Login</h2>
        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input type="email" value={email} onChange={(e)=>setEmail(e.target.value)} className="w-full p-3 border rounded-xl mt-1 focus:ring-2 focus:ring-blue-500 outline-none" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Mật khẩu</label>
            <input type="password" value={password} onChange={(e)=>setPassword(e.target.value)} className="w-full p-3 border rounded-xl mt-1 focus:ring-2 focus:ring-blue-500 outline-none" required />
          </div>
          {error && <p className="text-red-500 text-sm bg-red-50 p-2 rounded-lg">{error}</p>}
          <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white p-3 rounded-xl font-bold hover:bg-blue-700 transition">
            {loading ? 'Đang xác thực...' : 'Đăng Nhập'}
          </button>
        </form>
        <p className="mt-6 text-center text-gray-600 text-sm">Chưa có tài khoản? <Link to="/register" className="text-blue-600 font-bold">Đăng ký</Link></p>
      </div>
    </div>
  );
};

export default Login;