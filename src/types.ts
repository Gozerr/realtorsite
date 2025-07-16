// C:/Users/OMEN/Desktop/realtorsite/frontend/src/types.ts

export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  photo?: string;
  role: 'agent' | 'director' | 'private_realtor' | 'manager' | 'support';
  agencyId?: number;
  phone?: string;
  avatar?: string;
  city?: string;
  region?: string;
  telegramUsername?: string;
  whatsappNumber?: string;
  documents?: string[];
  status?: 'active' | 'pending' | 'banned';
  documentStatus?: 'approved' | 'pending_review' | 'rejected';
  createdAt?: string;
  lastLoginAt?: string;
  agency?: {
    id: number;
    name: string;
    logo?: string; // Путь к логотипу агентства
  };
}

export interface LoginCredentials {
  email: string;
  password?: string;
}

export interface Agency {
  id: number;
  name: string;
  logo?: string; // Путь к логотипу агентства
}

export enum PropertyStatus {
  FOR_SALE = 'for_sale',
  IN_DEAL = 'in_deal',
  SOLD = 'sold',
}

export interface Property {
  id: number;
  title: string;
  description: string;
  address: string;
  price: number;
  area: number;
  bedrooms: number;
  bathrooms: number;
  status: 'for_sale' | 'in_deal' | 'reserved' | 'sold';
  isExclusive: boolean;
  photos: string[];
  agent?: User;
  agency?: {
    id: number;
    name: string;
  };
  createdAt: string;
  updatedAt: string;
  lat?: number;
  lng?: number;
  floor?: number;
  totalFloors?: number;
  link?: string;
  pricePerM2?: number;
  externalId?: string;
  seller?: string;
  datePublished?: string;
  // --- добавленные поля ---
  type?: string;
  legalCheck?: {
    status?: string;
    details?: string;
    date?: string;
    lastCheckedAt?: string;
  };
  images?: string[];
  rooms?: number;
  phone?: string;
  agentId?: number;
  floors?: number;
}

export interface CreatePropertyData {
  title: string;
  address: string;
  price: number;
  description?: string;
  area?: number;
  bedrooms?: number;
  bathrooms?: number;
  isExclusive?: boolean;
  photos?: string[];
  // Дополнительные поля для совместимости
  status?: string;
  images?: string[];
  agency?: string;
  type?: string;
  rooms?: number;
  floor?: number;
  totalFloors?: number;
  latitude?: number;
  longitude?: number;
} 

export enum ClientStatus {
  NEW = 'new',
  NEGOTIATION = 'negotiation',
  CONTRACT = 'contract',
  DEPOSIT = 'deposit',
  SUCCESS = 'success',
  REFUSED = 'refused',
}

export interface Client {
  id: number;
  name: string;
  email: string;
  phone: string;
  status: 'new' | 'negotiation' | 'contract' | 'deposit' | 'success' | 'refused';
  agent: User;
  createdAt: string;
  updatedAt: string;
  // --- добавленные поля ---
  telegramUsername?: string;
  whatsappNumber?: string;
}

export interface CreateClientData {
  name: string;
  email: string;
  phone: string;
  status?: ClientStatus;
}

export interface Message {
  id: string;
  content: string;
  createdAt: string;
  author: User;
  conversation: Conversation;
  status?: 'sent' | 'delivered' | 'read';
}

export interface Conversation {
  id: string;
  participants: User[];
  messages: Message[];
  property: Property;
}

export interface Notification {
  id: number;
  title: string;
  description: string;
  type: string;
  category: string;
  isNew: boolean;
  createdAt: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  user: User;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  phone?: string;
  role?: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

export interface ChangePasswordRequest {
  oldPassword: string;
  newPassword: string;
}

export interface UpdateProfileRequest {
  firstName?: string;
  lastName?: string;
  middleName?: string;
  email?: string;
  phone?: string;
  telegramUsername?: string;
  whatsappNumber?: string;
  city?: string;
  region?: string;
  photo?: string;
}

export interface SupportRequest {
  id: number;
  userId: number;
  firstName: string;
  lastName: string;
  middleName: string;
  phone: string;
  problem: string;
  status: 'pending' | 'in_progress' | 'resolved' | 'closed';
  assignedTo?: number;
  resolution?: string;
  resolvedAt?: string;
  resolvedBy?: number;
  createdAt: string;
  updatedAt: string;
  user?: User;
}

export interface Chat {
  id: string;
  participants: User[];
  lastMessage?: {
    content: string;
    createdAt: string;
    author: User;
  };
  unreadCount: number;
}

export interface Selection {
  id: number;
  title: string;
  propertyIds: number[];
  user: User;
  createdAt: string;
  clientToken: string;
  clientLikes?: { propertyId: number; liked: boolean }[];
}

export interface EducationEvent {
  id: number;
  title: string;
  description: string;
  date: string;
  location?: string;
  type: 'course' | 'seminar' | 'webinar' | 'conference';
  maxParticipants?: number;
  currentParticipants?: number;
  price?: number;
  isFree: boolean;
  organizer: string;
  contactInfo?: string;
  registrationRequired: boolean;
  materials?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CalendarEvent {
  id: number;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  type: 'meeting' | 'showing' | 'call' | 'reminder' | 'other';
  location?: string;
  attendees?: User[];
  isAllDay: boolean;
  color?: string;
  reminder?: number; // minutes before event
  createdAt: string;
  updatedAt: string;
}

export interface NotificationCounters {
  total: number;
  chat: number;
  support: number;
  property: number;
  system: number;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface FilterOptions {
  search?: string;
  status?: string;
  type?: string;
  category?: string;
  dateFrom?: string;
  dateTo?: string;
  priceFrom?: number;
  priceTo?: number;
  areaFrom?: number;
  areaTo?: number;
  bedrooms?: number;
  bathrooms?: number;
  agentId?: number;
  agencyId?: number;
}

export interface SortOptions {
  field: string;
  order: 'asc' | 'desc';
}

export interface TableState {
  data: any[];
  loading: boolean;
  pagination: {
    current: number;
    pageSize: number;
    total: number;
  };
  filters: FilterOptions;
  sorter: SortOptions;
}

export interface UploadResponse {
  url: string;
  filename: string;
  size: number;
  mimetype: string;
}

export interface ErrorResponse {
  message: string;
  statusCode: number;
  error: string;
}

export interface SuccessResponse {
  message: string;
  success: boolean;
}

export interface StatsResponse {
  total: number;
  active: number;
  inactive: number;
  thisMonth: number;
  lastMonth: number;
  growth: number;
}

export interface DashboardStats {
  properties: StatsResponse;
  clients: StatsResponse;
  notifications: StatsResponse;
  revenue: StatsResponse;
}

export interface UserSession {
  id: string;
  deviceInfo: string;
  ipAddress: string;
  lastActivity: string;
  status: 'active' | 'suspicious' | 'banned' | 'expired';
}

export interface Endorsement {
  id: number;
  privateRealtor: User;
  agency: Agency;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  updatedAt: string;
}

export interface UserAction {
  id: number;
  action: string;
  details: string;
  timestamp: string;
  severity: 'info' | 'warning' | 'error';
  error?: string;
}

export interface RequestHistory {
  id: number;
  action: string;
  details: string;
  timestamp: string;
  userId: number;
  userName: string;
}