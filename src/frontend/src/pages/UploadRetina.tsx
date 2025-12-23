import React, { useState } from 'react';
import axios from 'axios';

const UploadRetina: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return setMessage('Chọn ảnh trước đã');
    const token = localStorage.getItem('access_token');
    const form = new FormData();
    form.append('file', file);
    try {
      const res = await axios.post('http://127.0.0.1:8000/api/ai/upload', form, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessage('Upload thành công: ' + JSON.stringify(res.data.result));
    } catch (err: any) {
      setMessage(err.response?.data?.detail || 'Lỗi khi upload');
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-4">Tải ảnh võng mạc</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input type="file" accept="image/*" onChange={(e)=>setFile(e.target.files?.[0]||null)} />
        <button className="bg-blue-600 text-white py-2 px-4 rounded">Tải lên và Chẩn đoán</button>
      </form>
      {message && <div className="mt-4">{message}</div>}
    </div>
  );
};

export default UploadRetina;
