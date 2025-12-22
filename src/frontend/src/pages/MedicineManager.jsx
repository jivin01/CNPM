import React, { useState, useEffect } from "react";
import axios from "axios";

const MedicineManager = () => {
  const [medicines, setMedicines] = useState([]);
  const [form, setForm] = useState({ name: "", unit: "Viên", price: 0, stock_quantity: 0 });

  // 1. Lấy danh sách thuốc từ Backend
  const fetchMedicines = async () => {
    try {
      // Lưu ý: Port 8000 là mặc định của FastAPI
      const res = await axios.get("http://localhost:8000/api/pharmacy/medicines");
      setMedicines(res.data);
    } catch (err) {
      console.error("Lỗi kết nối:", err);
    }
  };

  useEffect(() => { fetchMedicines(); }, []);

  // 2. Xử lý nhập kho
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post("http://localhost:8000/api/pharmacy/medicines", form);
      alert("✅ Nhập kho thành công!");
      fetchMedicines(); // Load lại bảng
      setForm({ name: "", unit: "Viên", price: 0, stock_quantity: 0 }); // Reset form
    } catch (err) {
      alert("❌ Lỗi: " + err.message);
    }
  };

  return (
    <div className="p-5">
      <h2 className="text-2xl font-bold mb-4 text-blue-700">📦 Quản Lý Kho Thuốc</h2>
      
      {/* Form nhập liệu */}
      <div className="bg-gray-100 p-4 rounded mb-5 flex gap-2">
        <input className="border p-2" placeholder="Tên thuốc" value={form.name} 
          onChange={e => setForm({...form, name: e.target.value})} />
        
        <select className="border p-2" value={form.unit} 
          onChange={e => setForm({...form, unit: e.target.value})}>
          <option>Viên</option><option>Vỉ</option><option>Chai</option><option>Hộp</option>
        </select>

        <input className="border p-2 w-24" type="number" placeholder="Giá" value={form.price} 
          onChange={e => setForm({...form, price: e.target.value})} />

        <input className="border p-2 w-24" type="number" placeholder="Số lượng" value={form.stock_quantity} 
          onChange={e => setForm({...form, stock_quantity: e.target.value})} />

        <button onClick={handleSubmit} className="bg-green-600 text-white px-4 py-2 rounded font-bold">
          + Nhập Kho
        </button>
      </div>

      {/* Bảng hiển thị */}
      <table className="min-w-full border border-gray-300">
        <thead className="bg-blue-50">
          <tr>
            <th className="border p-2">ID</th>
            <th className="border p-2">Tên Thuốc</th>
            <th className="border p-2">Đơn vị</th>
            <th className="border p-2">Tồn Kho</th>
            <th className="border p-2">Trạng thái</th>
          </tr>
        </thead>
        <tbody>
          {medicines.map(m => (
            <tr key={m.id} className="text-center hover:bg-gray-50">
              <td className="border p-2">{m.id}</td>
              <td className="border p-2 font-semibold">{m.name}</td>
              <td className="border p-2">{m.unit}</td>
              <td className="border p-2 font-bold text-blue-600">{m.stock_quantity}</td>
              <td className="border p-2">
                {m.stock_quantity < 10 ? <span className="text-red-500">⚠️ Sắp hết</span> : "✅ Còn hàng"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default MedicineManager;