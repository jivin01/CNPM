// src/pages/PatientDashboard.tsx
import React, { useEffect, useState } from 'react';
import { getOwnMedicalRecords, logoutUser } from '../services/api';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// Cấu hình đường dẫn ảnh từ Backend (Thay đổi port nếu backend của bạn khác 8000)
const API_BASE_URL = 'http://localhost:8000'; 

interface MedicalRecord {
  id: number;
  diagnosis: string;
  treatment: string;
  visit_date: string;
  image_url: string; // Thêm trường này để nhận link ảnh
}

const PatientDashboard = () => {
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRecord, setSelectedRecord] = useState<MedicalRecord | null>(null);
  const [chartData, setChartData] = useState<any[]>([]);

  // ... (Giữ nguyên phần useEffect và fetchData như cũ) ...
  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getOwnMedicalRecords();
        setRecords(data);
        processChartData(data);
      } catch (err) {
        console.error("Lỗi tải dữ liệu:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const processChartData = (data: MedicalRecord[]) => {
    let normalCount = 0;
    let riskCount = 0;
    data.forEach((record) => {
      if (record.diagnosis.toLowerCase().includes('bình thường')) normalCount++;
      else riskCount++;
    });
    setChartData([
      { name: 'Bình thường', value: normalCount },
      { name: 'Cần theo dõi', value: riskCount },
    ]);
  };
  
  const COLORS = ['#10B981', '#F59E0B'];

  // Hàm xử lý link ảnh (đề phòng link bị lỗi hoặc thiếu)
  const getImageUrl = (path: string) => {
    if (!path) return 'https://via.placeholder.com/300x200?text=No+Image'; // Ảnh thế mạng
    if (path.startsWith('http')) return path;
    // Nối chuỗi nếu backend chỉ trả về tên file (ví dụ: "uploads/anh1.jpg")
    return `${API_BASE_URL}/${path}`;
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 relative">
      <div className="max-w-7xl mx-auto">
        {/* Header - Giữ nguyên */}
        <div className="flex justify-between items-center mb-8 bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
          <h1 className="text-2xl font-bold text-slate-800">📊 Sổ Tay Sức Khỏe</h1>
          <button onClick={logoutUser} className="text-red-600 border px-4 py-2 rounded-lg hover:bg-red-50">Đăng xuất</button>
        </div>

        {/* Body chính - Giữ nguyên layout hiển thị bảng */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Cột Trái: Biểu đồ (Giữ nguyên code cũ của bạn hoặc copy lại từ bài trước nếu mất) */}
            <div className="lg:col-span-4 bg-white p-6 rounded-2xl shadow-sm h-96">
                <h3 className="font-bold text-slate-700 mb-2">Tỷ lệ sức khỏe</h3>
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie data={chartData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                            {chartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip />
                        <Legend verticalAlign="bottom" />
                    </PieChart>
                </ResponsiveContainer>
            </div>

            {/* Cột Phải: Danh sách (Giữ nguyên) */}
            <div className="lg:col-span-8 bg-white rounded-2xl shadow-sm overflow-hidden">
                <div className="p-4 border-b bg-slate-50 font-bold text-slate-700">📜 Lịch sử khám bệnh</div>
                <div className="overflow-y-auto h-[500px]">
                    <table className="w-full text-left">
                        <thead className="bg-slate-100 text-slate-500 sticky top-0">
                            <tr>
                                <th className="p-4">Ngày khám</th>
                                <th className="p-4">Chẩn đoán</th>
                                <th className="p-4">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody>
                            {records.map((record) => (
                                <tr key={record.id} className="border-b hover:bg-slate-50">
                                    <td className="p-4">{record.visit_date}</td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded text-xs font-bold ${
                                            record.diagnosis.toLowerCase().includes('bình thường') ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                                        }`}>
                                            {record.diagnosis}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        <button 
                                            onClick={() => setSelectedRecord(record)}
                                            className="text-blue-600 hover:underline font-medium"
                                        >
                                            Xem chi tiết
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
      </div>

      {/* --- POPUP CHI TIẾT (ĐÃ NÂNG CẤP ĐỂ HIỆN ẢNH) --- */}
      {selectedRecord && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row animate-fade-in-up max-h-[90vh]">
                
                {/* PHẦN 1: HÌNH ẢNH (Cột bên trái) */}
                <div className="md:w-1/2 bg-black flex items-center justify-center p-4 relative">
                    <img 
                        src={getImageUrl(selectedRecord.image_url)} 
                        alt="Medical X-Ray" 
                        className="max-h-[60vh] md:max-h-full object-contain rounded-lg border border-slate-700"
                        onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x300?text=Image+Not+Found';
                        }}
                    />
                    <span className="absolute bottom-4 left-4 bg-black/70 text-white text-xs px-2 py-1 rounded">
                        ID: #{selectedRecord.id}
                    </span>
                </div>

                {/* PHẦN 2: THÔNG TIN (Cột bên phải) */}
                <div className="md:w-1/2 flex flex-col">
                    <div className="p-6 border-b flex justify-between items-center bg-slate-50">
                        <div>
                            <h3 className="text-xl font-bold text-slate-800">Kết quả phân tích AI</h3>
                            <p className="text-sm text-slate-500">{selectedRecord.visit_date}</p>
                        </div>
                        <button onClick={() => setSelectedRecord(null)} className="text-slate-400 hover:text-red-500 text-2xl">
                            &times;
                        </button>
                    </div>
                    
                    <div className="p-6 space-y-6 flex-1 overflow-y-auto">
                        {/* Kết quả chẩn đoán */}
                        <div>
                            <label className="text-xs font-bold text-slate-400 uppercase">Chẩn đoán</label>
                            <div className={`mt-2 p-4 rounded-xl border-l-4 text-lg font-bold ${
                                selectedRecord.diagnosis.toLowerCase().includes('bình thường') 
                                ? 'bg-emerald-50 border-emerald-500 text-emerald-700' 
                                : 'bg-amber-50 border-amber-500 text-amber-700'
                            }`}>
                                {selectedRecord.diagnosis}
                            </div>
                        </div>

                        {/* Lời khuyên */}
                        <div>
                            <label className="text-xs font-bold text-slate-400 uppercase">Lời khuyên / Phác đồ</label>
                            <div className="mt-2 bg-slate-50 p-4 rounded-xl text-slate-700 border border-slate-200 min-h-[100px]">
                                {selectedRecord.treatment 
                                    ? selectedRecord.treatment 
                                    : <span className="italic text-slate-400">Chưa có lời khuyên từ bác sĩ.</span>
                                }
                            </div>
                        </div>
                    </div>

                    <div className="p-4 border-t bg-slate-50 text-right">
                        <button 
                            onClick={() => setSelectedRecord(null)}
                            className="px-6 py-2 bg-white border border-slate-300 rounded-lg hover:bg-slate-100"
                        >
                            Đóng
                        </button>
                    </div>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default PatientDashboard;