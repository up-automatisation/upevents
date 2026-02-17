// API Client for UpEvents Backend

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_URL}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new ApiError(response.status, error.error || 'Request failed');
  }

  return response.json();
}

// Events API
export const events = {
  getAll: (includeClosed = false) =>
    request<any[]>(`/events${includeClosed ? '?include_closed=true' : ''}`),

  getById: (id: string) =>
    request<any>(`/events/${id}`),

  getByRegistrationCode: (code: string) =>
    request<any>(`/events/by-registration-code/${code}`),

  getByAttendanceCode: (code: string) =>
    request<any>(`/events/by-attendance-code/${code}`),

  create: (data: any) =>
    request<any>('/events', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: string, data: any) =>
    request<any>(`/events/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    request<void>(`/events/${id}`, {
      method: 'DELETE',
    }),

  toggleStatus: (id: string) =>
    request<any>(`/events/${id}/toggle-status`, {
      method: 'PATCH',
    }),

  close: (id: string) =>
    request<any>(`/events/${id}/close`, {
      method: 'PATCH',
    }),
};

// Categories API
export const categories = {
  getAll: () =>
    request<any[]>('/categories'),

  create: (data: { name: string; color: string }) =>
    request<any>('/categories', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: string, data: { name: string; color: string }) =>
    request<any>(`/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    request<void>(`/categories/${id}`, {
      method: 'DELETE',
    }),
};

// Registrations API
export const registrations = {
  getByEvent: (eventId: string) =>
    request<any[]>(`/registrations/by-event/${eventId}`),

  getByQrCode: (qrCode: string) =>
    request<any>(`/registrations/by-qr/${qrCode}`),

  create: (data: any) =>
    request<any>('/registrations', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: string, data: any) =>
    request<any>(`/registrations/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  cancel: (id: string) =>
    request<any>(`/registrations/${id}/cancel`, {
      method: 'PATCH',
    }),
};

// Attendance API
export const attendance = {
  getByRegistration: (registrationId: string) =>
    request<any>(`/attendance/by-registration/${registrationId}`),

  create: (data: { registration_id: string; notes?: string }) =>
    request<any>('/attendance', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  delete: (registrationId: string) =>
    request<void>(`/attendance/by-registration/${registrationId}`, {
      method: 'DELETE',
    }),
};

// Program Slots API
export const programSlots = {
  getByEvent: (eventId: string) =>
    request<any[]>(`/program-slots/by-event/${eventId}`),

  create: (data: any) =>
    request<any>('/program-slots', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: string, data: any) =>
    request<any>(`/program-slots/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    request<void>(`/program-slots/${id}`, {
      method: 'DELETE',
    }),

  batchUpdate: (eventId: string, slots: any[]) =>
    request<any[]>('/program-slots/batch', {
      method: 'PUT',
      body: JSON.stringify({ event_id: eventId, slots }),
    }),
};

// Custom Fields API
export const customFields = {
  getByEvent: (eventId: string) =>
    request<any[]>(`/custom-fields/by-event/${eventId}`),

  create: (data: any) =>
    request<any>('/custom-fields', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    request<void>(`/custom-fields/${id}`, {
      method: 'DELETE',
    }),
};

// Registration Data API
export const registrationData = {
  batchCreate: (registrationId: string, data: any[]) =>
    request<any[]>('/registration-data/batch', {
      method: 'POST',
      body: JSON.stringify({ registration_id: registrationId, data }),
    }),
};

// Statistics API
export const statistics = {
  getEvents: () =>
    request<any>('/statistics/events'),

  getParticipants: () =>
    request<any[]>('/statistics/participants'),

  getParticipantDetails: (email: string) =>
    request<any>(`/statistics/participants/${encodeURIComponent(email)}`),
};

// Gamification API
export const gamification = {
  getLeaderboard: (limit = 10) =>
    request<any[]>(`/gamification/leaderboard?limit=${limit}`),

  getParticipant: (email: string) =>
    request<any>(`/gamification/participant/${encodeURIComponent(email)}`),

  getBadges: (participantId: string) =>
    request<any[]>(`/gamification/badges/${participantId}`),

  awardAttendance: (participantId: string, registrationId: string) =>
    request<any>('/gamification/award-attendance', {
      method: 'POST',
      body: JSON.stringify({ participant_id: participantId, registration_id: registrationId }),
    }),

  getConfig: () =>
    request<any>('/gamification/config'),
};

export { ApiError };
