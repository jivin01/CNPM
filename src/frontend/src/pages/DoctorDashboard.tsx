import React, { useEffect, useState } from 'react';
import axios from 'axios';

type AIRecord = {
  id: number;
  patient_id: number;
  image_path: string;
  result_json: string;
  status: string;
};

const DoctorDashboard: React.FC = () => {
  const [list, setList] = useState<AIRecord[]>([]);
  const [prescribeText, setPrescribeText] = useState('');
  const [message, setMessage] = useState('');

  const fetchPending = async () => {
    const token = localStorage.getItem('access_token');
    const res = await axios.get('http://127.0.0.1:8000/api/ai/pending', { headers: { Authorization: `Bearer ${token}` } });
    setList(res.data);
  };

  useEffect(()=>{ fetchPending(); },[]);

  const handlePrescribe = async (id: number) => {
    const token = localStorage.getItem('access_token');
    try {
      const res = await axios.post(`http://127.0.0.1:8000/api/ai/${id}/prescribe`, { prescription: prescribeText }, { headers: { Authorization: `Bearer ${token}` } });
      setMessage('Đã lưu đơn: ' + JSON.stringify(res.data));
      fetchPending();
    } catch (err: any) {
      setMessage(err.response?.data?.detail || 'Lỗi khi kê đơn');
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-4">Bảng điều khiển Bác sĩ</h2>
      <div className="mb-4">{message}</div>
      <div>
        {list.length === 0 && <div>Không có kết quả AI mới.</div>}
        {list.map(item => (
          <div key={item.id} className="border p-4 rounded mb-3">
            <div><strong>AI ID:</strong> {item.id} — <strong>Patient:</strong> {item.patient_id}</div>
            <div className="mt-2"><strong>Kết quả AI:</strong> {item.result_json}</div>
            <div className="mt-2">
              <textarea value={prescribeText} onChange={(e)=>setPrescribeText(e.target.value)} className="w-full border p-2" placeholder="Nhập đơn thuốc ở đây"></textarea>
              <button onClick={()=>handlePrescribe(item.id)} className="mt-2 bg-green-600 text-white py-1 px-3 rounded">Lưu đơn</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DoctorDashboard;
