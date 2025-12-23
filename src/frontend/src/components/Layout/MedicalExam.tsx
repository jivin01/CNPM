import { useState, useEffect } from 'react';
import axios from 'axios';
// Import Component Kê Đơn mới
// Đảm bảo file PrescriptionForm.tsx nằm cùng thư mục với file này
import PrescriptionForm from './PrescriptionForm'; 

interface Appointment {
  id: number;
  patient_id: number;
  appointment_time: string;
  status: string;
}

interface MedicalRecord {
  id: number;
  diagnosis: string;
  prescription: string; // Vẫn giữ field này để hiển thị tóm tắt
  notes: string;
  created_at: string;
}

const MedicalExam = () => {
  const [pendingAppts, setPendingAppts] = useState<Appointment[]>([]);
  const [selectedAppt, setSelectedAppt] = useState<Appointment | null>(null);
  const [history, setHistory] = useState<MedicalRecord[]>([]);
  
  // State form nhập liệu
  const [diagnosis, setDiagnosis] = useState('');
  const [notes, setNotes] = useState('');
  
  // State quản lý quy trình khám
  const [message, setMessage] = useState('');
  const [createdRecordId, setCreatedRecordId] = useState<number | null>(null); // Quan trọng: ID bệnh án vừa tạo

  useEffect(() => {
    loadPendingAppointments();
  }, []);

  useEffect(() => {
    if (selectedAppt) {
      loadHistory(selectedAppt.patient_id);
      // Reset lại trạng thái khi chọn người mới
      setCreatedRecordId(null);
      setDiagnosis('');
      setNotes('');
      setMessage('');
    } else {
      setHistory([]);
    }
  }, [selectedAppt]);

  const loadPendingAppointments = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const res = await axios.get('http://127.0.0.1:8000/api/appointments', {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Lọc các trạng thái chờ (check cả hoa cả thường cho chắc)
      const pending = res.data.filter((a: any) => a.status === 'pending' || a.status === 'PENDING');
      setPendingAppts(pending);
    } catch (error) {
      console.error(error);
    }
  };

  const loadHistory = async (patientId: number) => {
    try {
      const token = localStorage.getItem('access_token');
      const res = await axios.get(`http://127.0.0.1:8000/api/medical/history/${patientId}`, {
         headers: { Authorization: `Bearer ${token}` }
      });
      setHistory(res.data);
      return res.data; // Trả về data để dùng cho hàm khác nếu cần
    } catch (error) {
      console.error("Lỗi tải lịch sử:", error);
      return [];
    }
  };

  // --- HÀM SỬA CHÍNH: LƯU CHẨN ĐOÁN & TẠO BỆNH ÁN ---
  const handleSaveDiagnosis = async () => {
    if (!selectedAppt) return;
    if (!diagnosis) return alert("Vui lòng nhập chẩn đoán!");

    try {
      const token = localStorage.getItem('access_token');
      
      // 1. Gọi API Lưu Chẩn Đoán
      const res = await axios.post('http://127.0.0.1:8000/api/medical/finish-exam', {
        appointment_id: selectedAppt.id,
        diagnosis: diagnosis,
        prescription: "Xem chi tiết đơn thuốc (New)", 
        notes: notes
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      console.log("Save response:", res.data); // Log để debug

      // 2. CHIẾN THUẬT MỚI: Tự động tải lại lịch sử ngay lập tức
      // Việc này giúp cập nhật cột bên phải VÀ tìm ID vừa tạo
      const updatedHistory = await loadHistory(selectedAppt.patient_id);
      
      // 3. Tìm ID của bệnh án mới nhất
      let newId = null;

      // Ưu tiên 1: Lấy từ phản hồi API nếu có
      if (res.data && res.data.id) {
        newId = res.data.id;
      } 
      // Ưu tiên 2: Nếu API không trả ID, tìm trong lịch sử vừa tải về
      else if (updatedHistory && updatedHistory.length > 0) {
        // Sắp xếp giảm dần theo ID (ID lớn nhất là mới nhất)
        const sorted = [...updatedHistory].sort((a: any, b: any) => b.id - a.id);
        newId = sorted[0].id;
      }

      // 4. Cập nhật giao diện
      if (newId) {
        setCreatedRecordId(newId); // Kích hoạt bước 2 (Kê đơn)
        setMessage('✅ Đã lưu chẩn đoán! Hãy tiếp tục kê đơn.');
      } else {
        alert("Đã lưu nhưng không tìm thấy ID bệnh án. Vui lòng thử lại hoặc kiểm tra mạng.");
      }

    } catch (error) {
      alert("Lỗi khi lưu bệnh án. Vui lòng kiểm tra lại server.");
      console.error(error);
    }
  };

  // BƯỚC 3: HOÀN TẤT KHÁM
  const handleFinishExam = async () => {
    await loadPendingAppointments(); // Refresh danh sách chờ
    setSelectedAppt(null); // Bỏ chọn bệnh nhân
    setCreatedRecordId(null);
    setMessage('');
    alert("Đã hoàn tất ca khám!");
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '250px 1fr 1fr', gap: '20px', minHeight: '500px' }}>
      
      {/* CỘT 1: DANH SÁCH CHỜ */}
      <div style={{ background: 'white', padding: '15px', borderRadius: '8px', border: '1px solid #ddd', height: 'fit-content' }}>
        <h3 style={{ color: '#d46b08', borderBottom: '1px solid #eee', paddingBottom: '10px', margin: 0 }}>⏳ Chờ khám</h3>
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {pendingAppts.length === 0 && <li style={{padding:'10px', color: '#999'}}>Không có ai</li>}
          {pendingAppts.map(appt => (
            <li 
              key={appt.id}
              onClick={() => {
                  if (createdRecordId) {
                      if(!window.confirm("Đang khám dở, bạn có chắc muốn đổi người?")) return;
                  }
                  setSelectedAppt(appt)
              }}
              style={{ 
                padding: '12px', 
                borderBottom: '1px solid #eee', 
                cursor: 'pointer',
                background: selectedAppt?.id === appt.id ? '#e6f7ff' : 'transparent',
                fontWeight: selectedAppt?.id === appt.id ? 'bold' : 'normal',
                color: selectedAppt?.id === appt.id ? '#1890ff' : '#333'
              }}
            >
              <div>Bệnh nhân #{appt.patient_id}</div>
              <div style={{ fontSize: '0.8em', color: '#666' }}>{new Date(appt.appointment_time).toLocaleString()}</div>
            </li>
          ))}
        </ul>
      </div>

      {/* CỘT 2: KHU VỰC KHÁM BỆNH */}
      <div style={{ background: 'white', padding: '20px', borderRadius: '8px', border: '1px solid #ddd' }}>
        {selectedAppt ? (
          <>
            <h3 style={{ color: '#1890ff', marginTop: 0 }}>
                {createdRecordId ? '💊 Bước 2: Kê Đơn Thuốc' : '🩺 Bước 1: Chẩn đoán'}
            </h3>

            {/* FORM CHẨN ĐOÁN (Chỉ hiện khi chưa tạo bệnh án) */}
            {!createdRecordId && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  <div>
                    <label style={{fontWeight:'bold'}}>Chẩn đoán bệnh:</label>
                    <textarea 
                        rows={3} 
                        style={{width:'100%', padding:'8px', border:'1px solid #ccc', borderRadius:'4px'}} 
                        value={diagnosis} 
                        onChange={e=>setDiagnosis(e.target.value)} 
                        placeholder="Ví dụ: Viêm họng cấp..."
                    />
                  </div>
                  <div>
                    <label style={{fontWeight:'bold'}}>Ghi chú (Lời dặn):</label>
                    <input 
                        style={{width:'100%', padding:'8px', border:'1px solid #ccc', borderRadius:'4px'}} 
                        value={notes} 
                        onChange={e=>setNotes(e.target.value)} 
                        placeholder="Ví dụ: Kiêng nước đá..."
                    />
                  </div>
                  
                  <button 
                    onClick={handleSaveDiagnosis} 
                    style={{
                        marginTop: '10px',
                        background: '#1890ff', 
                        color: 'white', 
                        padding: '12px', 
                        border: 'none', 
                        borderRadius: '4px', 
                        cursor: 'pointer', 
                        fontWeight: 'bold',
                        fontSize: '16px'
                    }}
                  >
                    LƯU CHẨN ĐOÁN & TIẾP TỤC ➡️
                  </button>
                </div>
            )}

            {/* FORM KÊ ĐƠN (Chỉ hiện sau khi đã lưu chẩn đoán) */}
            {createdRecordId && (
                <div style={{ animation: 'fadeIn 0.5s' }}>
                    <div style={{background: '#f6ffed', padding: '10px', border: '1px solid #b7eb8f', borderRadius: '4px', marginBottom: '10px'}}>
                        ✅ <b>Đã tạo bệnh án!</b> ID: {createdRecordId} <br/>
                        <i>Vui lòng chọn thuốc bên dưới.</i>
                    </div>

                    {/* NHÚNG COMPONENT KÊ ĐƠN VÀO ĐÂY */}
                    <PrescriptionForm medicalRecordId={createdRecordId} />

                    <hr style={{margin: '20px 0'}} />
                    
                    <button 
                        onClick={handleFinishExam}
                        style={{
                            width: '100%',
                            background: '#52c41a', 
                            color: 'white', 
                            padding: '12px', 
                            border: 'none', 
                            borderRadius: '4px', 
                            cursor: 'pointer', 
                            fontWeight: 'bold',
                            fontSize: '16px',
                            boxShadow: '0 4px 10px rgba(82, 196, 26, 0.3)'
                        }}
                    >
                        🏁 HOÀN TẤT CA KHÁM
                    </button>
                </div>
            )}
            
            {message && !createdRecordId && <p style={{color: 'red'}}>{message}</p>}

          </>
        ) : (
          <div style={{ textAlign: 'center', color: '#999', marginTop: '50px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <span style={{fontSize: '40px'}}>👈</span>
            <span>Chọn bệnh nhân từ danh sách chờ để bắt đầu khám</span>
          </div>
        )}
      </div>

      {/* CỘT 3: TIMELINE LỊCH SỬ */}
      <div style={{ background: '#f9f9f9', padding: '20px', borderRadius: '8px', border: '1px solid #ddd', maxHeight: '600px', overflowY: 'auto' }}>
        <h3 style={{ color: '#722ed1', marginTop: 0, borderBottom: '1px solid #eee', paddingBottom: '10px' }}>📜 Lịch sử khám</h3>
        
        {!selectedAppt ? (
            <p style={{color: '#999'}}>...</p>
        ) : history.length === 0 ? (
            <p>Chưa có lịch sử khám.</p>
        ) : (
            <div style={{ position: 'relative', paddingLeft: '20px', borderLeft: '2px solid #d9d9d9' }}>
                {history.map(record => (
                    <div key={record.id} style={{ marginBottom: '25px', position: 'relative' }}>
                        <div style={{ 
                            position: 'absolute', left: '-26px', top: '0', 
                            width: '10px', height: '10px', borderRadius: '50%', 
                            background: '#1890ff', border: '2px solid white' 
                        }}></div>
                        
                        <div style={{ background: 'white', padding: '10px', borderRadius: '6px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
                            <div style={{ fontSize: '0.85em', color: '#888', marginBottom: '5px' }}>
                                {new Date(record.created_at).toLocaleString()}
                            </div>
                            <div style={{ fontWeight: 'bold', color: '#c40d1dff', fontSize: '1.1em' }}>{record.diagnosis}</div>
                            
                            {record.notes && (
                                <div style={{ marginTop: '5px', fontStyle: 'italic', fontSize: '0.9em', color: '#555' }}>
                                    Note: {record.notes}
                                </div>
                            )}

                            <div style={{ marginTop: '8px', fontSize: '0.85em', color: '#1890ff', cursor: 'pointer', textDecoration: 'underline' }}>
                                💊 Xem đơn thuốc chi tiết
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        )}
      </div>

    </div>
  );
};

export default MedicalExam;