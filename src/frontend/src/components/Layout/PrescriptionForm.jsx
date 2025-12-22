import React, { useState, useEffect } from "react";
import axios from "axios";

const PrescriptionForm = ({ medicalRecordId }) => {
  const [medicines, setMedicines] = useState([]);
  const [cart, setCart] = useState([]); // Danh sách thuốc đang kê
  
  const [selectedId, setSelectedId] = useState("");
  const [qty, setQty] = useState(1);

  // Lấy thuốc để hiển thị trong Dropdown
  useEffect(() => {
    axios.get("http://localhost:8000/api/pharmacy/medicines")
      .then(res => setMedicines(res.data))
      .catch(err => console.error(err));
  }, []);

  // Thêm thuốc vào đơn tạm
  const addToCart = () => {
    const med = medicines.find(m => m.id === parseInt(selectedId));
    if (!med) return;
    if (qty > med.stock_quantity) return alert(`Kho chỉ còn ${med.stock_quantity} ${med.unit}!`);

    setCart([...cart, { 
      medicine_id: med.id, 
      name: med.name, 
      quantity: parseInt(qty) 
    }]);
    setQty(1);
  };

  // Gửi xuống Backend
  const handleSave = async () => {
    if (cart.length === 0) return alert("Đơn thuốc trống!");
    
    const payload = {
      medical_record_id: medicalRecordId, // ID phiếu khám lấy từ props
      items: cart
    };

    try {
      await axios.post("http://localhost:8000/api/pharmacy/prescriptions", payload);
      alert("✅ Đã lưu đơn thuốc và trừ kho thành công!");
      setCart([]); // Xóa danh sách sau khi lưu
    } catch (err) {
      alert("❌ Lỗi: " + (err.response?.data?.detail || err.message));
    }
  };

  return (
    <div className="border-2 border-blue-200 p-4 rounded-lg mt-4 bg-white">
      <h3 className="font-bold text-lg text-blue-800 mb-3">💊 Kê Đơn Thuốc</h3>
      
      {/* Khu vực chọn thuốc */}
      <div className="flex gap-2 mb-3">
        <select className="border p-2 flex-1" onChange={e => setSelectedId(e.target.value)}>
          <option value="">-- Chọn thuốc --</option>
          {medicines.map(m => (
            <option key={m.id} value={m.id} disabled={m.stock_quantity === 0}>
              {m.name} (Còn: {m.stock_quantity} {m.unit})
            </option>
          ))}
        </select>
        <input type="number" className="border p-2 w-20" value={qty} min="1" 
           onChange={e => setQty(e.target.value)} />
        <button onClick={addToCart} className="bg-blue-500 text-white px-3 rounded">Thêm</button>
      </div>

      {/* Danh sách đã chọn */}
      <ul className="list-disc pl-5 mb-3 bg-gray-50 p-2 rounded">
        {cart.map((item, idx) => (
          <li key={idx}>
            {item.name} - SL: <b>{item.quantity}</b>
            <button onClick={() => setCart(cart.filter((_, i) => i !== idx))} 
              className="ml-2 text-red-500 text-xs underline">Xóa</button>
          </li>
        ))}
      </ul>

      <button onClick={handleSave} className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded font-bold shadow">
        LƯU ĐƠN THUỐC
      </button>
    </div>
  );
};

export default PrescriptionForm;