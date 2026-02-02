import React, { useState } from 'react';
import { Form, Input, Button, message, Select } from 'antd';
import { useNavigate } from 'react-router-dom';
import { 
  LinkedinOutlined, 
  InstagramOutlined, 
  FacebookOutlined, 
  TwitterOutlined,
  HeartFilled
} from '@ant-design/icons';
import axiosClient from '../api/axiosClient';
import './Auth.css'; // Import file CSS vừa tạo

const Register: React.FC = () => {
  const navigate = useNavigate();
  const [role, setRole] = useState('Patient');

  const onFinish = async (values: any) => {
    try {
      await axiosClient.post('/register', {
        email: values.email,
        password: values.password,
        full_name: values.fullName,
        role: role
      });
      message.success('Đăng ký thành công! Đang chuyển hướng...');
      setTimeout(() => navigate('/login'), 1500);
    } catch (error: any) {
      message.error(error.response?.data?.detail || 'Đăng ký thất bại');
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        {/* Phần bên trái: Poster/Hình ảnh */}
        <div className="auth-left">
          <div className="auth-logo">
            <HeartFilled style={{ color: 'white', fontSize: '24px' }} />
            <span>AURA System</span>
          </div>
          
          {/* Vòng tròn trang trí mờ phía sau */}
          <div className="auth-circle" style={{ width: '200px', height: '200px', top: '20%', left: '10%' }}></div>
          <div className="auth-circle" style={{ width: '100px', height: '100px', bottom: '20%', right: '10%' }}></div>

          {/* Hình bác sĩ (Dùng ảnh mẫu online hoặc icon lớn) */}
          <div className="auth-illustration">
             {/* Bạn có thể thay src bằng đường dẫn ảnh bác sĩ thật nếu có */}
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

        {/* Phần bên phải: Form Đăng ký */}
        <div className="auth-right">
          {/* Tabs giả lập */}
          <div className="auth-tabs">
            <div className="auth-tab active">Sign Up</div>
            <div className="auth-tab" onClick={() => navigate('/login')}>Sign In</div>
          </div>

          <Form layout="vertical" onFinish={onFinish} initialValues={{ role: 'Patient' }}>
            
            <Form.Item name="fullName" rules={[{ required: true, message: 'Please enter your name' }]}>
              <Input placeholder="Full Name" className="custom-input" />
            </Form.Item>

            <Form.Item name="email" rules={[{ required: true, type: 'email', message: 'Invalid email' }]}>
              <Input placeholder="Email" className="custom-input" />
            </Form.Item>

            <Form.Item name="password" rules={[{ required: true, min: 6 }]}>
              <Input.Password placeholder="Password" className="custom-input" />
            </Form.Item>

            {/* Chọn vai trò ẩn hoặc hiển thị tinh tế hơn */}
            <Form.Item label="Role" name="role" style={{ marginBottom: 10 }}>
               <Select 
                 defaultValue="Patient" 
                 onChange={(value) => setRole(value)}
                 bordered={false} 
                 style={{ borderBottom: '1px solid #e0e0e0', width: '100%' }}
               >
                 <Select.Option value="Patient">Patient</Select.Option>
                 <Select.Option value="Doctor">Doctor</Select.Option>
                 <Select.Option value="Clinic">Clinic</Select.Option>
               </Select>
            </Form.Item>

            <Button type="primary" htmlType="submit" block className="auth-btn">
              Sign Up
            </Button>

            <div style={{ textAlign: 'center', marginTop: '15px', color: '#ff7875', cursor: 'pointer' }} onClick={() => navigate('/login')}>
              I have an Account ?
            </div>
          </Form>

          {/* Social Icons */}
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

export default Register;