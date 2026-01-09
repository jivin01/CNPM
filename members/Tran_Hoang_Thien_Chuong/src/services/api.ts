// src/services/api.ts
import axios from 'axios';

// Đường dẫn đến Backend FastAPI
const API_URL = 'http://127.0.0.1:8000';

export const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Interceptor: Tự động gắn Token
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

// Interceptor: Xử lý lỗi Token hết hạn
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            console.warn("Phiên đăng nhập hết hạn.");
            if (window.location.pathname !== '/login') {
                logoutUser();
            }
        }
        return Promise.reject(error);
    }
);

// Helper Parse JWT
const parseJwt = (token: string) => {
    try { return JSON.parse(atob(token.split('.')[1])); } catch (e) { return null; }
};

// --- CÁC HÀM GỌI API ---

export const loginUser = async (email: string, password: string) => {
    const formData = new URLSearchParams();
    formData.append('username', email);
    formData.append('password', password);

    const response = await api.post('/token', formData, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });

    if (response.data.access_token) {
        const token = response.data.access_token;
        localStorage.setItem('token', token);
        const decoded = parseJwt(token);
        if (decoded && decoded.role) {
            localStorage.setItem('role', decoded.role);
        }
    }
    return response.data;
};

export const registerUser = async (userData: any) => {
    const response = await api.post('/auth/register', userData);
    return response.data;
};

// Dành cho Bác sĩ: Lấy danh sách bệnh nhân
export const getPatients = async () => {
    const response = await api.get('/patients/');
    return response.data;
};

export const createPatient = async (patientData: any) => {
    const response = await api.post('/patients/', patientData);
    return response.data;
};

export const createMedicalRecord = async (recordData: any) => {
    const response = await api.post('/medical-records/', recordData);
    return response.data;
};

// Dành cho Bác sĩ: Lấy hồ sơ của 1 bệnh nhân cụ thể
export const getPatientRecords = async (patientId: number) => {
    const response = await api.get(`/patients/${patientId}/records`);
    return response.data;
};

// Dành cho Bệnh nhân: Lấy hồ sơ của chính mình
export const getOwnMedicalRecords = async () => {
    const response = await api.get('/my-records');
    return response.data;
};

// Upload ảnh AI
export const uploadImageAnalysis = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file); 
    const response = await api.post('/predict', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
};

// Đăng xuất
export const logoutUser = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    window.location.href = '/login';
};

// [MỚI] Dành cho Bác sĩ: Cập nhật lời khuyên (Treatment)
export const updateTreatment = async (recordId: number, treatment: string) => {
    const response = await api.put(`/medical-records/${recordId}`, { treatment });
    return response.data;
};

export default api;