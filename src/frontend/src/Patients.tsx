import { useState, useEffect } from 'react';
import axios from 'axios';

// Định nghĩa dữ liệu
interface Patient {
  id: number;
  full_name: string;
  phone: string;
  birth_year: number;
  gender: string;
  address?: string;
  medical_history: string;
}

interface PatientsProps {
  onLogout: () => void;
}

export default function Patients({ onLogout }: PatientsProps) {
  const [patients, setPatients] = useState<Patient[]>([]);
  
  // Biến cho Form
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [birthYear, setBirthYear] = useState('');
  const [gender, setGender] = useState('Nam');
  const [address, setAddress] = useState('');
  const [history, setHistory] = useState('');

  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);

  // Tải danh sách
  const fetchPatients = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:8000/api/patients', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPatients(response.data);
    } catch (error) {
      console.error("Lỗi tải danh sách:", error);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  // Xử lý Thêm / Sửa
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    const headers = { Authorization: `Bearer ${token}` };
    
    const data = {
      full_name: fullName,
      phone: phone,
      birth_year: Number(birthYear),
      gender: gender,
      address: address,
      medical_history: history,
    };

    try {
      if (editingId) {
        await axios.put(`http://localhost:8000/api/patients/${editingId}`, data, { headers });
        alert("✅ Đã cập nhật thành công!");
        setEditingId(null); 
      } else {
        await axios.post('http://localhost:8000/api/patients', data, { headers });
        alert("✅ Thêm mới thành công!");
      }
      resetForm();     
      fetchPatients(); 
    } catch (error) {
      alert("❌ Có lỗi xảy ra! Kiểm tra lại kết nối.");
    }
  };

  // --- HÀM XÓA ---
  const handleDelete = async (id: number) => {
    if (!window.confirm("⚠️ CẢNH BÁO: Bạn có chắc chắn muốn xóa hồ sơ này không?")) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:8000/api/patients/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert("🗑️ Đã xóa hồ sơ thành công!");
      fetchPatients(); 
    } catch (error) {
      alert("Lỗi: Không thể xóa được!");
    }
  };

  // Đổ dữ liệu lên form để sửa
  const handleEditClick = (p: Patient) => {
    setEditingId(p.id);
    setFullName(p.full_name);
    setPhone(p.phone);
    setBirthYear(p.birth_year.toString());
    setGender(p.gender);
    setAddress(p.address || '');
    setHistory(p.medical_history);
  };

  const resetForm = () => {
    setEditingId(null);
    setFullName('');
    setPhone('');
    setBirthYear('');
    setAddress('');
    setHistory('');
  };

  // Lọc tìm kiếm
  const filteredPatients = patients.filter(p => 
    p.full_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.phone.includes(searchTerm)
  );

  return (
    <div className="flex h-screen bg-gray-100">
      {/* CỘT TRÁI: FORM */}
      <div className="w-1/3 bg-white p-6 shadow-xl border-r overflow-y-auto">
        <h2 className={`text-xl font-bold mb-4 ${editingId ? 'text-orange-600' : 'text-blue-600'}`}>
          {editingId ? "✏️ ĐANG SỬA HỒ SƠ" : "➕ THÊM HỒ SƠ MỚI"}
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-3">
          <input className="w-full p-2 border rounded" placeholder="Họ và Tên (*)" required value={fullName} onChange={e => setFullName(e.target.value)} />
          
          <div className="flex gap-2">
            <select className="w-1/3 p-2 border rounded" value={gender} onChange={e => setGender(e.target.value)}>
              <option>Nam</option>
              <option>Nữ</option>
            </select>
            <input className="w-2/3 p-2 border rounded" type="number" placeholder="Năm sinh" required value={birthYear} onChange={e => setBirthYear(e.target.value)} />
          </div>

          <input className="w-full p-2 border rounded" placeholder="Số điện thoại (*)" required value={phone} onChange={e => setPhone(e.target.value)} />
          <input className="w-full p-2 border rounded" placeholder="Địa chỉ" value={address} onChange={e => setAddress(e.target.value)} />
          <textarea className="w-full p-2 border rounded h-24" placeholder="Tiền sử bệnh..." value={history} onChange={e => setHistory(e.target.value)}></textarea>
          
          <div className="flex gap-2 mt-4">
             <button type="submit" className={`flex-1 py-2 rounded text-white font-bold shadow ${editingId ? 'bg-orange-500 hover:bg-orange-600' : 'bg-blue-600 hover:bg-blue-700'}`}>
               {editingId ? "Lưu Thay Đổi" : "Thêm Mới"}
             </button>
             {editingId && (
               <button type="button" onClick={resetForm} className="px-4 py-2 bg-gray-400 text-white rounded hover:bg-gray-500">
                 Hủy
               </button>
             )}
          </div>
        </form>
      </div>

      {/* CỘT PHẢI: DANH SÁCH */}
      <div className="w-2/3 p-6 flex flex-col">
        <div className="flex justify-between items-center mb-6 bg-white p-4 rounded shadow-sm">
          <h1 className="text-2xl font-bold text-blue-800">🏥 QUẢN LÝ BỆNH NHÂN</h1>
          <button onClick={onLogout} className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded font-medium flex items-center gap-2">
            🚪 Đăng xuất
          </button>
        </div>

        <div className="flex gap-2 mb-4">
          <input 
            type="text" 
            placeholder="🔍 Nhập tên hoặc số điện thoại để tìm..." 
            className="flex-1 p-3 border rounded shadow-sm focus:ring-2 focus:ring-blue-400 outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button className="bg-blue-600 text-white px-6 py-2 rounded shadow font-bold">Tìm</button>
        </div>

        <div className="bg-white rounded shadow-md overflow-hidden flex-1 overflow-y-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-blue-50 text-blue-800 sticky top-0">
              <tr>
                <th className="p-3 border-b">ID</th>
                <th className="p-3 border-b">Họ Tên</th>
                <th className="p-3 border-b">Tuổi/Giới tính</th>
                <th className="p-3 border-b">SĐT</th>
                
                {/* --- ĐÃ THÊM CỘT ĐỊA CHỈ VÀ TIỀN SỬ BỆNH --- */}
                <th className="p-3 border-b">Địa chỉ</th>
                <th className="p-3 border-b">Tiền sử bệnh</th>
                
                <th className="p-3 border-b text-center">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {filteredPatients.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50 border-b last:border-0">
                  <td className="p-3 font-mono text-gray-500">#{p.id}</td>
                  <td className="p-3 font-semibold text-gray-800">{p.full_name}</td>
                  <td className="p-3">
                    <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full mr-1">
                      {new Date().getFullYear() - p.birth_year} tuổi
                    </span>
                    <span className="text-gray-600">{p.gender}</span>
                  </td>
                  <td className="p-3 text-blue-600 font-medium">{p.phone}</td>

                  {/* --- ĐÃ THÊM DỮ LIỆU ĐỊA CHỈ VÀ TIỀN SỬ BỆNH --- */}
                  <td className="p-3 text-gray-700">{p.address}</td>
                  <td className="p-3 text-gray-600 italic">{p.medical_history}</td>

                  <td className="p-3 text-center space-x-2">
                    <button 
                      onClick={() => handleEditClick(p)}
                      className="text-orange-500 hover:text-orange-700 font-medium px-2 py-1 border border-orange-200 rounded hover:bg-orange-50"
                    >
                      ✏️ Sửa
                    </button>
                    <button 
                      onClick={() => handleDelete(p.id)}
                      className="text-red-500 hover:text-red-700 font-medium px-2 py-1 border border-red-200 rounded hover:bg-red-50"
                    >
                      🗑️ Xóa
                    </button>
                  </td>
                </tr>
              ))}
              {filteredPatients.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-gray-400 italic">
                    Không tìm thấy bệnh nhân nào...
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}