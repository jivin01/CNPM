import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Register: React.FC = () => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'patient'|'doctor'>('patient');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const endpoint = role === 'doctor' ? '/api/register/doctor' : '/api/register/user';
      await axios.post(`http://127.0.0.1:8000${endpoint}`, {
        full_name: fullName,
        email,
        password,
      });
      navigate('/login');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Đăng ký thất bại');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
        <h2 className="text-2xl font-bold mb-4">Tạo tài khoản</h2>
        {error && <div className="mb-4 text-red-600">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm">Họ và tên</label>
            <input value={fullName} onChange={(e)=>setFullName(e.target.value)} required className="w-full border p-2 rounded" />
          </div>
          <div>
            <label className="block text-sm">Email</label>
            <input type="email" value={email} onChange={(e)=>setEmail(e.target.value)} required className="w-full border p-2 rounded" />
          </div>
          <div>
            <label className="block text-sm">Mật khẩu</label>
            <input type="password" value={password} onChange={(e)=>setPassword(e.target.value)} required className="w-full border p-2 rounded" />
          </div>
          <div className="flex gap-4">
            <label><input type="radio" checked={role==='patient'} onChange={()=>setRole('patient')} className="mr-2"/> Bệnh nhân</label>
            <label><input type="radio" checked={role==='doctor'} onChange={()=>setRole('doctor')} className="mr-2"/> Bác sĩ</label>
          </div>
          <button className="w-full bg-green-600 text-white py-2 rounded">Tạo tài khoản</button>
        </form>
      </div>
    </div>
  );
};

export default Register;
