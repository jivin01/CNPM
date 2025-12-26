import { useState } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setPreview(URL.createObjectURL(file));
      setResult(null);
    }
  };

  const onUpload = async () => {
    if (!selectedFile) return alert("Vui lòng chọn ảnh trước!");

    const formData = new FormData();
    formData.append("file", selectedFile);

    setLoading(true);
    try {
      const response = await axios.post("http://127.0.0.1:8000/analyze", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setResult(response.data);
    } catch (error) {
      console.error("Lỗi upload:", error);
      alert("Lỗi kết nối đến AI Server! Bạn đã bật uvicorn ai_api:app chưa?");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ maxWidth: '800px', margin: '0 auto', padding: '20px', fontFamily: 'Arial' }}>
      <h1 style={{ textAlign: 'center', color: '#0d47a1' }}>👁️ Sàng Lọc Võng Mạc AI</h1>
      
      <div style={{ border: '2px dashed #ccc', padding: '20px', textAlign: 'center', borderRadius: '10px', marginBottom: '20px' }}>
        <input type="file" onChange={onFileChange} accept="image/*" />
        <p style={{ color: '#666', marginTop: '10px' }}>Chọn ảnh chụp đáy mắt (Fundus Image) để phân tích</p>
      </div>

      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <button 
          onClick={onUpload} 
          disabled={loading || !selectedFile}
          style={{
            padding: '10px 30px', 
            fontSize: '16px', 
            backgroundColor: loading ? '#ccc' : '#1976d2', 
            color: 'white', 
            border: 'none', 
            borderRadius: '5px',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? "⏳ Đang phân tích..." : "🚀 Chạy Chẩn Đoán AI"}
        </button>
      </div>

      {result && (
        <div style={{ background: '#f5f5f5', padding: '20px', borderRadius: '10px' }}>
          <h2 style={{ color: result.risk_score > 50 ? 'red' : 'green', textAlign: 'center' }}>
            Nguy cơ bệnh lý: {result.risk_score}%
          </h2>
          
          <div style={{ display: 'flex', justifyContent: 'space-around', marginTop: '20px', gap: '10px' }}>
            <div style={{ textAlign: 'center' }}>
              <h4>Ảnh Gốc</h4>
              {/* Dùng ảnh server trả về để đảm bảo đúng kích thước resize */}
              <img src={result.original_image} alt="Original" style={{ maxWidth: '100%', height: '200px', borderRadius: '8px' }} />
            </div>
            
            <div style={{ textAlign: 'center' }}>
              <h4>AI Đã Xử Lý (Vessels)</h4>
              {/* CHỖ NÀY ĐÃ SỬA: processed_image_base64 -> processed_image */}
              <img src={result.processed_image} alt="AI Result" style={{ maxWidth: '100%', height: '200px', borderRadius: '8px', border: '2px solid #1976d2' }} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;