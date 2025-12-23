import { useState } from 'react';

interface LoginProps {
  onLoginSuccess: () => void;
}

export default function Login({ onLoginSuccess }: LoginProps) {
  // Bố đổi tên biến 'username' thành 'email' cho đúng chuẩn backend nhé
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [role, setRole] = useState<'patient'|'doctor'>('patient');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      // --- PHẦN QUAN TRỌNG ĐÃ SỬA ---
      // Backend của con mong đợi JSON: { "email": "...", "password": "..." }
      
      const endpoint = role === 'doctor' ? 'http://localhost:8000/api/login/doctor' : 'http://localhost:8000/api/login/user'
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json' // <--- Phải là JSON
        },
        body: JSON.stringify({
            email: email,       // Gửi đúng tên trường là 'email'
            password: password
        }),
      });
      // -------------------------------

      if (response.ok) {
        const data = await response.json();
        // Lưu token vào localStorage
        localStorage.setItem('access_token', data.access_token);
        console.log("Đăng nhập thành công!", data);
        onLoginSuccess(); 
      } else {
        // Nếu lỗi 401 hoặc 422 thì báo sai
        setError('Sai Email hoặc Mật khẩu!');
      }
    } catch (err) {
      console.error(err);
      setError('Lỗi kết nối server! (Kiểm tra lại Backend đã bật chưa?)');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-lg w-96">
        <h2 className="text-2xl font-bold text-center text-blue-600 mb-6">AURA LOGIN</h2>
        <div className="flex items-center justify-center gap-4 mb-4">
          <label className="inline-flex items-center">
            <input type="radio" name="role" value="patient" checked={role==='patient'} onChange={()=>setRole('patient')} className="mr-2" /> Bệnh nhân
          </label>
          <label className="inline-flex items-center">
            <input type="radio" name="role" value="doctor" checked={role==='doctor'} onChange={()=>setRole('doctor')} className="mr-2" /> Bác sĩ
          </label>
        </div>
        {error && <div className="bg-red-100 text-red-700 p-2 rounded mb-4 text-sm font-medium text-center">{error}</div>}
        
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input 
              type="email" 
              placeholder="Ví dụ: admin@gmail.com"
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <input 
              type="password" 
              placeholder="Nhập mật khẩu..."
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 font-bold transition-colors">
            Đăng Nhập Ngay
          </button>
        </form>
      </div>
    </div>
  );
}