// src/components/doctor/DiagnosisEditor.tsx
import React, { useState } from 'react';
import { DiagnosisResult } from '../../types';

// Interface Props nhận dữ liệu từ cha truyền xuống
interface Props {
  initialData: DiagnosisResult;
  onSave: (data: DiagnosisResult) => void;
}

const DiagnosisEditor: React.FC<Props> = ({ initialData, onSave }) => {
  const [diagnosis, setDiagnosis] = useState(initialData);
  const [isEditing, setIsEditing] = useState(false);

  const handleSave = () => {
    // Giả lập lưu dữ liệu -> đổi trạng thái thành Verified
    onSave({ ...diagnosis, isVerified: true, status: 'reviewed' });
    setIsEditing(false);
    alert("Đã lưu chẩn đoán của bác sĩ!");
  };

  return (
    <div className="flex flex-col md:flex-row gap-6 p-6 bg-white shadow-md rounded-lg border border-gray-200">
      {/* Cột trái: Ảnh & Kết quả AI */}
      <div className="w-full md:w-1/2">
        <h3 className="font-bold text-lg mb-3 text-gray-800">Ảnh Phân Tích Retina</h3>
        <div className="relative border-2 border-gray-100 rounded-lg overflow-hidden bg-black">
             {/* Placeholder ảnh - Trong thực tế sẽ là ảnh thật từ API */}
             <img 
               src={diagnosis.imageUrl || "https://placehold.co/600x400/png?text=Retina+Scan"} 
               alt="Retina Scan" 
               className="w-full h-auto object-contain" 
             />
             <div className={`absolute top-2 right-2 px-3 py-1 rounded-full text-sm font-bold text-white ${diagnosis.aiRiskScore > 50 ? 'bg-red-600' : 'bg-green-600'}`}>
                Nguy cơ AI: {diagnosis.aiRiskScore}%
             </div>
        </div>
        <div className="mt-4 p-4 bg-blue-50 rounded-md border border-blue-100">
            <p className="text-sm text-gray-500 uppercase font-bold text-xs mb-1">Phát hiện của AI (Gợi ý):</p>
            <p className="font-medium text-gray-800">{diagnosis.aiFinding}</p>
        </div>
      </div>

      {/* Cột phải: Bác sĩ chỉnh sửa */}
      <div className="w-full md:w-1/2 flex flex-col gap-4">
        <div className="flex justify-between items-center border-b pb-2">
           <h3 className="font-bold text-lg text-blue-800">Kết luận Lâm sàng</h3>
           {diagnosis.isVerified && <span className="text-green-600 font-bold text-sm">✓ Đã xác thực</span>}
        </div>
        
        <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Ghi chú chuyên môn:</label>
            <textarea 
                className={`w-full p-3 border rounded-md focus:ring-2 focus:ring-blue-500 h-64 resize-none transition-colors ${isEditing ? 'bg-white border-gray-300' : 'bg-gray-100 border-transparent'}`}
                value={diagnosis.doctorNotes || ''}
                onChange={(e) => setDiagnosis({...diagnosis, doctorNotes: e.target.value})}
                disabled={!isEditing}
                placeholder={isEditing ? "Nhập chẩn đoán xác thực của bác sĩ..." : "Chưa có ghi chú..."}
            />
        </div>

        <div className="flex gap-3 mt-auto pt-4 border-t">
            {!isEditing ? (
                <button 
                    onClick={() => setIsEditing(true)}
                    className="flex-1 bg-yellow-500 text-white py-2 rounded-md hover:bg-yellow-600 transition font-medium">
                    ✏️ Chỉnh sửa kết quả
                </button>
            ) : (
                <>
                    <button 
                        onClick={() => setIsEditing(false)}
                        className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-md hover:bg-gray-300 font-medium">
                        Hủy bỏ
                    </button>
                    <button 
                        onClick={handleSave}
                        className="flex-1 bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 shadow-md font-medium">
                        💾 Xác thực & Lưu
                    </button>
                </>
            )}
        </div>
      </div>
    </div>
  );
};

export default DiagnosisEditor;