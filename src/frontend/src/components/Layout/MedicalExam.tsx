import { useState, useEffect } from 'react';
import axios from 'axios';

interface Appointment {
  id: number;
  patient_id: number;
  appointment_time: string;
  status: string;
}

interface MedicalRecord {
  id: number;
  diagnosis: string;
  prescription: string;
  notes: string;
  created_at: string;
}

const MedicalExam = () => {
  const [pendingAppts, setPendingAppts] = useState<Appointment[]>([]);
  const [selectedAppt, setSelectedAppt] = useState<Appointment | null>(null);
  const [history, setHistory] = useState<MedicalRecord[]>([]); // State lưu lịch sử
  
  // Form khám bệnh
  const [diagnosis, setDiagnosis] = useState('');
  const [prescription, setPrescription] = useState('');
  const [notes, setNotes] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadPendingAppointments();
  }, []);

  // Khi chọn bệnh nhân -> Tải ngay lịch sử cũ
  useEffect(() => {
    if (selectedAppt) {
      loadHistory(selectedAppt.patient_id);
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
      const pending = res.data.filter((a: any) => a.status === 'PENDING');
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
    } catch (error) {
      console.error("Lỗi tải lịch sử:", error);
    }
  };

 const handleSubmitExam = async () => {
    if (!selectedAppt) return;
    
    try {
      const token = localStorage.getItem('access_token');
      
      // 1. Gửi dữ liệu lên Server
      await axios.post('http://127.0.0.1:8000/api/medical/finish-exam', {
        appointment_id: selectedAppt.id,
        diagnosis,
        prescription,
        notes
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setMessage('✅ Đã lưu và cập nhật lịch sử!');

      // --- KHÚC QUAN TRỌNG: CẬP NHẬT GIAO DIỆN NGAY LẬP TỨC ---
      
      // 2. Tải lại ngay Timeline của bệnh nhân này để thấy bệnh án vừa tạo
      await loadHistory(selectedAppt.patient_id);

      // 3. Tải lại danh sách chờ (để xóa bệnh nhân này khỏi hàng chờ PENDING)
      await loadPendingAppointments();

      // 4. Reset form nhập liệu (để trống cho lần nhập sau)
      setDiagnosis(''); 
      setPrescription(''); 
      setNotes('');
      
      // Lưu ý: Mình KHÔNG set setSelectedAppt(null) ngay, 
      // để bác sĩ kịp nhìn thấy bệnh án mới hiện lên bên Timeline.
      // Nếu muốn chọn người khác, bác sĩ tự bấm bên trái.

    } catch (error) {
      alert("Lỗi khi lưu bệnh án, vui lòng thử lại!");
      console.error(error);
    }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '250px 1fr 1fr', gap: '20px' }}>
      
      {/* CỘT 1: DANH SÁCH CHỜ */}
      <div style={{ background: 'white', padding: '15px', borderRadius: '8px', border: '1px solid #ddd', height: 'fit-content' }}>
        <h3 style={{ color: '#d46b08', borderBottom: '1px solid #eee', paddingBottom: '10px', margin: 0 }}>⏳ Chờ khám</h3>
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {pendingAppts.length === 0 && <li style={{padding:'10px', color: '#999'}}>Không có ai</li>}
          {pendingAppts.map(appt => (
            <li 
              key={appt.id}
              onClick={() => setSelectedAppt(appt)}
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

      {/* CỘT 2: FORM KHÁM BỆNH */}
      <div style={{ background: 'white', padding: '20px', borderRadius: '8px', border: '1px solid #ddd' }}>
        {selectedAppt ? (
          <>
            <h3 style={{ color: '#1890ff', marginTop: 0 }}>🩺 Chẩn đoán & Kê đơn</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div>
                <label style={{fontWeight:'bold'}}>Chẩn đoán:</label>
                <textarea rows={2} style={{width:'100%', padding:'8px'}} value={diagnosis} onChange={e=>setDiagnosis(e.target.value)} />
              </div>
              <div>
                <label style={{fontWeight:'bold'}}>Đơn thuốc:</label>
                <textarea rows={4} style={{width:'100%', padding:'8px'}} value={prescription} onChange={e=>setPrescription(e.target.value)} />
              </div>
              <div>
                <label style={{fontWeight:'bold'}}>Ghi chú:</label>
                <input style={{width:'100%', padding:'8px'}} value={notes} onChange={e=>setNotes(e.target.value)} />
              </div>
              <button onClick={handleSubmitExam} style={{background:'#52c41a', color:'white', padding:'10px', border:'none', borderRadius:'4px', cursor:'pointer', fontWeight:'bold'}}>
                💾 LƯU BỆNH ÁN
              </button>
            </div>
            {message && <p style={{ color: 'green', marginTop: '10px' }}>{message}</p>}
          </>
        ) : (
          <div style={{ textAlign: 'center', color: '#999', marginTop: '50px' }}>👈 Chọn bệnh nhân để khám</div>
        )}
      </div>

      {/* CỘT 3: TIMELINE LỊCH SỬ (TÍNH NĂNG MỚI) */}
      <div style={{ background: '#f9f9f9', padding: '20px', borderRadius: '8px', border: '1px solid #ddd', maxHeight: '500px', overflowY: 'auto' }}>
        <h3 style={{ color: '#722ed1', marginTop: 0, borderBottom: '1px solid #eee', paddingBottom: '10px' }}>📜 Lịch sử khám</h3>
        
        {!selectedAppt ? (
            <p style={{color: '#999'}}>Chọn bệnh nhân để xem lịch sử.</p>
        ) : history.length === 0 ? (
            <p>Bệnh nhân này chưa có lịch sử khám.</p>
        ) : (
            <div style={{ position: 'relative', paddingLeft: '20px', borderLeft: '2px solid #d9d9d9' }}>
                {history.map(record => (
                    <div key={record.id} style={{ marginBottom: '25px', position: 'relative' }}>
                        {/* Dấu chấm tròn trên dòng thời gian */}
                        <div style={{ 
                            position: 'absolute', left: '-26px', top: '0', 
                            width: '10px', height: '10px', borderRadius: '50%', 
                            background: '#1890ff', border: '2px solid white' 
                        }}></div>
                        
                        {/* Nội dung thẻ lịch sử */}
                        <div style={{ background: 'white', padding: '10px', borderRadius: '6px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
                            <div style={{ fontSize: '0.85em', color: '#888', marginBottom: '5px' }}>
                                {new Date(record.created_at).toLocaleString()}
                            </div>
                            <div style={{ fontWeight: 'bold', color: '#cf1322' }}>{record.diagnosis}</div>
                            <div style={{ marginTop: '5px', fontSize: '0.9em', whiteSpace: 'pre-line' }}>
                                💊 {record.prescription}
                            </div>
                            {record.notes && (
                                <div style={{ marginTop: '5px', fontStyle: 'italic', fontSize: '0.85em', color: '#666' }}>
                                    Note: {record.notes}
                                </div>
                            )}
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