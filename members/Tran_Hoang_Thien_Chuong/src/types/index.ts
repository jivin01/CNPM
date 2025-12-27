// src/types/index.ts

// 1. Dữ liệu Bác sĩ (Lúc nãy đã làm)
export interface Doctor {
  id: string;
  name: string;
  specialization: string;
  email: string;
  phone?: string;
  avatarUrl?: string;
  joinedDate: string;
  totalScans: number;
  status: 'Online' | 'Offline' | 'Busy';
}

// 2. Dữ liệu Kết quả Chẩn đoán (Cái bạn đang thiếu gây ra lỗi đỏ)
export interface DiagnosisResult {
  id: string;
  imageUrl: string;
  aiRiskScore: number;
  aiFindings: string; // Gợi ý của AI
  doctorNotes: string; // Ghi chú của bác sĩ
  isVerified: boolean; // Đã duyệt hay chưa
  status: 'pending' | 'reviewed';
  timestamp: string;
}