export type UserRole = 'Admin' | 'Super Admin' | 'Doctor' | 'Receptionist' | 'Patient';
export type UserStatus = 'Pending' | 'Approved' | 'Rejected';
export type SubscriptionPlan = 'Free' | 'Pro';

export interface IUser {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  subscriptionPlan: SubscriptionPlan;
  aiPredictiveGenCount: number;
  aiPredictiveGenResetDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface IPatient {
  _id: string;
  name: string;
  age: number;
  gender: 'Male' | 'Female' | 'Other';
  contact: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export type AppointmentStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled';

export interface IAppointment {
  _id: string;
  patientId: string;
  doctorId: string;
  date: string;
  status: AppointmentStatus;
  reason?: string;
  symptoms?: string;
  aiPreDiagnosis?: {
    possibleConditions: string[];
    riskLevel: 'Low' | 'Medium' | 'High' | 'Critical';
    urgency: string;
    advice: string;
  };
  price?: number;
  invoiceUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface IMedicine {
  name: string;
  dosage: string;
  duration: string;
  instructions?: string;
}

export type RiskLevel = 'Low' | 'Medium' | 'High';

export interface IPrescription {
  _id: string;
  patientId: string;
  doctorId: string;
  medicines: IMedicine[];
  instructions?: string;
  aiInsights?: string;
  riskLevel?: RiskLevel;
  pdfUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: any;
}
