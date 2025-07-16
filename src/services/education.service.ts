import api from './api';

export type EducationEvent = {
  id: number;
  title: string;
  description?: string;
  date: string;
  type: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
  link?: string;
  img?: string;
  place?: string;
  endDate?: string;
};

export async function fetchEducationEvents(): Promise<EducationEvent[]> {
  const res = await api.get<EducationEvent[]>('/api/education');
  return res.data;
}

export async function createEducationEvent(event: Partial<EducationEvent>): Promise<EducationEvent> {
  const res = await api.post<EducationEvent>('/api/education', event);
  return res.data;
} 