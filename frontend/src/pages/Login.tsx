import React from 'react';
import { Form, Input, Button, message } from 'antd';
import { useNavigate } from 'react-router-dom';
import { 
  LinkedinOutlined, 
  InstagramOutlined, 
  FacebookOutlined, 
  TwitterOutlined,
  HeartFilled
} from '@ant-design/icons';
import axiosClient from '../api/axiosClient';
import './Auth.css';

const Login: React.FC = () => {
  const navigate = useNavigate();

  const onFinish = async (values: any) => {
    try {
      const response = await axiosClient.post('/login', values);
      message.success('Đăng nhập thành công!');
      
      // Lấy dữ liệu user từ phản hồi Backend
      const userData = response.data.user; 
      
      // Lưu vào LocalStorage để các trang khác sử dụng
      if (userData) {
          localStorage.setItem('userRole', userData.role);
          localStorage.setItem('userFullName', userData.fullName);
          // Lưu thêm ID để dùng cho chức năng Upload ảnh sau này
          localStorage.setItem('userId', userData.id); 
      }
      
      navigate('/dashboard'); 
    } catch (error: any) {
      console.error("Lỗi đăng nhập:", error);
      message.error(error.response?.data?.detail || 'Sai email hoặc mật khẩu!');
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        {/* Phần bên trái: Poster */}
        <div className="auth-left">
          <div className="auth-logo">
            <HeartFilled style={{ color: 'white', fontSize: '24px' }} />
            <span>AURA System</span>
          </div>
          <div className="auth-circle" style={{ width: '200px', height: '200px', top: '20%', left: '10%' }}></div>
          <div className="auth-circle" style={{ width: '100px', height: '100px', bottom: '20%', right: '10%' }}></div>
          <div className="auth-illustration">
             <img 
               src="https://img.freepik.com/free-photo/portrait-successful-mid-adult-doctor-with-crossed-arms_1262-12865.jpg?t=st=1716000000~exp=1716003600~hmac=xyz" 
               alt="Doctor" 
               style={{ width: '100%', borderRadius: '50%', border: '4px solid rgba(255,255,255,0.3)' }} 
             />
          </div>
          <div className="auth-footer-text">
            Copyright © 2026 AURA System. All rights reserved.
          </div>
        </div>

        {/* Phần bên phải: Form */}
        <div className="auth-right">
          <div className="auth-tabs">
            <div className="auth-tab" onClick={() => navigate('/register')}>Sign Up</div>
            <div className="auth-tab active">Sign In</div>
          </div>

          <Form layout="vertical" onFinish={onFinish}>
            <Form.Item name="email" rules={[{ required: true, type: 'email', message: 'Email không hợp lệ' }]}>
              <Input placeholder="Email" className="custom-input" />
            </Form.Item>

            <Form.Item name="password" rules={[{ required: true, message: 'Vui lòng nhập mật khẩu' }]}>
              <Input.Password placeholder="Password" className="custom-input" />
            </Form.Item>

            <Button type="primary" htmlType="submit" block className="auth-btn">
              Sign In
            </Button>

            <div style={{ textAlign: 'center', marginTop: '15px', color: '#ff7875', cursor: 'pointer' }} onClick={() => navigate('/register')}>
              Create an Account ?
            </div>
          </Form>

          <div className="social-icons">
            <LinkedinOutlined className="social-icon" style={{ fontSize: '20px' }} />
            <InstagramOutlined className="social-icon" style={{ fontSize: '20px' }} />
            <FacebookOutlined className="social-icon" style={{ fontSize: '20px' }} />
            <TwitterOutlined className="social-icon" style={{ fontSize: '20px' }} />
          </div>

          <div className="contact-info">
             <span>📞 1900-9999</span>
             <span>✉ info@aurasystem.com</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;