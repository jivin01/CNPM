import React, { useEffect, useState } from 'react';
import { Layout, Menu, Button, Card, Table, Tag, Row, Col, Statistic, Avatar, message, Modal, Input, Image, Space, Popconfirm, Divider, Form, List, Badge, Dropdown, Slider, Tooltip } from 'antd';
import { UserOutlined, UploadOutlined, LogoutOutlined, MedicineBoxOutlined, DashboardOutlined, CheckCircleOutlined, DeleteOutlined, EyeOutlined, DownloadOutlined, PieChartOutlined, SettingOutlined, TeamOutlined, SendOutlined, MessageOutlined, BellOutlined, ZoomInOutlined, ZoomOutOutlined, ReloadOutlined, BulbOutlined, FileExcelOutlined, LockOutlined, EditOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import PatientUpload from './PatientUpload';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

const { Header, Sider, Content } = Layout;
const { TextArea } = Input;

// --- HÀM XUẤT CSV (AN TOÀN) ---
const exportToCSV = (data: any[], fileName: string) => {
    if (!data || data.length === 0) {
        message.warning("Danh sách trống!"); return;
    }
    try {
        const headers = Object.keys(data[0]);
        const csvContent = [
            headers.join(","),
            ...data.map(row => headers.map(fieldName => {
                let value = row[fieldName] ? row[fieldName].toString() : "";
                value = value.replace(/"/g, '""');
                return value.includes(",") ? `"${value}"` : value;
            }).join(","))
        ].join("\n");
        const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute("href", url);
            link.setAttribute("download", `${fileName}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            message.success("Đã xuất file thành công!");
        }
    } catch (e) { console.error(e); message.error("Lỗi khi xuất file"); }
};

// --- COMPONENT THÔNG BÁO ---
const NotificationBell = () => {
    const [notifs, setNotifs] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);

    const fetchNotifs = async () => {
        const userId = localStorage.getItem('userId');
        if(!userId) return;
        try {
            const res = await axiosClient.get(`/notifications/${userId}`);
            if (Array.isArray(res.data)) {
                setNotifs(res.data);
                setUnreadCount(res.data.filter((n:any) => !n.isRead).length);
            } else { setNotifs([]); }
        } catch { setNotifs([]); }
    };

    useEffect(() => {
        fetchNotifs();
        const interval = setInterval(fetchNotifs, 5000);
        return () => clearInterval(interval);
    }, []);

    const handleRead = async (id: string) => {
        try { await axiosClient.put(`/notifications/read/${id}`); fetchNotifs(); } catch {}
    };

    const notificationContent = (
        <div style={{ background: 'white', width: 350, maxHeight: 400, overflowY: 'auto', boxShadow: '0 3px 6px rgba(0,0,0,0.15)', borderRadius: 8, border: '1px solid #eee' }}>
            <div style={{ padding: '12px 15px', fontWeight: 'bold', borderBottom: '1px solid #eee', fontSize: 16 }}>Thông báo hệ thống</div>
            {(!notifs || notifs.length === 0) ? (
                <div style={{padding: 30, textAlign:'center', color:'#999'}}>Không có thông báo mới</div>
            ) : (
                <List
                    dataSource={notifs}
                    renderItem={(item: any) => (
                        <List.Item 
                            style={{ padding: '12px 15px', background: item.isRead ? 'white' : '#e6f7ff', cursor: 'pointer', transition: '0.2s', borderBottom: '1px solid #f0f0f0' }}
                            onClick={() => handleRead(item.id)}
                        >
                            <List.Item.Meta
                                avatar={<Avatar style={{backgroundColor: item.isRead ? '#ccc' : '#1890ff'}} icon={<BellOutlined />} />}
                                title={<span style={{fontSize: 13, fontWeight: item.isRead ? 'normal' : '600'}}>{item.message}</span>}
                                description={<span style={{fontSize: 11, color: '#888'}}>{item.time}</span>}
                            />
                        </List.Item>
                    )}
                />
            )}
        </div>
    );

    return (
        <Dropdown dropdownRender={() => notificationContent} trigger={['click']} placement="bottomRight">
            <Badge count={unreadCount} overflowCount={9} style={{cursor:'pointer'}}>
                <Button shape="circle" icon={<BellOutlined />} style={{border:'none', boxShadow:'none'}} />
            </Badge>
        </Dropdown>
    );
};

// --- COMPONENT IMAGE VIEWER ---
const MedicalImageViewer = ({ src, heatmapSrc }: { src: string, heatmapSrc?: string }) => {
    const [zoom, setZoom] = useState(1);
    const [brightness, setBrightness] = useState(100);
    const [contrast, setContrast] = useState(100);
    const [invert, setInvert] = useState(false);
    const [showHeatmap, setShowHeatmap] = useState(true);

    const resetTools = () => { setZoom(1); setBrightness(100); setContrast(100); setInvert(false); setShowHeatmap(true); };
    const imageStyle = { width: '100%', transition: 'transform 0.2s', transform: `scale(${zoom})`, filter: `brightness(${brightness}%) contrast(${contrast}%) invert(${invert ? 1 : 0})`, borderRadius: 8, cursor: zoom > 1 ? 'grab' : 'default' };

    return (
        <div style={{ marginBottom: 20, border: '1px solid #d9d9d9', borderRadius: 8, padding: 10, background: '#fafafa' }}>
            <div style={{ display: 'flex', gap: 10, marginBottom: 10, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center' }}>
                <Tooltip title="Phóng to"><Button icon={<ZoomInOutlined />} onClick={() => setZoom(prev => prev + 0.2)} /></Tooltip>
                <Tooltip title="Thu nhỏ"><Button icon={<ZoomOutOutlined />} onClick={() => setZoom(prev => Math.max(1, prev - 0.2))} /></Tooltip>
                <Tooltip title="Đặt lại"><Button icon={<ReloadOutlined />} onClick={resetTools} /></Tooltip>
                <Divider type="vertical" />
                <Tooltip title="Đảo ngược màu"><Button type={invert ? 'primary' : 'default'} onClick={() => setInvert(!invert)}>Invert</Button></Tooltip>
                {heatmapSrc && <Tooltip title="Bật/Tắt Heatmap"><Button type={showHeatmap ? 'primary' : 'default'} onClick={() => setShowHeatmap(!showHeatmap)}>AI Heatmap</Button></Tooltip>}
            </div>
            <div style={{ display: 'flex', gap: 20, padding: '0 20px', fontSize: 12, marginBottom: 10 }}>
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10 }}><BulbOutlined /> <span>Độ sáng:</span><Slider min={50} max={150} value={brightness} onChange={setBrightness} style={{flex: 1}} /></div>
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10 }}><span>Tương phản:</span><Slider min={50} max={150} value={contrast} onChange={setContrast} style={{flex: 1}} /></div>
            </div>
            <div style={{ overflow: 'hidden', height: 350, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#000', borderRadius: 8, position: 'relative' }}>
                {heatmapSrc && showHeatmap ? (<div style={{ position: 'relative', width: '100%', height: '100%' }}><img src={src} style={{ ...imageStyle, position: 'absolute', top: 0, left: 0, objectFit: 'contain', height: '100%' }} alt="Original" /><div style={{ ...imageStyle, position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(255, 0, 0, 0.3)', mixBlendMode: 'multiply', pointerEvents: 'none' }}></div></div>) : (<img src={src} style={{ ...imageStyle, objectFit: 'contain', height: '100%' }} alt="Scan" />)}
            </div>
        </div>
    );
};

// --- COMPONENT CHAT ---
const CommentSection = ({ imageId }: { imageId: string }) => {
    const [comments, setComments] = useState([]); const [text, setText] = useState(""); const [loading, setLoading] = useState(false);
    const fetchComments = async () => { try { const res = await axiosClient.get(`/comments/${imageId}`); if(Array.isArray(res.data)) setComments(res.data); } catch {} };
    useEffect(() => { fetchComments(); }, [imageId]);
    const handleSend = async () => { if (!text.trim()) return; setLoading(true); try { await axiosClient.post('/comment', { image_id: imageId, user_id: localStorage.getItem('userId'), content: text }); setText(""); fetchComments(); } catch { message.error("Lỗi gửi tin"); } finally { setLoading(false); } };
    return (<div style={{ marginTop: 20, borderTop: '1px solid #eee', paddingTop: 20 }}><h4><MessageOutlined /> Trao đổi & Thảo luận</h4><div style={{ maxHeight: 200, overflowY: 'auto', background: '#f9f9f9', padding: 10, borderRadius: 8, marginBottom: 10 }}>{comments.length === 0 ? <p style={{color:'#ccc', textAlign:'center'}}>Chưa có tin nhắn nào</p> : (<List dataSource={comments} renderItem={(item: any) => (<List.Item style={{ padding: '8px 0', border: 'none' }}><List.Item.Meta avatar={<Avatar style={{ backgroundColor: item.role === 'Doctor' ? '#87d068' : '#1890ff' }} icon={<UserOutlined />} />} title={<span style={{fontSize:12, color:'#888'}}>{item.user} ({item.role}) - {item.time}</span>} description={<div style={{background:'white', padding:'8px 12px', borderRadius:8, display:'inline-block', border:'1px solid #eee'}}>{item.content}</div>} /></List.Item>)} />)}</div><div style={{ display: 'flex', gap: 10 }}><Input value={text} onChange={e => setText(e.target.value)} placeholder="Nhập tin nhắn..." onPressEnter={handleSend} /><Button type="primary" icon={<SendOutlined />} onClick={handleSend} loading={loading}>Gửi</Button></div></div>);
};

// --- ADMIN VIEW ---
const AdminView = () => {
  const [users, setUsers] = useState([]); const [loading, setLoading] = useState(false);
  const fetchUsers = async () => { setLoading(true); try { const res = await axiosClient.get('/admin/users'); setUsers(res.data); } catch(e) {} finally { setLoading(false); } };
  useEffect(() => { fetchUsers(); }, []);
  const handleDeleteUser = async (id: string) => { try { await axiosClient.delete(`/admin/user/${id}`); message.success("Đã xóa"); fetchUsers(); } catch { message.error("Lỗi"); } };
  
  const handleExport = () => {
      const data = users.map((u: any) => ({ "ID": u.key, "Tên": u.name, "Email": u.email, "Vai trò": u.role, "Ngày tạo": u.joined }));
      exportToCSV(data, 'Danh_sach_User');
  };

  const columns = [{ title: 'Họ tên', dataIndex: 'name', render: (t:string) => <b>{t}</b> }, { title: 'Email', dataIndex: 'email' }, { title: 'Vai trò', dataIndex: 'role', render: (r: string) => <Tag color={r==='Admin'?'red':(r==='Doctor'?'blue':'green')}>{r}</Tag> }, { title: 'Tham gia', dataIndex: 'joined' }, { title: 'Hành động', render: (_, r: any) => r.role !== 'Admin' && <Popconfirm title="Xóa?" onConfirm={() => handleDeleteUser(r.key)}><Button danger icon={<DeleteOutlined />} size="small">Xóa</Button></Popconfirm> }];
  
  return (
    <Card title="Quản trị Hệ thống" extra={<Button type="primary" icon={<FileExcelOutlined />} style={{background: '#217346', borderColor: '#217346'}} onClick={handleExport}>Xuất CSV</Button>}>
        <Statistic title="Thành viên" value={users.length} prefix={<TeamOutlined />} style={{marginBottom:20}} />
        <Table dataSource={users} columns={columns} loading={loading} rowKey="key" />
    </Card>
  );
};

// --- DOCTOR VIEW ---
const DoctorView = () => {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [doctorNote, setDoctorNote] = useState("");
  const fetchPatients = async () => { setLoading(true); try { const res = await axiosClient.get('/doctor/pending'); setPatients(res.data); } finally { setLoading(false); } };
  useEffect(() => { fetchPatients(); }, []);
  const handleSubmitReview = async () => {
    const doctorId = localStorage.getItem('userId'); if (!doctorId) { message.error("Lỗi: Đăng nhập lại!"); return; }
    try { const fd = new FormData(); fd.append('image_id', selectedRecord.key); fd.append('doctor_id', doctorId); fd.append('conclusion', doctorNote); await axiosClient.post('/doctor/review', fd, { headers: { "Content-Type": "multipart/form-data" } }); message.success('Đã lưu kết quả!'); setIsModalOpen(false); fetchPatients(); } catch { message.error('Lỗi khi lưu'); }
  };
  const handleExport = () => {
      const data = patients.map((p: any) => ({ "Bệnh nhân": p.patient, "Ngày": p.time, "Chẩn đoán": p.risk, "Điểm": p.riskScore, "Trạng thái": p.status }));
      exportToCSV(data, 'DS_Benh_nhan');
  };
  const columns = [{ title: 'Bệnh nhân', dataIndex: 'patient' }, { title: 'Rủi ro', dataIndex: 'risk', render:(t:any)=><Tag color={t.includes('cao')?'red':'green'}>{t}</Tag> }, { title: 'Trạng thái', dataIndex: 'status', render:(t:any)=><Tag color={t==='Reviewed'?'green':'orange'}>{t}</Tag> }, { title: 'Hành động', render: (_, r: any) => <Button type="primary" size="small" onClick={()=>{setSelectedRecord(r); setIsModalOpen(true)}}>Xem / Duyệt</Button> }];
  return (
    <div>
      <Card title="Danh sách bệnh nhân" extra={<Button type="primary" icon={<FileExcelOutlined />} style={{background: '#217346', borderColor: '#217346'}} onClick={handleExport}>Xuất CSV</Button>}>
        <Table dataSource={patients} columns={columns} loading={loading} rowKey="key" locale={{emptyText: 'Chưa có dữ liệu để xuất'}} />
      </Card>
      <Modal title="Thẩm định Chuyên sâu" open={isModalOpen} onOk={handleSubmitReview} onCancel={()=>setIsModalOpen(false)} width={900} okText="Lưu kết luận" style={{top: 20}}>
        {selectedRecord && (<Row gutter={24}><Col span={14}><MedicalImageViewer src={selectedRecord.image_url} heatmapSrc={selectedRecord.image_url} /></Col><Col span={10}><div style={{marginBottom: 15, padding: 10, background: '#f5f5f5', borderRadius: 8}}><p><b>Mã HS:</b> {selectedRecord.key.substring(0,8)}</p><p><b>AI Đánh giá:</b> <Tag color="red">{selectedRecord.risk}</Tag></p><p><b>Điểm rủi ro:</b> {selectedRecord.riskScore}%</p></div><p><b>Kết luận của Bác sĩ:</b></p><TextArea rows={4} value={doctorNote} onChange={(e)=>setDoctorNote(e.target.value)} placeholder="Nhập chẩn đoán..." /><CommentSection imageId={selectedRecord.key} /></Col></Row>)}
      </Modal>
    </div>
  );
};

// --- PROFILE VIEW (ĐÃ FIX LỖI MÀN HÌNH TRẮNG) ---
const ProfileView = () => {
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  
  // Lấy data an toàn (tránh null gây lỗi)
  const userFullName = localStorage.getItem('userFullName') || '';

  const onUpdate = async (values: any) => {
    setLoading(true);
    try { 
        const res = await axiosClient.put(`/user/${localStorage.getItem('userId')}`, values); 
        message.success('Thành công!'); 
        localStorage.setItem('userFullName', res.data.fullName); 
        if (values.password) { 
            message.warning('Mật khẩu đã đổi. Vui lòng đăng nhập lại...'); 
            setTimeout(() => { localStorage.clear(); window.location.href = '/login'; }, 1500); 
        } else { 
            window.location.reload(); 
        } 
    } catch { 
        message.error('Lỗi cập nhật!'); 
    } finally { 
        setLoading(false); 
    }
  };

  return (
    <div style={{ maxWidth: 600, margin: '0 auto' }}>
      <Card title="Cài đặt tài khoản">
        <div style={{ textAlign: 'center', marginBottom: 30 }}>
          <Avatar size={80} icon={<UserOutlined />} style={{backgroundColor: '#1890ff'}} />
          <h2 style={{ marginTop: 10, marginBottom: 0 }}>{userFullName || 'Người dùng'}</h2>
          <Tag color="blue">{localStorage.getItem('userRole')}</Tag>
        </div>
        
        {/* Dùng initialValues thay vì useEffect để tránh lỗi form */}
        <Form form={form} layout="vertical" onFinish={onUpdate} initialValues={{ full_name: userFullName }}>
          <Form.Item label="Họ và Tên" name="full_name" rules={[{ required: true, message: 'Vui lòng nhập họ tên' }]}>
            <Input prefix={<EditOutlined />} />
          </Form.Item>
          <Divider orientation="left" plain>Bảo mật</Divider>
          <Form.Item label="Mật khẩu mới (Để trống nếu không đổi)" name="password">
            <Input.Password prefix={<LockOutlined />} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block size="large">Lưu thay đổi</Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

const AnalyticsView = () => {
  const [stats, setStats] = useState<any>(null);
  useEffect(() => { axiosClient.get('/statistics').then(res => setStats(res.data)).catch(console.error); }, []);
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];
  if (!stats) return <div>Loading...</div>;
  return (<div><Row gutter={16} style={{ marginBottom: 20 }}><Col span={8}><Card bordered={false} style={{borderRadius: 10, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'}}><Statistic title={<span style={{color: 'white'}}>Tổng bệnh nhân</span>} value={stats.summary.patients} valueStyle={{color: 'white'}} prefix={<UserOutlined />} /></Card></Col><Col span={8}><Card bordered={false} style={{borderRadius: 10, background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)'}}><Statistic title={<span style={{color: 'white'}}>Tổng ca chụp</span>} value={stats.summary.scans} valueStyle={{color: 'white'}} prefix={<MedicineBoxOutlined />} /></Card></Col><Col span={8}><Card bordered={false} style={{borderRadius: 10, background: 'linear-gradient(135deg, #ff9966 0%, #ff5e62 100%)'}}><Statistic title={<span style={{color: 'white'}}>Chờ thẩm định</span>} value={stats.summary.pending} valueStyle={{color: 'white'}} prefix={<CheckCircleOutlined />} /></Card></Col></Row><Row gutter={16}><Col span={12}><Card title="Phân bố Rủi ro"><div style={{ width: '100%', height: 300 }}><ResponsiveContainer><PieChart><Pie data={stats.chart_data} cx="50%" cy="50%" outerRadius={100} fill="#8884d8" dataKey="value" label>{stats.chart_data.map((entry: any, index: number) => (<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />))}</Pie><RechartsTooltip /><Legend /></PieChart></ResponsiveContainer></div></Card></Col><Col span={12}><Card title="Hoạt động"><div style={{ width: '100%', height: 300 }}><ResponsiveContainer><BarChart data={stats.chart_data}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" /><YAxis /><RechartsTooltip /><Bar dataKey="value" fill="#8884d8" /></BarChart></ResponsiveContainer></div></Card></Col></Row></div>);
};

const PatientView = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [pdfLoading, setPdfLoading] = useState(false); 
  const fetchHistory = async () => { const userId = localStorage.getItem('userId'); if (!userId) return; setLoading(true); try { const res = await axiosClient.get(`/history/${userId}`); setHistory(res.data); } catch { } finally { setLoading(false); } };
  useEffect(() => { fetchHistory(); }, []);
  const handleDelete = async (id: string) => { try { await axiosClient.delete(`/image/${id}`); message.success("Đã xóa"); fetchHistory(); } catch { message.error("Lỗi"); } };
  const handleDownloadPDF = async () => { const input = document.getElementById('report'); if (!input) return; setPdfLoading(true); try { const canvas = await html2canvas(input, { scale: 2, useCORS: true, allowTaint: true }); const pdf = new jsPDF('p', 'mm', 'a4'); pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, 210, (canvas.height * 210) / canvas.width); pdf.save(`Ketqua_${selectedRecord.id}.pdf`); message.success("Đã tải!"); } catch { message.error("Lỗi PDF"); } finally { setPdfLoading(false); } };
  const columns = [{ title: 'Ngày', dataIndex: 'date' }, { title: 'Mã', dataIndex: 'id' }, { title: 'Kết quả', dataIndex: 'result', render: (t:any)=><Tag color={t.includes('cao')?'red':'green'}>{t}</Tag> }, { title: 'Trạng thái', dataIndex: 'status', render: (t:any)=><Tag color={t==='Đã duyệt'?'blue':'orange'}>{t}</Tag> }, { title: 'Hành động', render: (_, r: any) => (<Space><Button icon={<EyeOutlined />} size="small" onClick={()=>{setSelectedRecord(r); setIsModalOpen(true)}}>Xem</Button><Popconfirm title="Xóa?" onConfirm={()=>handleDelete(r.key)}><Button danger icon={<DeleteOutlined />} size="small" /></Popconfirm></Space>) }];
  return (
    <div>
      <PatientUpload onUploadSuccess={fetchHistory} />
      <Card title="Hồ sơ" style={{marginTop:20}}><Table dataSource={history} columns={columns} loading={loading} rowKey="key" /></Card>
      <Modal title="Chi tiết Hồ sơ" open={isModalOpen} onCancel={()=>setIsModalOpen(false)} footer={[<Button onClick={()=>setIsModalOpen(false)}>Đóng</Button>, <Button type="primary" icon={<DownloadOutlined />} loading={pdfLoading} onClick={handleDownloadPDF}>Tải PDF</Button>]} width={900} style={{top: 20}}>
        {selectedRecord && (
            <Row gutter={24}>
                <Col span={14}><MedicalImageViewer src={selectedRecord.image_url} heatmapSrc={selectedRecord.image_url} /></Col>
                <Col span={10}>
                    <div id="report" style={{padding:15, background:'white', border:'1px solid #eee', borderRadius:8, marginBottom:10}}><h3 style={{color:'#1890ff', margin:0}}>KẾT QUẢ KHÁM</h3><p style={{marginTop:10}}><strong>AI:</strong> {selectedRecord.result}</p><p><strong>Bác sĩ:</strong> {selectedRecord.doctor_conclusion || 'Chưa có'}</p></div>
                    <CommentSection imageId={selectedRecord.key} />
                </Col>
            </Row>
        )}
      </Modal>
    </div>
  );
};

const Dashboard: React.FC = () => {
  const navigate = useNavigate(); const [role, setRole] = useState<string | null>(null); const [fullName, setFullName] = useState<string>('User'); const [collapsed, setCollapsed] = useState(false); const [currentKey, setCurrentKey] = useState('1'); 
  useEffect(() => { const r = localStorage.getItem('userRole'); if (!r) navigate('/login'); setRole(r); setFullName(localStorage.getItem('userFullName') || 'User'); if (r === 'Patient') setCurrentKey('2'); if (r === 'Admin') setCurrentKey('admin'); }, [navigate]);
  const renderContent = () => { if (currentKey === 'setting') return <ProfileView />; if (role === 'Admin') return <AdminView />; if (role === 'Doctor') return currentKey === '1' ? <AnalyticsView /> : <DoctorView />; return <PatientView />; };
  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider collapsible collapsed={collapsed} onCollapse={setCollapsed} theme="light"><div style={{ height: 64, margin: 16, background: 'rgba(79, 172, 254, 0.1)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4facfe', fontWeight: 'bold' }}>{collapsed ? 'AURA' : 'AURA SYSTEM'}</div><Menu theme="light" selectedKeys={[currentKey]} mode="inline" onClick={(e) => setCurrentKey(e.key)}>{role === 'Admin' && <Menu.Item key="admin" icon={<TeamOutlined />}>Quản trị User</Menu.Item>}{role === 'Doctor' && <Menu.Item key="1" icon={<PieChartOutlined />}>Tổng quan</Menu.Item>}{role === 'Doctor' && <Menu.Item key="2" icon={<UserOutlined />}>Quản lý Bệnh nhân</Menu.Item>}{role === 'Patient' && <Menu.Item key="2" icon={<UploadOutlined />}>Hồ sơ</Menu.Item>}<Menu.Item key="setting" icon={<SettingOutlined />}>Cài đặt</Menu.Item></Menu></Sider>
      <Layout><Header style={{ background: '#fff', padding: '0 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><span style={{ fontSize: 18, fontWeight: 600 }}>{role === 'Admin' ? 'Administrator' : (role === 'Doctor' ? 'Bác sĩ' : 'Bệnh nhân')}</span><div style={{ display: 'flex', alignItems: 'center', gap: 15 }}><NotificationBell /><span>Chào, <b>{fullName}</b></span><Button type="text" danger onClick={()=>{localStorage.clear(); navigate('/login')}} icon={<LogoutOutlined />}>Thoát</Button></div></Header><Content style={{ margin: '16px', padding: 24, background: '#f0f2f5' }}>{renderContent()}</Content></Layout>
    </Layout>
  );
};
export default Dashboard;