export interface LoginCredentials {
  email: string;
  password: string;
}

export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  phone?: string;
  role: string;
  status: string;
  agencyId?: number;
  telegramUsername?: string;
  whatsappNumber?: string;
  photo?: string;
  logo?: string;
  documents?: string[];
  isBanned?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Property {
  id: number;
  title: string;
  price: number;
  address: string;
}

export type CreatePropertyData = Omit<Property, 'id'>;

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

export interface ForgotPasswordResponse {
  message: string;
}

export interface ResetPasswordResponse {
  message: string;
} 