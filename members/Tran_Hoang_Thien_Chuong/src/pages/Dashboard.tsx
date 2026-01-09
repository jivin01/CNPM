// src/pages/Dashboard.tsx
import React, { useEffect, useState } from 'react';
import { getOwnMedicalRecords, logoutUser } from '../services/api';
// 1. Import các thành phần vẽ biểu đồ
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface MedicalRecord {
  id: number;
  diagnosis: string;
  treatment: string;
  visit_date: string;
  notes: string;
}

const Dashboard = () => {
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // 2. State lưu dữ liệu cho biểu đồ
  const [chartData, setChartData] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getOwnMedicalRecords();
        setRecords(data);
        // 3. Gọi hàm xử lý dữ liệu biểu đồ ngay khi có data
        processChartData(data);
      } catch (err) {
        console.error(err);
        setError('Không tải được dữ liệu. Vui lòng đăng nhập lại!');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // 4. Hàm xử lý dữ liệu: Đếm số lượng "Bình thường" và "Bệnh lý"
  const processChartData = (data: MedicalRecord[]) => {
    let normalCount = 0;
    let riskCount = 0;

    data.forEach((record) => {
      // Kiểm tra không phân biệt hoa thường
      if (record.diagnosis.toLowerCase().includes('bình thường')) {
        normalCount++;
      } else {
        riskCount++;
      }
    });

    setChartData([
      { name: 'Bình thường', value: normalCount },
      { name: 'Cần chú ý', value: riskCount },
    ]);
  };

  // Màu sắc cho biểu đồ: Xanh lá (Bình thường) - Cam (Nguy cơ)
  const COLORS = ['#10B981', '#F59E0B'];

  return (
    <div className="min-h-screen bg-blue-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8 bg-white p-4 rounded-xl shadow-sm">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-blue-800">📊 Sổ Tay Sức Khỏe</h1>
            <p className="text-slate-500 text-sm">Theo dõi lịch sử và phân tích rủi ro từ AI</p>
          </div>
          <button 
            onClick={logoutUser}
            className="bg-red-50 text-red-600 hover:bg-red-100 px-4 py-2 rounded-lg font-semibold transition border border-red-200"
          >
            Đăng xuất
          </button>
        </div>

        {/* Nội dung chính */}
        {loading ? (
          <div className="text-center py-20 text-blue-600 font-semibold">
             <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-4"></div>
             ⏳ Đang tải dữ liệu hồ sơ...
          </div>
        ) : error ? (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        ) : (
          // Layout Grid: Chia 2 cột (Cột trái: Biểu đồ - Cột phải: Bảng)
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* --- CỘT 1: THỐNG KÊ & BIỂU ĐỒ (Phần mới thêm) --- */}
            <div className="lg:col-span-1 space-y-6">
               {/* Thẻ thống kê số */}
               <div className="bg-white p-5 rounded-xl shadow-sm border border-blue-100">
                  <h3 className="font-bold text-gray-700 mb-3">Tổng quan</h3>
                  <div className="flex justify-between text-center">
                      <div className="bg-blue-50 p-3 rounded-lg w-1/2 mr-2">
                          <p className="text-2xl font-bold text-blue-700">{records.length}</p>
                          <p className="text-xs text-blue-500 font-bold uppercase">Lần khám</p>
                      </div>
                      <div className="bg-green-50 p-3 rounded-lg w-1/2 ml-2">
                          <p className="text-2xl font-bold text-green-700">
                             {chartData.find(d => d.name === 'Bình thường')?.value || 0}
                          </p>
                          <p className="text-xs text-green-500 font-bold uppercase">Bình thường</p>
                      </div>
                  </div>
               </div>

               {/* BIỂU ĐỒ TRÒN */}
               <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 h-80 flex flex-col">
                  <h3 className="font-bold text-gray-700 mb-2">Tỷ lệ sức khỏe</h3>
                  {records.length > 0 ? (
                    <div className="flex-1 w-full h-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={chartData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {chartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend verticalAlign="bottom" height={36}/>
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="flex-1 flex items-center justify-center text-gray-400 italic">
                        Chưa có dữ liệu
                    </div>
                  )}
               </div>
            </div>

            {/* --- CỘT 2: BẢNG DỮ LIỆU (Code cũ của bạn chuyển sang đây) --- */}
            <div className="lg:col-span-2">
              <div className="bg-white shadow-lg rounded-xl overflow-hidden border border-gray-100 h-full">
                <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                    <h2 className="font-bold text-gray-700">📜 Lịch sử khám chi tiết</h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-blue-600 text-white text-sm uppercase">
                        <th className="px-6 py-4 font-semibold">Ngày khám</th>
                        <th className="px-6 py-4 font-semibold">Kết quả AI</th>
                        <th className="px-6 py-4 font-semibold">Lời khuyên</th>
                      </tr>
                    </thead>
                    <tbody className="text-gray-700 text-sm">
                      {records.length === 0 ? (
                        <tr>
                          <td colSpan={3} className="text-center py-8 text-gray-400 italic bg-gray-50">
                            Bạn chưa có hồ sơ nào.
                          </td>
                        </tr>
                      ) : (
                        // Đảo ngược mảng để hiện cái mới nhất lên đầu (slice().reverse())
                        records.slice().reverse().map((record, index) => (
                          <tr key={record.id} className={`border-b border-gray-100 hover:bg-blue-50 transition ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                            <td className="px-6 py-4 font-medium whitespace-nowrap">{record.visit_date}</td>
                            <td className="px-6 py-4">
                              <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold border 
                                ${record.diagnosis.toLowerCase().includes("bình thường") 
                                  ? 'bg-green-100 text-green-700 border-green-200' 
                                  : 'bg-orange-100 text-orange-700 border-orange-200'}`}>
                                <span className={`w-2 h-2 rounded-full ${record.diagnosis.toLowerCase().includes("bình thường") ? 'bg-green-500' : 'bg-orange-500'}`}></span>
                                {record.diagnosis}
                              </span>
                            </td>
                            <td className="px-6 py-4 max-w-xs truncate" title={record.treatment}>{record.treatment}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;