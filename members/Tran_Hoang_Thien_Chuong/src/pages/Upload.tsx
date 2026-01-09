// src/pages/Upload.tsx
import React, { useState } from 'react';
import { uploadImageAnalysis } from '../services/api';

// 1. Định nghĩa kiểu dữ liệu cho kết quả từ Server trả về
interface AnalysisResult {
  filename: string;
  prediction: string;
  confidence: number;
  advice: string;
}

const Upload = () => {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  
  // State mới: Theo dõi trạng thái đang kéo thả
  const [isDragging, setIsDragging] = useState(false);

  // --- Hàm xử lý file chung (Dùng cho cả nút bấm và kéo thả) ---
  const processFile = (file: File) => {
      setSelectedImage(file);
      setPreviewUrl(URL.createObjectURL(file));
      setResult(null); // Reset kết quả cũ
  };

  // Xử lý khi chọn file bằng nút bấm (Input)
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      processFile(event.target.files[0]);
    }
  };

  // --- CÁC SỰ KIỆN KÉO THẢ (DRAG & DROP) ---
  
  // 1. Khi kéo file vào vùng nhận diện
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault(); // Chặn hành động mặc định của trình duyệt
      setIsDragging(true); // Bật hiệu ứng sáng lên
  };

  // 2. Khi kéo file ra khỏi vùng nhận diện
  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false); // Tắt hiệu ứng
  };

  // 3. Khi thả file xuống
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false); // Tắt hiệu ứng
      
      // Lấy file từ sự kiện drop
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
          processFile(e.dataTransfer.files[0]);
      }
  };

  const handleUpload = async () => {
    if (!selectedImage) return;

    setLoading(true);
    setResult(null);
    
    try {
        const data = await uploadImageAnalysis(selectedImage);
        console.log("Kết quả:", data);
        setResult(data); 
    } catch (error) {
        console.error("Lỗi:", error);
        alert("❌ Có lỗi xảy ra. Vui lòng kiểm tra lại Server hoặc đăng nhập lại.");
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-blue-50 p-8 flex flex-col items-center">
      <h1 className="text-3xl font-bold text-blue-700 mb-2">📸 Tải Ảnh Khám Bệnh</h1>
      <p className="text-slate-500 mb-8">Kéo thả ảnh X-quang vào khung bên dưới hoặc bấm chọn file</p>

      <div className="flex flex-col md:flex-row gap-8 w-full max-w-5xl items-start justify-center">
        
        {/* --- CỘT TRÁI: Upload Ảnh (Đã nâng cấp Drag & Drop) --- */}
        <div className="bg-white p-8 rounded-xl shadow-lg w-full md:w-1/2 transition-all">
            <div 
                // Thêm các sự kiện Drag & Drop vào thẻ div bao quanh ảnh
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                
                // Thay đổi màu sắc dựa trên biến isDragging
                className={`mb-6 flex justify-center items-center border-2 border-dashed rounded-lg h-64 relative overflow-hidden transition-all cursor-pointer
                ${isDragging ? 'border-blue-600 bg-blue-100 scale-105 shadow-xl' : 'border-blue-300 bg-slate-50'}`}
            >
                {previewUrl ? (
                    // pointer-events-none giúp khi kéo file đè lên ảnh không bị chập chờn
                    <img src={previewUrl} alt="Preview" className="w-full h-full object-contain pointer-events-none"/>
                ) : (
                    <div className="text-center text-slate-400 p-4 pointer-events-none">
                        <span className="text-4xl block mb-2">📂</span>
                        <p className="font-medium">
                            {isDragging ? "Thả tay để nhận ảnh!" : "Kéo & Thả ảnh vào đây"}
                        </p>
                        <p className="text-xs mt-1 text-slate-300">(Hoặc bấm nút bên dưới)</p>
                    </div>
                )}
            </div>

            <div className="flex flex-col gap-4">
                <label className="block">
                    <input type="file" accept="image/*" onChange={handleFileChange}
                        className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"/>
                </label>
                <button onClick={handleUpload} disabled={!selectedImage || loading}
                    className={`w-full py-3 rounded-lg font-bold text-white transition-all ${!selectedImage || loading ? 'bg-slate-300' : 'bg-blue-600 hover:bg-blue-700 shadow-lg'}`}>
                    {loading ? '⏳ Đang phân tích...' : '🚀 Phân tích ngay'}
                </button>
            </div>
        </div>

        {/* --- CỘT PHẢI: Hiển thị Kết Quả (Giữ nguyên) --- */}
        {result && (
            <div className="bg-white p-8 rounded-xl shadow-lg w-full md:w-1/2 border-l-4 border-green-500 animate-fade-in-up">
                <h2 className="text-2xl font-bold text-green-700 mb-4 flex items-center">
                    ✅ Kết Quả Chẩn Đoán
                </h2>
                <div className="space-y-4">
                    <div className="bg-green-50 p-4 rounded-lg">
                        <p className="text-sm text-slate-500 uppercase font-semibold">Dự đoán bệnh:</p>
                        <p className="text-3xl font-bold text-green-800 mt-1">{result.prediction}</p>
                    </div>
                    <div className="flex gap-4">
                        <div className="flex-1 bg-blue-50 p-4 rounded-lg">
                             <p className="text-sm text-slate-500 uppercase font-semibold">Độ tin cậy AI:</p>
                             <div className="flex items-end gap-2 mt-1">
                                <span className="text-2xl font-bold text-blue-700">{(result.confidence * 100).toFixed(0)}%</span>
                                <div className="w-full bg-gray-200 h-2 rounded-full mb-2 ml-2 relative top-[-5px]">
                                    <div className="bg-blue-600 h-2 rounded-full transition-all duration-1000" style={{width: `${result.confidence * 100}%`}}></div>
                                </div>
                             </div>
                        </div>
                    </div>
                    <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                        <p className="text-sm text-yellow-700 font-bold mb-1">💡 Lời khuyên:</p>
                        <p className="text-slate-700 italic">"{result.advice}"</p>
                    </div>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};

export default Upload;