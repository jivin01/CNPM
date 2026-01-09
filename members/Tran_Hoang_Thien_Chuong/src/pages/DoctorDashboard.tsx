import React, { useEffect, useState } from 'react';
import { getPatients, getPatientRecords, updateTreatment, logoutUser } from '../services/api';

// Đường dẫn ảnh từ Backend (Cần khớp với Backend của bạn)
const API_BASE_URL = 'http://localhost:8000';

interface Patient {
  id: number;
  full_name: string;
  age: number;
  gender: string;
  email: string;
}

interface MedicalRecord {
  id: number;
  diagnosis: string;
  treatment: string;
  visit_date: string;
  image_url: string;
  notes: string;
}

const DoctorDashboard = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  
  // State xử lý Popup kê đơn
  const [editingRecord, setEditingRecord] = useState<MedicalRecord | null>(null);
  const [newTreatment, setNewTreatment] = useState('');
  
  const [loading, setLoading] = useState(false);

  // 1. Tải danh sách bệnh nhân khi vào trang
  useEffect(() => {
    loadPatients();
  }, []);

  const loadPatients = async () => {
    try {
      const data = await getPatients();
      setPatients(data);
    } catch (error) {
      console.error("Lỗi tải bệnh nhân:", error);
    }
  };

  // 2. Chọn bệnh nhân -> Tải hồ sơ
  const handleSelectPatient = async (patient: Patient) => {
    setSelectedPatient(patient);
    setLoading(true);
    try {
      const data = await getPatientRecords(patient.id);
      setRecords(data);
    } catch (error) {
      console.error("Lỗi tải hồ sơ:", error);
    } finally {
      setLoading(false);
    }
  };

  // 3. Lưu lời khuyên
  const handleSaveTreatment = async () => {
    if (!editingRecord) return;
    try {
      await updateTreatment(editingRecord.id, newTreatment);
      alert("✅ Đã cập nhật phác đồ điều trị!");
      
      // Load lại dữ liệu để thấy thay đổi
      if (selectedPatient) handleSelectPatient(selectedPatient);
      setEditingRecord(null);
    } catch (error) {
      alert("❌ Lỗi khi lưu. Kiểm tra quyền Bác sĩ của tài khoản.");
    }
  };

  // Hàm xử lý link ảnh
  const getImageUrl = (path: string) => {
    if (!path) return 'https://via.placeholder.com/150?text=No+Image';
    return path.startsWith('http') ? path : `${API_BASE_URL}/${path}`;
  };

  return (
    <div className="min-h-screen bg-slate-100 p-6 flex gap-6">
      
      {/* CỘT TRÁI: DANH SÁCH BỆNH NHÂN */}
      <div className="w-1/3 bg-white rounded-xl shadow-lg flex flex-col h-[calc(100vh-3rem)]">
        <div className="p-5 border-b bg-blue-600 text-white flex justify-between items-center rounded-t-xl">
            <h2 className="font-bold text-lg">👨‍⚕️ Danh Sách Bệnh Nhân</h2>
            <button onClick={logoutUser} className="text-xs bg-blue-800 px-3 py-1 rounded hover:bg-blue-700">Thoát</button>
        </div>
        <div className="overflow-y-auto flex-1 p-2 space-y-2">
            {patients.length === 0 && <p className="text-center text-gray-500 mt-4">Chưa có bệnh nhân nào.</p>}
            {patients.map(p => (
                <div 
                    key={p.id}
                    onClick={() => handleSelectPatient(p)}
                    className={`p-4 rounded-lg cursor-pointer transition-all border ${
                        selectedPatient?.id === p.id 
                        ? 'bg-blue-50 border-blue-500 shadow-md' 
                        : 'bg-white hover:bg-gray-50 border-transparent'
                    }`}
                >
                    <div className="flex justify-between items-center">
                        <span className="font-bold text-slate-700">{p.full_name}</span>
                        <span className="text-xs bg-gray-200 px-2 py-1 rounded text-gray-600">ID: {p.id}</span>
                    </div>
                    <div className="text-sm text-slate-500 mt-1 flex gap-3">
                        <span>Tuổi: {p.age || '?'}</span>
                        <span>•</span>
                        <span>{p.gender}</span>
                    </div>
                </div>
            ))}
        </div>
      </div>

      {/* CỘT PHẢI: CHI TIẾT HỒ SƠ */}
      <div className="w-2/3 bg-white rounded-xl shadow-lg flex flex-col h-[calc(100vh-3rem)]">
        {selectedPatient ? (
            <>
                <div className="p-5 border-b border-gray-100 bg-gray-50 flex justify-between items-center rounded-t-xl">
                    <div>
                        <h2 className="font-bold text-xl text-slate-800">{selectedPatient.full_name}</h2>
                        <p className="text-sm text-slate-500">Lịch sử khám bệnh chi tiết</p>
                    </div>
                    <div className="text-right">
                        <span className="block text-2xl font-bold text-blue-600">{records.length}</span>
                        <span className="text-xs uppercase font-bold text-slate-400">Hồ sơ</span>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {loading && <p className="text-center">Đang tải...</p>}
                    {records.length === 0 && !loading && <p className="text-center text-gray-400 italic mt-10">Bệnh nhân này chưa có lịch sử khám.</p>}
                    
                    {records.slice().reverse().map(record => (
                        <div key={record.id} className="flex gap-4 border p-4 rounded-xl hover:shadow-md transition bg-white">
                            {/* Ảnh Thumbnail */}
                            <div className="w-32 h-32 flex-shrink-0 bg-black rounded-lg overflow-hidden border flex items-center justify-center">
                                <img src={getImageUrl(record.image_url)} className="w-full h-full object-cover" alt="Xray" />
                            </div>

                            {/* Thông tin */}
                            <div className="flex-1">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="text-xs text-slate-400 font-bold">{record.visit_date}</p>
                                        <h3 className={`font-bold text-lg mt-1 ${
                                            record.diagnosis.includes('Bình thường') ? 'text-green-600' : 'text-amber-600'
                                        }`}>
                                            {record.diagnosis}
                                        </h3>
                                    </div>
                                    <button 
                                        onClick={() => {
                                            setEditingRecord(record);
                                            setNewTreatment(record.treatment || '');
                                        }}
                                        className="text-sm bg-blue-100 text-blue-600 px-3 py-1 rounded font-medium hover:bg-blue-200 flex items-center gap-1"
                                    >
                                        ✏️ Kê đơn
                                    </button>
                                </div>
                                
                                <div className="mt-3 bg-slate-50 p-3 rounded-lg text-sm text-slate-700 border border-slate-100">
                                    <span className="font-bold text-slate-400 text-xs uppercase block mb-1">Lời khuyên / Phác đồ:</span>
                                    {record.treatment || "Chưa có lời khuyên."}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </>
        ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
                <span className="text-6xl mb-4">🩺</span>
                <p>Chọn một bệnh nhân bên trái để bắt đầu làm việc</p>
            </div>
        )}
      </div>

      {/* --- POPUP SOẠN LỜI KHUYÊN --- */}
      {editingRecord && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
            <div className="bg-white w-full max-w-lg rounded-xl shadow-2xl p-6 animate-fade-in-up">
                <h3 className="text-xl font-bold text-slate-800 mb-4">💊 Kê đơn & Lời khuyên</h3>
                
                <div className="mb-4">
                    <p className="text-sm text-slate-500 mb-2">Chẩn đoán từ AI:</p>
                    <div className="bg-gray-100 p-3 rounded font-medium text-slate-800 border-l-4 border-blue-500">
                        {editingRecord.diagnosis}
                    </div>
                </div>

                <div className="mb-6">
                    <label className="block text-sm font-bold text-slate-700 mb-2">Phác đồ điều trị / Lời khuyên của bác sĩ:</label>
                    <textarea 
                        className="w-full border border-gray-300 rounded-lg p-3 h-32 focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                        value={newTreatment}
                        onChange={(e) => setNewTreatment(e.target.value)}
                        placeholder="Nhập tên thuốc, liều lượng, dặn dò..."
                    />
                </div>

                <div className="flex justify-end gap-3">
                    <button 
                        onClick={() => setEditingRecord(null)}
                        className="px-5 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
                    >
                        Hủy bỏ
                    </button>
                    <button 
                        onClick={handleSaveTreatment}
                        className="px-5 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 shadow-lg"
                    >
                        💾 Lưu hồ sơ
                    </button>
                </div>
            </div>
        </div>
      )}

    </div>
  );
};

export default DoctorDashboard;