import api from './api';

export type CalendarEvent = {
  id: number;
  title: string;
  description?: string;
  start: string;
  end?: string;
  type: 'personal' | 'public';
  relatedObjectId?: number;
  createdAt?: string;
  updatedAt?: string;
};

export async function fetchCalendarEvents(): Promise<CalendarEvent[]> {
  const res = await api.get<CalendarEvent[]>('/api/calendar');
  return res.data;
}

export async function createCalendarEvent(event: Partial<CalendarEvent>): Promise<CalendarEvent> {
  const res = await api.post<CalendarEvent>('/api/calendar', event);
  return res.data;
}

export async function updateCalendarEvent(id: number, event: Partial<CalendarEvent>): Promise<CalendarEvent> {
  const res = await api.put<CalendarEvent>(`/calendar/${id}`, event);
  return res.data;
}

export async function deleteCalendarEvent(id: number): Promise<void> {
  await api.delete(`/calendar/${id}`);
} 