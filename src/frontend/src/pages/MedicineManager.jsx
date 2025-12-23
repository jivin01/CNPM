import React, { useState, useEffect } from "react";
import axios from "axios";

const MedicineManager = () => {
  const [medicines, setMedicines] = useState([]);
  const [form, setForm] = useState({ name: "", unit: "Viên", price: 0, stock_quantity: 0 });

  // Hàm định dạng tiền tệ (VNĐ)
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
  };

  // 1. Lấy danh sách thuốc từ Backend
  const fetchMedicines = async () => {
    try {
      const res = await axios.get("http://localhost:8000/api/pharmacy/medicines");
      // Sắp xếp ID mới nhất lên đầu để dễ thấy khi nhập xong
      const sortedData = res.data.sort((a, b) => b.id - a.id);
      setMedicines(sortedData);
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
      fetchMedicines(); // Load lại bảng ngay lập tức
      setForm({ name: "", unit: "Viên", price: 0, stock_quantity: 0 }); // Reset form
    } catch (err) {
      alert("❌ Lỗi: " + err.message);
    }
  };

  // Hàm xóa thuốc (Thêm chức năng này cho tiện)
  const handleDelete = async (id) => {
    if(window.confirm("Bạn có chắc muốn xóa thuốc này?")) {
        try {
            await axios.delete(`http://localhost:8000/api/pharmacy/medicines/${id}`);
            fetchMedicines();
        } catch (err) {
            alert("Không thể xóa (có thể đang dùng trong đơn thuốc)");
        }
    }
  }

  return (
    <div className="p-5">
      <h2 className="text-2xl font-bold mb-4 text-blue-700">📦 Quản Lý Kho Thuốc</h2>
      
      {/* Form nhập liệu */}
      <div className="bg-gray-100 p-4 rounded mb-5 flex gap-2 flex-wrap items-end shadow-sm">
        <div className="flex flex-col">
            <label className="text-sm font-bold text-gray-700">Tên thuốc</label>
            <input className="border p-2 rounded" placeholder="Nhập tên..." value={form.name} 
              onChange={e => setForm({...form, name: e.target.value})} />
        </div>
        
        <div className="flex flex-col">
            <label className="text-sm font-bold text-gray-700">Đơn vị</label>
            <select className="border p-2 rounded h-[42px]" value={form.unit} 
              onChange={e => setForm({...form, unit: e.target.value})}>
              <option>Viên</option><option>Vỉ</option><option>Chai</option><option>Hộp</option><option>Tuýp</option>
            </select>
        </div>

        <div className="flex flex-col">
            <label className="text-sm font-bold text-gray-700">Giá tiền nhập</label>
            <input className="border p-2 w-32 rounded" type="number" placeholder="0" value={form.price} 
              onChange={e => setForm({...form, price: e.target.value})} />
        </div>

        <div className="flex flex-col">
            <label className="text-sm font-bold text-gray-700">Số lượng</label>
            <input className="border p-2 w-24 rounded" type="number" placeholder="0" value={form.stock_quantity} 
              onChange={e => setForm({...form, stock_quantity: e.target.value})} />
        </div>

        <button onClick={handleSubmit} className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded font-bold h-[42px] transition">
          + Nhập Kho
        </button>
      </div>

      {/* Bảng hiển thị */}
      <div className="overflow-x-auto shadow-md rounded-lg">
        <table className="min-w-full border border-gray-200 bg-white">
            <thead className="bg-blue-50 text-blue-800">
            <tr>
                <th className="border p-3">ID</th>
                <th className="border p-3 text-left">Tên Thuốc</th>
                <th className="border p-3">Đơn vị</th>
                {/* --- CỘT GIÁ TIỀN --- */}
                <th className="border p-3 text-right">Giá tiền</th>
                <th className="border p-3">Tồn Kho</th>
                <th className="border p-3">Trạng thái</th>
                <th className="border p-3">Hành động</th>
            </tr>
            </thead>
            <tbody>
            {medicines.map(m => (
                <tr key={m.id} className="text-center hover:bg-gray-50 border-b">
                <td className="border p-3 text-gray-500">{m.id}</td>
                <td className="border p-3 font-semibold text-left">{m.name}</td>
                <td className="border p-3">{m.unit}</td>
                
                {/* --- HIỂN THỊ GIÁ TIỀN --- */}
                <td className="border p-3 text-right font-medium text-green-700">
                    {formatCurrency(m.price)}
                </td>

                <td className="border p-3 font-bold text-blue-600">{m.stock_quantity}</td>
                <td className="border p-3">
                    {m.stock_quantity < 10 ? 
                        <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs">⚠️ Sắp hết</span> : 
                        <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs">✅ Còn hàng</span>
                    }
                </td>
                <td className="border p-3">
                     <button onClick={() => handleDelete(m.id)} className="text-red-500 hover:underline text-sm">Xóa</button>
                </td>
                </tr>
            ))}
            </tbody>
        </table>
        {medicines.length === 0 && <p className="p-5 text-center text-gray-500">Chưa có thuốc nào trong kho.</p>}
      </div>
    </div>
  );
};

export default MedicineManager;