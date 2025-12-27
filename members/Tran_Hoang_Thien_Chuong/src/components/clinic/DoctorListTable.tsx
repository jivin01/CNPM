// src/components/clinic/DoctorListTable.tsx
import React from 'react';
import { Doctor } from '../../types';

// Dữ liệu giả (Đã thêm trường status)
const mockDoctors: Doctor[] = [
  { id: '1', name: 'Dr. Nguyen Van A', specialization: 'Tim mạch', email: 'a.nguyen@clinic.com', joinedDate: '2024-01-10', totalScans: 154, status: 'Online' },
  { id: '2', name: 'Dr. Tran Thi B', specialization: 'Nhãn khoa', email: 'b.tran@clinic.com', joinedDate: '2024-03-22', totalScans: 89, status: 'Offline' },
  { id: '3', name: 'Dr. Le Van C', specialization: 'Nội tiết', email: 'c.le@clinic.com', joinedDate: '2024-05-15', totalScans: 12, status: 'Busy' },
  { id: '4', name: 'Dr. Pham Minh D', specialization: 'Thần kinh', email: 'd.pham@clinic.com', joinedDate: '2024-06-01', totalScans: 45, status: 'Online' },
];

const DoctorListTable: React.FC = () => {
  
  // Hàm helper để chọn màu cho badge trạng thái
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Online': return 'bg-green-100 text-green-800';
      case 'Offline': return 'bg-gray-100 text-gray-600';
      case 'Busy': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Header của bảng */}
      <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-white">
        <div>
            <h3 className="text-lg font-bold text-gray-800">👨‍⚕️ Danh sách Bác sĩ</h3>
            <p className="text-sm text-gray-500 mt-1">Quản lý đội ngũ y tế của phòng khám</p>
        </div>
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition shadow-sm flex items-center gap-2">
          <span>+</span> Thêm mới
        </button>
      </div>

      {/* Bảng dữ liệu */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead className="bg-gray-50/50 text-gray-500 uppercase text-xs font-semibold">
            <tr>
              <th className="px-6 py-4">Thông tin Bác sĩ</th>
              <th className="px-6 py-4">Chuyên khoa</th>
              <th className="px-6 py-4 text-center">Tổng ca khám</th>
              <th className="px-6 py-4">Trạng thái</th>
              <th className="px-6 py-4 text-right">Hành động</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {mockDoctors.map((doc) => (
              <tr key={doc.id} className="hover:bg-blue-50/50 transition duration-150 group">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    {/* Avatar giả lập bằng chữ cái đầu */}
                    <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm">
                        {doc.name.charAt(4)}
                    </div>
                    <div>
                        <p className="font-semibold text-gray-900">{doc.name}</p>
                        <p className="text-xs text-gray-500">{doc.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                    <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs font-medium">
                        {doc.specialization}
                    </span>
                </td>
                <td className="px-6 py-4 text-center">
                    <span className="font-bold text-gray-800">{doc.totalScans}</span>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold border border-transparent ${getStatusColor(doc.status)}`}>
                    ● {doc.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="text-gray-400 hover:text-blue-600 transition">
                        ✏️
                      </button>
                      <button className="text-gray-400 hover:text-red-600 transition">
                        🗑️
                      </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Footer phân trang (Optional) */}
      <div className="p-4 border-t border-gray-100 bg-gray-50 text-xs text-gray-500 flex justify-between items-center">
          <span>Hiển thị 4 trên 12 kết quả</span>
          <div className="flex gap-1">
              <button className="px-2 py-1 border rounded bg-white hover:bg-gray-100">Trước</button>
              <button className="px-2 py-1 border rounded bg-white hover:bg-gray-100">Sau</button>
          </div>
      </div>
    </div>
  );
};

export default DoctorListTable;