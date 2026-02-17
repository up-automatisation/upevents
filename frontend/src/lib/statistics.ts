import { statistics as statisticsApi } from './api';

export interface EventStats {
  totalEvents: number;
  registrations: {
    max: number;
    min: number;
    average: number;
  };
  attendance: {
    max: number;
    min: number;
    average: number;
  };
}

export interface ParticipantStats {
  email: string;
  firstName: string;
  lastName: string;
  totalRegistrations: number;
  totalAttendances: number;
  attendanceRate: number;
}

export interface ParticipantEventDetail {
  eventId: string;
  eventTitle: string;
  eventDate: string;
  registered: boolean;
  attended: boolean;
}

export interface ParticipantDetail extends ParticipantStats {
  events: ParticipantEventDetail[];
}

export async function getEventStatistics(): Promise<EventStats> {
  try {
    const data = await statisticsApi.getEvents();
    return data;
  } catch (error) {
    console.error('Error fetching event statistics:', error);
    return {
      totalEvents: 0,
      registrations: { max: 0, min: 0, average: 0 },
      attendance: { max: 0, min: 0, average: 0 },
    };
  }
}

export async function getParticipantStatistics(): Promise<ParticipantStats[]> {
  try {
    const data = await statisticsApi.getParticipants();
    return data;
  } catch (error) {
    console.error('Error fetching participant statistics:', error);
    return [];
  }
}

export async function getParticipantDetails(email: string): Promise<ParticipantDetail | null> {
  try {
    const data = await statisticsApi.getParticipantDetails(email);
    return data;
  } catch (error) {
    console.error('Error fetching participant details:', error);
    return null;
  }
}
