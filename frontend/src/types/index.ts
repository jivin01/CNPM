export interface User {
  id: string;
  email: string;
  fullName: string;
  role: 'Patient' | 'Doctor' | 'Admin';
}

export interface MedicalImage {
  id: string;
  url: string;
  prediction: string;
  confidence: number;
  status: string;
}