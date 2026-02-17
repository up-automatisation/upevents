import pool from '../db/connection.js';
import { RowDataPacket } from 'mysql2';

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
  const connection = await pool.getConnection();

  try {
    // Get all events
    const [events] = await connection.query<RowDataPacket[]>(
      'SELECT id FROM events'
    );

    if (events.length === 0) {
      return {
        totalEvents: 0,
        registrations: { max: 0, min: 0, average: 0 },
        attendance: { max: 0, min: 0, average: 0 },
      };
    }

    const registrationCounts: number[] = [];
    const attendanceCounts: number[] = [];

    for (const event of events) {
      // Count registrations for this event
      const [regCountResult] = await connection.query<RowDataPacket[]>(
        'SELECT COUNT(*) as count FROM registrations WHERE event_id = ? AND cancelled = FALSE',
        [event.id]
      );
      const regCount = regCountResult[0].count;
      registrationCounts.push(regCount);

      // Count attendances for this event
      const [attCountResult] = await connection.query<RowDataPacket[]>(
        `SELECT COUNT(*) as count FROM attendance a
         INNER JOIN registrations r ON a.registration_id = r.id
         WHERE r.event_id = ? AND r.cancelled = FALSE`,
        [event.id]
      );
      const attCount = attCountResult[0].count;
      attendanceCounts.push(attCount);
    }

    const maxReg = Math.max(...registrationCounts);
    const minReg = Math.min(...registrationCounts);
    const avgReg = registrationCounts.reduce((a, b) => a + b, 0) / registrationCounts.length;

    const maxAtt = Math.max(...attendanceCounts);
    const minAtt = Math.min(...attendanceCounts);
    const avgAtt = attendanceCounts.reduce((a, b) => a + b, 0) / attendanceCounts.length;

    return {
      totalEvents: events.length,
      registrations: {
        max: maxReg,
        min: minReg,
        average: Math.round(avgReg * 10) / 10,
      },
      attendance: {
        max: maxAtt,
        min: minAtt,
        average: Math.round(avgAtt * 10) / 10,
      },
    };
  } finally {
    connection.release();
  }
}

export async function getParticipantStatistics(): Promise<ParticipantStats[]> {
  const connection = await pool.getConnection();

  try {
    // Get all registrations grouped by email
    const [registrations] = await connection.query<RowDataPacket[]>(
      'SELECT email, first_name, last_name, id FROM registrations WHERE cancelled = FALSE'
    );

    if (registrations.length === 0) {
      return [];
    }

    const participantMap = new Map<string, {
      firstName: string;
      lastName: string;
      registrationIds: string[];
    }>();

    for (const reg of registrations) {
      if (!participantMap.has(reg.email)) {
        participantMap.set(reg.email, {
          firstName: reg.first_name,
          lastName: reg.last_name,
          registrationIds: [],
        });
      }
      participantMap.get(reg.email)!.registrationIds.push(reg.id);
    }

    const stats: ParticipantStats[] = [];

    for (const [email, data] of participantMap.entries()) {
      // Count attendances for this participant
      const [attCountResult] = await connection.query<RowDataPacket[]>(
        'SELECT COUNT(*) as count FROM attendance WHERE registration_id IN (?)',
        [data.registrationIds]
      );

      const totalRegistrations = data.registrationIds.length;
      const totalAttendances = attCountResult[0].count;
      const attendanceRate = totalRegistrations > 0
        ? Math.round((totalAttendances / totalRegistrations) * 100)
        : 0;

      stats.push({
        email,
        firstName: data.firstName,
        lastName: data.lastName,
        totalRegistrations,
        totalAttendances,
        attendanceRate,
      });
    }

    stats.sort((a, b) => b.totalRegistrations - a.totalRegistrations);

    return stats;
  } finally {
    connection.release();
  }
}

export async function getParticipantDetails(email: string): Promise<ParticipantDetail | null> {
  const connection = await pool.getConnection();

  try {
    // Get all registrations for this participant with event details
    const [registrations] = await connection.query<RowDataPacket[]>(
      `SELECT r.id, r.event_id, r.first_name, r.last_name, r.cancelled,
              e.id as event_id, e.title as event_title, e.event_date
       FROM registrations r
       INNER JOIN events e ON r.event_id = e.id
       WHERE r.email = ? AND r.cancelled = FALSE
       ORDER BY e.event_date DESC`,
      [email]
    );

    if (registrations.length === 0) {
      return null;
    }

    const firstName = registrations[0].first_name;
    const lastName = registrations[0].last_name;
    const registrationIds = registrations.map(r => r.id);

    // Get attendances for these registrations
    const [attendances] = await connection.query<RowDataPacket[]>(
      'SELECT registration_id FROM attendance WHERE registration_id IN (?)',
      [registrationIds]
    );

    const attendedRegistrationIds = new Set(attendances.map(a => a.registration_id));

    const eventDetails: ParticipantEventDetail[] = registrations.map(reg => ({
      eventId: reg.event_id,
      eventTitle: reg.event_title,
      eventDate: reg.event_date,
      registered: true,
      attended: attendedRegistrationIds.has(reg.id),
    }));

    const totalRegistrations = registrations.length;
    const totalAttendances = attendedRegistrationIds.size;
    const attendanceRate = totalRegistrations > 0
      ? Math.round((totalAttendances / totalRegistrations) * 100)
      : 0;

    return {
      email,
      firstName,
      lastName,
      totalRegistrations,
      totalAttendances,
      attendanceRate,
      events: eventDetails,
    };
  } finally {
    connection.release();
  }
}
