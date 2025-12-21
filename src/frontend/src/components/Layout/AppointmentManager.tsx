import { useState, useEffect } from 'react';
import axios from 'axios';

// Định nghĩa kiểu dữ liệu cho Typescript hiểu
interface Appointment {
  id: number;
  patient_id: number;
  doctor_id: number;
  appointment_time: string;
  status: string;
}

interface User {
  id: number;
  full_name: string;
  role: string;
}

interface Patient {
  id: number;
  full_name: string;
}

const AppointmentManager = () => {
  // Khai báo các biến lưu trữ dữ liệu
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<User[]>([]);
  
  // Dữ liệu form đặt lịch
  const [formData, setFormData] = useState({
    patient_id: '',
    doctor_id: '',
    appointment_time: '',
    reason: ''
  });

  const [message, setMessage] = useState('');

  // Khi mở trang lên thì tải dữ liệu ngay
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const token = localStorage.getItem('token'); 
      const config = { headers: { Authorization: `Bearer ${token}` } };
      
      // 1. Lấy danh sách bệnh nhân
      const pRes = await axios.get('http://127.0.0.1:8000/api/patients', config);
      setPatients(pRes.data);

      // 2. Lấy danh sách bác sĩ (Lọc chỉ lấy role doctor)
      const uRes = await axios.get('http://127.0.0.1:8000/api/users', config);
      setDoctors(uRes.data.filter((u: any) => u.role === 'doctor'));

      // 3. Lấy danh sách lịch hẹn
      const aRes = await axios.get('http://127.0.0.1:8000/api/appointments', config);
      setAppointments(aRes.data);
    } catch (error) {
      console.error("Lỗi tải dữ liệu:", error);
    }
  };

  const handleBook = async () => {
    setMessage("⏳ Đang xử lý...");
    try {
      const token = localStorage.getItem('access_token');
      // Gửi yêu cầu đặt lịch
      await axios.post('http://127.0.0.1:8000/api/appointments', formData, {
         headers: { Authorization: `Bearer ${token}` }
      });
      
      setMessage("✅ Đặt lịch thành công!");
      loadData(); // Tải lại bảng danh sách
    } catch (error: any) {
      // Bắt lỗi từ Backend (ví dụ: Trùng lịch)
      if (error.response && error.response.data.detail) {
        setMessage("❌ " + error.response.data.detail);
      } else {
        setMessage("❌ Lỗi kết nối server!");
      }
    }
  };

  return (
    <div style={{ padding: '20px', borderTop: '2px solid #eee', marginTop: '20px' }}>
      <h2 style={{ color: '#2563eb', fontSize: '24px', marginBottom: '20px' }}>📅 QUẢN LÝ LỊCH HẸN</h2>
      
      {/* KHUNG ĐẶT LỊCH */}
      <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '8px', marginBottom: '20px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
            <div>
                <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>Chọn Bệnh Nhân:</label>
                <select 
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                  onChange={e => setFormData({...formData, patient_id: e.target.value})}
                >
                    <option value="">-- Chọn bệnh nhân --</option>
                    {patients.map(p => (
                        <option key={p.id} value={p.id}>{p.full_name}</option>
                    ))}
                </select>
            </div>
            <div>
                <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>Chọn Bác Sĩ:</label>
                <select 
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                  onChange={e => setFormData({...formData, doctor_id: e.target.value})}
                >
                    <option value="">-- Chọn bác sĩ --</option>
                    {doctors.map(d => (
                        <option key={d.id} value={d.id}>{d.full_name}</option>
                    ))}
                </select>
            </div>
        </div>

        <div style={{ marginBottom: '15px' }}>
            <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>Ngày giờ khám:</label>
            <input 
              type="datetime-local" 
              style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
              onChange={e => setFormData({...formData, appointment_time: e.target.value})}
            />
        </div>

        <button 
          onClick={handleBook}
          style={{ 
            background: '#16a34a', color: 'white', padding: '10px 20px', 
            border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' 
          }}
        >
          ĐẶT LỊCH NGAY
        </button>

        {/* Hiển thị thông báo lỗi/thành công */}
        {message && <p style={{ marginTop: '10px', fontWeight: 'bold', color: message.includes('✅') ? 'green' : 'red' }}>{message}</p>}
      </div>

      {/* DANH SÁCH LỊCH HẸN */}
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
            <tr style={{ background: '#e2e8f0' }}>
                <th style={{ padding: '10px', border: '1px solid #cbd5e1' }}>ID</th>
                <th style={{ padding: '10px', border: '1px solid #cbd5e1' }}>Giờ khám</th>
                <th style={{ padding: '10px', border: '1px solid #cbd5e1' }}>Trạng thái</th>
            </tr>
        </thead>
        <tbody>
            {appointments.map(a => (
                <tr key={a.id}>
                    <td style={{ padding: '10px', border: '1px solid #cbd5e1', textAlign: 'center' }}>{a.id}</td>
                    <td style={{ padding: '10px', border: '1px solid #cbd5e1' }}>{new Date(a.appointment_time).toLocaleString()}</td>
                    <td style={{ padding: '10px', border: '1px solid #cbd5e1', textAlign: 'center' }}>
                        <span style={{ background: '#dbeafe', color: '#1e40af', padding: '2px 8px', borderRadius: '10px', fontSize: '12px' }}>
                            {a.status}
                        </span>
                    </td>
                </tr>
            ))}
        </tbody>
      </table>
    </div>
  );
};

export default AppointmentManager;