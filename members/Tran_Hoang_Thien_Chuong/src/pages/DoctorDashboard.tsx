import React from 'react';
import DiagnosisEditor from '../components/doctor/DiagnosisEditor';
import { DiagnosisResult } from '../types';

// Dữ liệu giả lập (Mock Data) để test giao diện
const mockData: DiagnosisResult = {
  id: 'SCAN-001',
  // Sửa dòng này
  imageUrl: 'https://img.freepik.com/free-photo/eye-retina-scan-screen-medical-technology_53876-102029.jpg', // Ảnh võng mạc mẫu
  aiRiskScore: 85,
  aiFinding: 'Phát hiện tổn thương vi mạch và dấu hiệu xuất huyết nhẹ vùng hoàng điểm.',
  isVerified: false,
  status: 'pending'
};

const DoctorDashboard: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">🩺 Bác sĩ: Dr. Nguyen Van A</h1>
        <p className="text-gray-600">Hệ thống hỗ trợ chẩn đoán AURA (SP26SE025)</p>
      </header>
      
      <main>
        <div className="bg-white p-4 rounded-lg shadow mb-6">
           <h2 className="text-xl font-semibold mb-4 border-l-4 border-blue-500 pl-3">Ca bệnh cần duyệt: #SCAN-001</h2>
           {/* Gọi Component Editor ra đây */}
           <DiagnosisEditor 
              initialData={mockData} 
              onSave={(data) => console.log("Lưu dữ liệu:", data)} 
           />
        </div>
      </main>
    </div>
  );
};

export default DoctorDashboard;