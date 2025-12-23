import React, { useState, useEffect } from "react";
import axios from "axios";

// Đặt đường dẫn API gốc (Base URL)
// Nếu máy bạn chạy port khác 8000 thì sửa lại số port ở đây
const API_BASE = "http://localhost:8000";

const BillingManager = () => {
  const [bills, setBills] = useState([]);      // Danh sách hồ sơ khám
  const [medicines, setMedicines] = useState([]); // Danh sách thuốc (để lấy giá)
  const [selectedBill, setSelectedBill] = useState(null);
  const [loading, setLoading] = useState(false);

  // 1. Hàm tải dữ liệu từ Backend
  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Gọi song song 2 API: Lấy thuốc và Lấy danh sách khám
      const [medRes, recordRes] = await Promise.all([
        axios.get(`${API_BASE}/api/pharmacy/medicines`),
        axios.get(`${API_BASE}/api/medical/`) // <-- Khớp với prefix bên Python
      ]);

      setMedicines(medRes.data);

      // Lọc ra những đơn chưa thanh toán (status khác 'completed')
      // Nếu backend chưa có cột status, nó sẽ hiện tất cả (vẫn chạy được)
      const pendingBills = recordRes.data.filter(r => r.status !== 'completed');
      setBills(pendingBills);
      
      setLoading(false);
    } catch (err) {
      console.error("Lỗi kết nối Backend:", err);
      alert("⚠️ Không tải được dữ liệu! Hãy chắc chắn Backend đang chạy.");
      setLoading(false);
    }
  };

  // Chạy ngay khi mở trang
  useEffect(() => { fetchData(); }, []);

  // 2. Hàm tính tổng tiền (Khám + Thuốc)
  const calculateTotal = (billData) => {
    let total = 50000; // Tiền công khám mặc định
    
    // Xử lý dữ liệu thuốc (có thể là chuỗi JSON hoặc mảng)
    let medList = [];
    try {
        if (typeof billData.prescription === 'string') {
            medList = JSON.parse(billData.prescription);
        } else if (Array.isArray(billData.prescription)) {
            medList = billData.prescription;
        }
    } catch (e) {
        console.warn("Lỗi đọc đơn thuốc:", e);
    }

    // Cộng tiền từng loại thuốc
    if (Array.isArray(medList)) {
        medList.forEach(item => {
            // Tìm giá thuốc trong kho
            const medInStock = medicines.find(m => m.id === (item.med_id || item.id));
            const price = medInStock ? medInStock.price : 0;
            const quantity = item.quantity || 0;
            total += price * quantity;
        });
    }

    return total;
  };

  // 3. Hàm xử lý Thu tiền (Gọi API thật)
  const handlePayment = async (bill) => {
    if(!window.confirm(`Xác nhận thu tiền bệnh nhân #${bill.patient_id}?`)) return;

    try {
        // Gọi API cập nhật trạng thái
        await axios.put(`${API_BASE}/api/medical/${bill.id}/pay`);
        
        alert("✅ Đã thu tiền thành công!");
        setSelectedBill(null); // Đóng hóa đơn đang xem
        fetchData(); // Tải lại danh sách (đơn vừa thu sẽ biến mất)
    } catch (err) {
        console.error(err);
        alert("❌ Lỗi thanh toán: " + (err.response?.data?.detail || err.message));
    }
  }

  // Tiện ích: Format tiền Việt Nam
  const formatMoney = (num) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num);

  // Tiện ích: Lấy tên thuốc
  const getMedName = (id) => {
      const med = medicines.find(m => m.id === id);
      return med ? med.name : `Thuốc ID: ${id}`;
  }

  // Tiện ích: Lấy giá thuốc
  const getMedPrice = (id) => {
      const med = medicines.find(m => m.id === id);
      return med ? med.price : 0;
  }

  // --- GIAO DIỆN ---
  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h2 className="text-3xl font-bold text-green-700 mb-6 flex items-center">
        💸 Quản Lý Thu Ngân & Viện Phí
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* CỘT TRÁI: DANH SÁCH CHỜ */}
        <div className="md:col-span-2 bg-white p-5 rounded-lg shadow h-fit">
            <h3 className="text-xl font-bold mb-4 text-gray-700 flex justify-between items-center">
                <span>📋 Danh sách chờ thanh toán</span>
                <button onClick={fetchData} className="text-sm bg-blue-50 text-blue-600 px-3 py-1 rounded hover:bg-blue-100">
                    🔄 Làm mới
                </button>
            </h3>
            
            {loading ? <p className="text-gray-500">Đang tải dữ liệu...</p> : (
            <table className="w-full text-left border-collapse">
                <thead className="bg-green-50 text-green-800 uppercase text-xs">
                    <tr>
                        <th className="p-3">Mã HS</th>
                        <th className="p-3">Mã BN</th>
                        <th className="p-3">Chẩn đoán</th>
                        <th className="p-3 text-right">Tổng Tiền</th>
                        <th className="p-3 text-center">Tác vụ</th>
                    </tr>
                </thead>
                <tbody className="text-sm">
                    {bills.length === 0 ? (
                        <tr><td colSpan="5" className="p-6 text-center text-gray-400">Không có hóa đơn nào cần thu</td></tr>
                    ) : bills.map(b => (
                        <tr key={b.id} className="border-b hover:bg-gray-50 transition">
                            <td className="p-3 font-bold text-gray-600">#{b.id}</td>
                            <td className="p-3">BN-{b.patient_id}</td>
                            <td className="p-3 truncate max-w-[150px]">{b.diagnosis}</td>
                            <td className="p-3 text-right font-bold text-red-600">
                                {formatMoney(calculateTotal(b))}
                            </td>
                            <td className="p-3 text-center">
                                <button 
                                    onClick={() => setSelectedBill(b)}
                                    className="bg-blue-600 text-white px-3 py-1 rounded text-xs hover:bg-blue-700 mr-2">
                                    Xem
                                </button>
                                <button 
                                    onClick={() => handlePayment(b)}
                                    className="bg-green-600 text-white px-3 py-1 rounded text-xs hover:bg-green-700">
                                    Thu tiền
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            )}
        </div>

        {/* CỘT PHẢI: HÓA ĐƠN CHI TIẾT */}
        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
            <h3 className="text-xl font-bold mb-4 text-center text-gray-800 border-b pb-3">🧾 Hóa Đơn Chi Tiết</h3>
            
            {selectedBill ? (
                <div className="text-sm">
                    <div className="text-center mb-6">
                        <p className="font-bold text-lg text-blue-800 uppercase">Phòng Khám AURA</p>
                        <p className="text-gray-500 text-xs">Địa chỉ: 123 Đường ABC, TP.HCM</p>
                    </div>
                    
                    <div className="space-y-1 mb-4 text-gray-700">
                        <p><strong>Mã hồ sơ:</strong> #{selectedBill.id}</p>
                        <p><strong>Bệnh nhân ID:</strong> {selectedBill.patient_id}</p>
                        <p><strong>Ngày khám:</strong> {new Date().toLocaleDateString('vi-VN')}</p>
                        <p><strong>Chẩn đoán:</strong> {selectedBill.diagnosis}</p>
                    </div>

                    <table className="w-full mb-6 text-sm border-t border-b border-dashed border-gray-300">
                        <thead className="text-gray-500">
                            <tr>
                                <th className="text-left py-2 font-normal">Dịch vụ / Thuốc</th>
                                <th className="text-right py-2 font-normal">SL</th>
                                <th className="text-right py-2 font-normal">Thành tiền</th>
                            </tr>
                        </thead>
                        <tbody className="font-medium text-gray-800">
                            {/* Tiền khám */}
                            <tr>
                                <td className="py-2">Công khám bệnh</td>
                                <td className="text-right">1</td>
                                <td className="text-right">{formatMoney(50000)}</td>
                            </tr>
                            
                            {/* Danh sách thuốc */}
                            {(() => {
                                let list = [];
                                try {
                                    if(typeof selectedBill.prescription === 'string') list = JSON.parse(selectedBill.prescription);
                                    else if(Array.isArray(selectedBill.prescription)) list = selectedBill.prescription;
                                } catch(e){}

                                return list.map((item, idx) => {
                                    const medID = item.med_id || item.id;
                                    const price = getMedPrice(medID);
                                    return (
                                        <tr key={idx}>
                                            <td className="py-1 pl-2 text-gray-600">- {getMedName(medID)}</td>
                                            <td className="text-right">{item.quantity}</td>
                                            <td className="text-right">{formatMoney(price * item.quantity)}</td>
                                        </tr>
                                    );
                                });
                            })()}
                        </tbody>
                    </table>

                    <div className="flex justify-between items-center text-xl font-bold mt-4 pt-4 border-t border-gray-800">
                        <span>TỔNG CỘNG:</span>
                        <span className="text-red-600">{formatMoney(calculateTotal(selectedBill))}</span>
                    </div>

                    <div className="mt-8 flex gap-3">
                        <button 
                            onClick={() => handlePayment(selectedBill)}
                            className="flex-1 bg-green-600 text-white py-3 rounded-lg font-bold hover:bg-green-700 transition shadow-lg shadow-green-200">
                            💸 XÁC NHẬN THU TIỀN
                        </button>
                        <button 
                            onClick={() => window.print()}
                            className="w-14 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 flex items-center justify-center border border-gray-300">
                            🖨️
                        </button>
                    </div>
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                    <span className="text-4xl mb-2">⬅️</span>
                    <p>Chọn hóa đơn bên trái để xem</p>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default BillingManager;