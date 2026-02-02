import React from 'react';
// --- DÒNG QUAN TRỌNG: Đã thêm Tag vào danh sách import ---
import { Button, Row, Col, Card, Typography, Layout, Space, Tag } from 'antd'; 
import { UserAddOutlined, ThunderboltFilled, SafetyCertificateFilled, MedicineBoxFilled, GithubOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const { Header, Content, Footer } = Layout;
const { Title, Paragraph, Text } = Typography;

const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Layout className="layout" style={{ minHeight: '100vh', background: '#fff' }}>
      {/* --- HEADER --- */}
      <Header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'white', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', padding: '0 50px' }}>
        <div className="logo" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 40, height: 40, background: 'linear-gradient(135deg, #1890ff 0%, #36cfc9 100%)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold', fontSize: 20 }}>A</div>
            <span style={{ fontSize: 22, fontWeight: 700, color: '#333', fontFamily: 'Arial' }}>AURA SYSTEM</span>
        </div>
        <Space>
            <Button type="text" onClick={() => navigate('/login')}>Đăng nhập</Button>
            <Button type="primary" shape="round" icon={<UserAddOutlined />} onClick={() => navigate('/register')}>Đăng ký ngay</Button>
        </Space>
      </Header>

      {/* --- CONTENT --- */}
      <Content style={{ padding: '0' }}>
        
        {/* HERO SECTION */}
        <div style={{ background: 'linear-gradient(135deg, #f0f5ff 0%, #e6f7ff 100%)', padding: '100px 50px', textAlign: 'center' }}>
            <Row justify="center" align="middle">
                <Col xs={24} md={12} style={{ textAlign: 'left' }}>
                    <Tag color="blue" style={{ marginBottom: 20, padding: '5px 15px', borderRadius: 20 }}>Công nghệ AI 2026</Tag>
                    <Title style={{ fontSize: 54, marginBottom: 20, lineHeight: 1.2 }}>
                        Tầm soát Võng mạc <br/> <span style={{ color: '#1890ff' }}>Chỉ trong 10 giây</span>
                    </Title>
                    <Paragraph style={{ fontSize: 18, color: '#666', marginBottom: 40, maxWidth: 500 }}>
                        Hệ thống sử dụng Trí tuệ nhân tạo (AI) để phân tích tổn thương đáy mắt, hỗ trợ bác sĩ chẩn đoán sớm các bệnh lý về mắt và tim mạch với độ chính xác lên tới 98%.
                    </Paragraph>
                    <Space size="large">
                        <Button type="primary" size="large" shape="round" style={{ height: 50, padding: '0 40px', fontSize: 18 }} onClick={() => navigate('/register')}>
                            Trải nghiệm miễn phí
                        </Button>
                        <Button size="large" shape="round" style={{ height: 50, padding: '0 30px', fontSize: 18 }} onClick={() => navigate('/login')}>
                            Dành cho Bác sĩ
                        </Button>
                    </Space>
                </Col>
                <Col xs={24} md={10}>
                    <img 
                        src="https://img.freepik.com/free-vector/oculist-concept-illustration_114360-1237.jpg" 
                        alt="Medical AI" 
                        style={{ width: '100%', borderRadius: 20, boxShadow: '0 20px 50px rgba(24, 144, 255, 0.2)' }}
                    />
                </Col>
            </Row>
        </div>

        {/* FEATURES SECTION */}
        <div style={{ padding: '80px 50px', maxWidth: 1200, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: 60 }}>
                <Title level={2}>Tại sao chọn AURA?</Title>
                <Paragraph type="secondary">Giải pháp toàn diện kết hợp giữa AI tiên tiến và chuyên gia y tế hàng đầu</Paragraph>
            </div>
            
            <Row gutter={[32, 32]}>
                <Col xs={24} md={8}>
                    <Card hoverable style={{ textAlign: 'center', borderRadius: 15, border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}>
                        <ThunderboltFilled style={{ fontSize: 40, color: '#faad14', marginBottom: 20 }} />
                        <Title level={4}>AI Phân tích Tốc độ cao</Title>
                        <Paragraph style={{ color: '#777' }}>
                            Trả kết quả chẩn đoán sơ bộ chỉ trong 10-20 giây nhờ mô hình Deep Learning được huấn luyện trên 1 triệu ảnh bệnh án.
                        </Paragraph>
                    </Card>
                </Col>
                <Col xs={24} md={8}>
                    <Card hoverable style={{ textAlign: 'center', borderRadius: 15, border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}>
                        <MedicineBoxFilled style={{ fontSize: 40, color: '#1890ff', marginBottom: 20 }} />
                        <Title level={4}>Thẩm định bởi Bác sĩ</Title>
                        <Paragraph style={{ color: '#777' }}>
                            Kết quả AI luôn được kiểm tra lại bởi đội ngũ bác sĩ chuyên khoa để đảm bảo độ chính xác tuyệt đối và đưa ra lời khuyên.
                        </Paragraph>
                    </Card>
                </Col>
                <Col xs={24} md={8}>
                    <Card hoverable style={{ textAlign: 'center', borderRadius: 15, border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}>
                        <SafetyCertificateFilled style={{ fontSize: 40, color: '#52c41a', marginBottom: 20 }} />
                        <Title level={4}>Bảo mật Chuẩn Y tế</Title>
                        <Paragraph style={{ color: '#777' }}>
                            Dữ liệu bệnh nhân được mã hóa và bảo vệ nghiêm ngặt theo tiêu chuẩn HIPAA, đảm bảo quyền riêng tư tối đa.
                        </Paragraph>
                    </Card>
                </Col>
            </Row>
        </div>

      </Content>

      {/* --- FOOTER --- */}
      <Footer style={{ textAlign: 'center', background: '#001529', color: 'rgba(255,255,255,0.65)', padding: '40px 50px' }}>
        <Row justify="space-between" align="middle">
            <Col>
                <Title level={4} style={{ color: 'white', margin: 0 }}>AURA SYSTEM</Title>
                <Text style={{ color: 'gray' }}>©2026 Designed for Better Health</Text>
            </Col>
            <Col>
                <Space size="large">
                    <GithubOutlined style={{ fontSize: 24, cursor: 'pointer' }} />
                    <span>Điều khoản</span>
                    <span>Chính sách</span>
                    <span>Liên hệ: 1900-AURA</span>
                </Space>
            </Col>
        </Row>
      </Footer>
    </Layout>
  );
};

export default LandingPage;