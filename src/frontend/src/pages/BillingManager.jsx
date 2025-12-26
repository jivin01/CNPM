import React, { useState, useEffect } from "react";
import axios from "axios";

// Đặt đường dẫn API gốc
const API_BASE = "http://localhost:8000";

const BillingManager = () => {
  const [bills, setBills] = useState([]);      // Danh sách hồ sơ chờ thanh toán
  const [selectedBill, setSelectedBill] = useState(null); // Chi tiết hóa đơn (từ API billing)
  const [loading, setLoading] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false); // Loading riêng cho phần chi tiết

  // 1. Hàm tải danh sách hồ sơ (chỉ lấy danh sách, chưa lấy tiền chi tiết)
  const fetchData = async () => {
    try {
      setLoading(true);
      // Chỉ cần gọi API lấy danh sách hồ sơ khám
      const recordRes = await axios.get(`${API_BASE}/api/medical/`);
      
      // Lọc ra những đơn chưa thanh toán (status khác 'completed')
      const pendingBills = recordRes.data.filter(r => r.status !== 'completed');
      setBills(pendingBills);
      
      setLoading(false);
    } catch (err) {
      console.error("Lỗi kết nối Backend:", err);
      // alert("⚠️ Không tải được dữ liệu! Hãy chắc chắn Backend đang chạy.");
      setLoading(false);
    }
  };

  // Chạy ngay khi mở trang
  useEffect(() => { fetchData(); }, []);

  // 2. Hàm XEM CHI TIẾT (Gọi API Billing mới làm)
  const handleViewBill = async (recordId) => {
    try {
        setLoadingDetail(true);
        setSelectedBill(null); // Reset để hiện loading
        
        // GỌI API TÍNH TIỀN TỪ BACKEND
        const res = await axios.get(`${API_BASE}/api/billing/${recordId}`);
        
        console.log("Dữ liệu hóa đơn từ Backend:", res.data);
        setSelectedBill(res.data); // Lưu dữ liệu đã tính toán vào state
        
        setLoadingDetail(false);
    } catch (err) {
        console.error(err);
        alert("❌ Lỗi khi lấy thông tin hóa đơn: " + err.message);
        setLoadingDetail(false);
    }
  };

  // 3. Hàm xử lý Thu tiền
  const handlePayment = async () => {
    if (!selectedBill) return;
    if (!window.confirm(`Xác nhận thu tiền bệnh nhân ${selectedBill.patient_name}?`)) return;

    try {
        // Gọi API cập nhật trạng thái hồ sơ sang 'completed'
        await axios.put(`${API_BASE}/api/medical/${selectedBill.record_id}/pay`);
        
        alert("✅ Đã thu tiền thành công!");
        setSelectedBill(null); // Đóng hóa đơn
        fetchData(); // Tải lại danh sách (đơn vừa thu sẽ biến mất)
    } catch (err) {
        console.error(err);
        alert("❌ Lỗi thanh toán: " + (err.response?.data?.detail || err.message));
    }
  }

  // Tiện ích: Format tiền Việt Nam
  const formatMoney = (num) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num || 0);

  // --- GIAO DIỆN ---
  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h2 className="text-3xl font-bold text-green-700 mb-6 flex items-center">
        💸 Quản Lý Thu Ngân & Viện Phí
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* CỘT TRÁI: DANH SÁCH CHỜ */}
        <div className="md:col-span-1 bg-white p-5 rounded-lg shadow h-fit">
            <h3 className="text-xl font-bold mb-4 text-gray-700 flex justify-between items-center">
                <span>📋 Chờ thanh toán</span>
                <button onClick={fetchData} className="text-sm bg-blue-50 text-blue-600 px-3 py-1 rounded hover:bg-blue-100">
                    🔄 Load
                </button>
            </h3>
            
            {loading ? <p className="text-gray-500">Đang tải...</p> : (
            <div className="space-y-3">
                {bills.length === 0 ? (
                    <p className="text-center text-gray-400 py-4">Không có hóa đơn nào</p>
                ) : bills.map(b => (
                    <div 
                        key={b.id} 
                        onClick={() => handleViewBill(b.id)}
                        className={`p-4 border rounded cursor-pointer transition hover:shadow-md ${selectedBill?.record_id === b.id ? 'border-green-500 bg-green-50' : 'border-gray-200 bg-white'}`}
                    >
                        <div className="flex justify-between font-bold text-gray-700">
                            <span>#{b.id}</span>
                            <span className="text-blue-600">BN-{b.patient_id}</span>
                        </div>
                        <div className="text-sm text-gray-500 mt-1 truncate">
                            {b.diagnosis || "Chưa có chẩn đoán"}
                        </div>
                        <div className="mt-2 text-xs text-right text-green-600 font-semibold">
                            Bấm để xem tổng tiền 👉
                        </div>
                    </div>
                ))}
            </div>
            )}
        </div>

        {/* CỘT PHẢI: HÓA ĐƠN CHI TIẾT */}
        <div className="md:col-span-2 bg-white p-6 rounded-lg shadow border border-gray-200 min-h-[500px]">
            <h3 className="text-xl font-bold mb-4 text-center text-gray-800 border-b pb-3">🧾 Hóa Đơn Chi Tiết</h3>
            
            {loadingDetail ? (
                <div className="text-center py-20 text-gray-500">⏳ Đang tính toán hóa đơn từ hệ thống...</div>
            ) : selectedBill ? (
                <div className="text-sm animate-fade-in">
                    {/* Header Hóa Đơn */}
                    <div className="text-center mb-6">
                        <p className="font-bold text-xl text-blue-800 uppercase">Phòng Khám AURA</p>
                        <p className="text-gray-500 text-xs">Địa chỉ: 123 Đường ABC, TP.HCM</p>
                        <p className="text-gray-500 text-xs italic mt-1">Ngày lập: {selectedBill.created_at}</p>
                    </div>
                    
                    {/* Thông tin bệnh nhân */}
                    <div className="bg-gray-50 p-4 rounded-lg mb-6 border border-gray-100">
                        <div className="grid grid-cols-2 gap-4">
                            <p><strong>Mã hồ sơ:</strong> #{selectedBill.record_id}</p>
                            <p><strong>Bệnh nhân:</strong> <span className="uppercase text-blue-600 font-bold">{selectedBill.patient_name}</span></p>
                            <p className="col-span-2"><strong>Chẩn đoán:</strong> {selectedBill.diagnosis}</p>
                        </div>
                    </div>

                    {/* Bảng Chi Tiết */}
                    <table className="w-full mb-6 text-sm border-t border-b border-gray-200">
                        <thead className="bg-gray-100 text-gray-600">
                            <tr>
                                <th className="text-left py-3 px-2 font-semibold">Nội dung</th>
                                <th className="text-center py-3 px-2 font-semibold">ĐVT</th>
                                <th className="text-center py-3 px-2 font-semibold">SL</th>
                                <th className="text-right py-3 px-2 font-semibold">Đơn giá</th>
                                <th className="text-right py-3 px-2 font-semibold">Thành tiền</th>
                            </tr>
                        </thead>
                        <tbody className="text-gray-800">
                            {/* 1. Tiền khám */}
                            <tr className="border-b border-gray-100">
                                <td className="py-3 px-2 font-medium text-blue-800">Công khám bệnh</td>
                                <td className="text-center px-2">-</td>
                                <td className="text-center px-2">1</td>
                                <td className="text-right px-2">{formatMoney(selectedBill.exam_fee)}</td>
                                <td className="text-right px-2 font-bold">{formatMoney(selectedBill.exam_fee)}</td>
                            </tr>
                            
                            {/* 2. Danh sách thuốc từ API */}
                            {selectedBill.items.map((item, idx) => (
                                <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                                    <td className="py-3 px-2 pl-6">
                                        💊 {item.medicine_name}
                                    </td>
                                    <td className="text-center px-2">{item.unit}</td>
                                    <td className="text-center px-2 font-bold">{item.quantity}</td>
                                    <td className="text-right px-2 text-gray-500">{formatMoney(item.price_per_unit)}</td>
                                    <td className="text-right px-2">{formatMoney(item.total_price)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {/* Tổng cộng */}
                    <div className="flex flex-col items-end gap-2 text-base mt-4 pt-4 border-t-2 border-gray-800">
                        <div className="flex justify-between w-64">
                            <span className="text-gray-500">Tổng tiền thuốc:</span>
                            <span>{formatMoney(selectedBill.medicine_fee)}</span>
                        </div>
                        <div className="flex justify-between w-64 text-xl font-bold text-red-600 mt-2">
                            <span>TỔNG THANH TOÁN:</span>
                            <span>{formatMoney(selectedBill.total_amount)}</span>
                        </div>
                    </div>

                    {/* Nút tác vụ */}
                    <div className="mt-8 flex gap-3 justify-end">
                        <button 
                            onClick={() => window.print()}
                            className="bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-bold hover:bg-gray-300 flex items-center gap-2">
                            🖨️ In Hóa Đơn
                        </button>
                        <button 
                            onClick={handlePayment}
                            className="bg-green-600 text-white px-8 py-3 rounded-lg font-bold hover:bg-green-700 shadow-lg shadow-green-200 flex items-center gap-2">
                            💸 XÁC NHẬN THU TIỀN
                        </button>
                    </div>
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center h-full text-gray-400 min-h-[300px]">
                    <span className="text-6xl mb-4">⬅️</span>
                    <p className="text-lg">Chọn một bệnh nhân bên trái để tính tiền</p>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default BillingManager;