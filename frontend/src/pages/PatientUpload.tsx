import React, { useState } from 'react';
import { Upload, message, Card, Spin, Button, Typography, Row, Col, Image, Tag, Divider } from 'antd';
import { InboxOutlined, LoadingOutlined, DownloadOutlined, MedicineBoxOutlined } from '@ant-design/icons';
import type { UploadProps } from 'antd';
import axiosClient from '../api/axiosClient';

const { Dragger } = Upload;
const { Title, Text } = Typography;

// Định nghĩa Prop để nhận hàm reloadHistory từ Dashboard
interface PatientUploadProps {
  onUploadSuccess?: () => void;
}

const PatientUpload: React.FC<PatientUploadProps> = ({ onUploadSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const props: UploadProps = {
    name: 'file',
    multiple: false,
    showUploadList: false,
    accept: 'image/png, image/jpeg, image/jpg, image/webp',
    customRequest: async (options: any) => {
      const { file, onSuccess, onError } = options;
      const userId = localStorage.getItem('userId');
      if (!userId) { message.error("Vui lòng đăng nhập lại"); return; }

      setLoading(true);
      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("user_id", userId);

        const response = await axiosClient.post("/upload", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });

        setTimeout(() => {
            setLoading(false);
            setResult(response.data);
            message.success("Phân tích thành công!");
            if (onUploadSuccess) onUploadSuccess(); // Gọi Dashboard cập nhật lại bảng lịch sử
            onSuccess("Ok");
        }, 2000); 

      } catch (err: any) {
        setLoading(false);
        message.error("Lỗi: " + (err.response?.data?.detail || "Upload thất bại"));
        onError({ err });
      }
    },
  };

  if (result) {
    return (
      <Card bordered={false} style={{ borderRadius: 15, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
          <Text strong style={{ fontSize: 16, color: '#8c8c8c' }}>Mã: #{result.imageId.toString().slice(0, 8)}</Text>
          <Text type="secondary">{new Date().toLocaleDateString('vi-VN')}</Text>
        </div>

        <Row gutter={[24, 24]}>
          <Col xs={24} md={12} style={{textAlign: 'center'}}>
              <Tag color="cyan" style={{ marginBottom: 10 }}>ẢNH GỐC</Tag>
              <Image src={result.originalUrl} style={{ borderRadius: 10, maxHeight: 250 }} />
          </Col>
          <Col xs={24} md={12} style={{textAlign: 'center'}}>
              <Tag color="red" style={{ marginBottom: 10 }}>AI PHÂN TÍCH (HEATMAP)</Tag>
              {/* Filter tạo hiệu ứng Heatmap đỏ */}
              <Image src={result.heatmapUrl} style={{ borderRadius: 10, maxHeight: 250, filter: 'contrast(1.2) sepia(1) hue-rotate(-50deg) saturate(3)' }} />
          </Col>
        </Row>
        <Divider />
        <Row align="middle" justify="space-between">
          <Col><Title level={4}>{result.diagnosis}</Title></Col>
          <Col><Title level={2} style={{ margin: 0, color: result.riskScore > 50 ? '#cf1322' : '#3f8600' }}>{result.riskScore}%</Title></Col>
        </Row>
        <div style={{ background: '#fff1f0', padding: 15, borderRadius: 8, marginTop: 20 }}>
           <MedicineBoxOutlined style={{ color: '#cf1322', marginRight: 8 }} />
           <Text strong>Lời khuyên: </Text><Text>{result.recommendation}</Text>
        </div>
        <div style={{ display: 'flex', gap: 15, marginTop: 20, justifyContent: 'center' }}>
           <Button icon={<DownloadOutlined />}>Tải PDF</Button>
           <Button onClick={() => setResult(null)}>Phân tích ảnh khác</Button>
        </div>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card style={{ textAlign: 'center', padding: 80, borderRadius: 10 }}>
        <Spin indicator={<LoadingOutlined style={{ fontSize: 48 }} spin />} />
        <Title level={4} style={{ marginTop: 20 }}>AI đang phân tích...</Title>
      </Card>
    );
  }

  return (
    <Card title="Tải lên ảnh võng mạc" bordered={false} style={{ borderRadius: 10 }}>
      <Dragger {...props} style={{ padding: 40, background: '#fafafa', border: '2px dashed #d9d9d9' }}>
        <p className="ant-upload-drag-icon"><InboxOutlined style={{ color: '#4facfe' }} /></p>
        <p className="ant-upload-text">Kéo thả ảnh vào đây</p>
      </Dragger>
    </Card>
  );
};
export default PatientUpload;