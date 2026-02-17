import pool from '../db/connection.js';
import { ResultSetHeader, RowDataPacket } from 'mysql2';

export const POINTS = {
  REGISTRATION: 10,
  ATTENDANCE: 50,
  EARLY_BIRD: 20,
  STREAK_BONUS: 30
};

export const LEVELS = [
  { level: 1, minPoints: 0, name: 'Débutant', icon: '🌱', color: 'slate' },
  { level: 2, minPoints: 50, name: 'Novice', icon: '⭐', color: 'blue' },
  { level: 3, minPoints: 150, name: 'Habitué', icon: '🎯', color: 'green' },
  { level: 4, minPoints: 300, name: 'Expert', icon: '💎', color: 'purple' },
  { level: 5, minPoints: 500, name: 'Maître', icon: '👑', color: 'yellow' },
  { level: 6, minPoints: 800, name: 'Légende', icon: '🏆', color: 'orange' }
];

export const BADGES = {
  FIRST_EVENT: { type: 'first_event', name: 'Premier Pas', icon: '🎉', description: 'Premier événement' },
  EARLY_BIRD: { type: 'early_bird', name: 'Lève-tôt', icon: '🌅', description: 'Inscription anticipée' },
  PERFECT_ATTENDANCE: { type: 'perfect_attendance', name: 'Présence Parfaite', icon: '✨', description: '5 présences consécutives' },
  SOCIAL_BUTTERFLY: { type: 'social_butterfly', name: 'Papillon Social', icon: '🦋', description: '10 événements assistés' },
  NETWORKING_PRO: { type: 'networking_pro', name: 'Pro du Réseau', icon: '🤝', description: '20 événements assistés' },
  POINT_COLLECTOR: { type: 'point_collector', name: 'Collectionneur', icon: '💰', description: '500 points' },
  LEVEL_5: { type: 'level_5', name: 'Niveau 5', icon: '👑', description: 'Atteindre le niveau 5' }
};

export function getLevelInfo(points: number) {
  let currentLevel = LEVELS[0];
  for (const level of LEVELS) {
    if (points >= level.minPoints) {
      currentLevel = level;
    } else {
      break;
    }
  }

  const nextLevelIndex = LEVELS.findIndex(l => l.level === currentLevel.level) + 1;
  const nextLevel = nextLevelIndex < LEVELS.length ? LEVELS[nextLevelIndex] : null;
  const progress = nextLevel
    ? ((points - currentLevel.minPoints) / (nextLevel.minPoints - currentLevel.minPoints)) * 100
    : 100;

  return {
    current: currentLevel,
    next: nextLevel,
    progress: Math.min(progress, 100)
  };
}

export async function getOrCreateParticipant(email: string, firstName: string, lastName: string) {
  const connection = await pool.getConnection();

  try {
    // Check if participant exists
    const [rows] = await connection.query<RowDataPacket[]>(
      'SELECT * FROM participants WHERE email = ?',
      [email]
    );

    if (rows.length > 0) {
      return rows[0];
    }

    // Create new participant with registration points
    const [result] = await connection.query<ResultSetHeader>(
      `INSERT INTO participants (id, email, first_name, last_name, total_points, level, events_attended, streak)
       VALUES (UUID(), ?, ?, ?, ?, 1, 0, 0)`,
      [email, firstName, lastName, POINTS.REGISTRATION]
    );

    // Get the created participant
    const [newRows] = await connection.query<RowDataPacket[]>(
      'SELECT * FROM participants WHERE email = ?',
      [email]
    );

    const participant = newRows[0];

    // Award first event badge
    await checkAndAwardBadge(connection, participant.id, 'FIRST_EVENT');

    return participant;
  } finally {
    connection.release();
  }
}

export async function awardAttendancePoints(participantId: string, registrationId: string) {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // Get participant
    const [participantRows] = await connection.query<RowDataPacket[]>(
      'SELECT * FROM participants WHERE id = ?',
      [participantId]
    );

    if (participantRows.length === 0) {
      await connection.rollback();
      return null;
    }

    const participant = participantRows[0];
    const newPoints = participant.total_points + POINTS.ATTENDANCE;
    const newEventsAttended = participant.events_attended + 1;
    const levelInfo = getLevelInfo(newPoints);

    // Update participant
    await connection.query(
      `UPDATE participants
       SET total_points = ?, events_attended = ?, level = ?
       WHERE id = ?`,
      [newPoints, newEventsAttended, levelInfo.current.level, participantId]
    );

    // Update registration
    await connection.query(
      'UPDATE registrations SET points_earned = ? WHERE id = ?',
      [POINTS.REGISTRATION, registrationId]
    );

    // Update attendance
    await connection.query(
      'UPDATE attendance SET points_awarded = ? WHERE registration_id = ?',
      [POINTS.ATTENDANCE, registrationId]
    );

    // Check and award badges
    await checkAndAwardBadge(connection, participantId, 'PERFECT_ATTENDANCE', newEventsAttended);
    await checkAndAwardBadge(connection, participantId, 'SOCIAL_BUTTERFLY', newEventsAttended);
    await checkAndAwardBadge(connection, participantId, 'NETWORKING_PRO', newEventsAttended);
    await checkAndAwardBadge(connection, participantId, 'POINT_COLLECTOR', newPoints);
    await checkAndAwardBadge(connection, participantId, 'LEVEL_5', newPoints);

    await connection.commit();

    return {
      points: POINTS.ATTENDANCE,
      newTotal: newPoints,
      level: levelInfo.current
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function checkAndAwardBadge(connection: any, participantId: string, badgeType: string, value?: number) {
  // Check if badge already exists
  const [existingRows] = await connection.query(
    'SELECT * FROM participant_badges WHERE participant_id = ? AND badge_type = ?',
    [participantId, badgeType]
  ) as [RowDataPacket[], any];

  if (existingRows.length > 0) {
    return false;
  }

  let shouldAward = false;
  let badge = BADGES.FIRST_EVENT;

  switch (badgeType) {
    case 'FIRST_EVENT':
      shouldAward = true;
      badge = BADGES.FIRST_EVENT;
      break;
    case 'PERFECT_ATTENDANCE':
      shouldAward = (value || 0) >= 5;
      badge = BADGES.PERFECT_ATTENDANCE;
      break;
    case 'SOCIAL_BUTTERFLY':
      shouldAward = (value || 0) >= 10;
      badge = BADGES.SOCIAL_BUTTERFLY;
      break;
    case 'NETWORKING_PRO':
      shouldAward = (value || 0) >= 20;
      badge = BADGES.NETWORKING_PRO;
      break;
    case 'POINT_COLLECTOR':
      shouldAward = (value || 0) >= 500;
      badge = BADGES.POINT_COLLECTOR;
      break;
    case 'LEVEL_5':
      shouldAward = getLevelInfo(value || 0).current.level >= 5;
      badge = BADGES.LEVEL_5;
      break;
  }

  if (shouldAward) {
    await connection.query(
      `INSERT INTO participant_badges (id, participant_id, badge_type, badge_name)
       VALUES (UUID(), ?, ?, ?)`,
      [participantId, badge.type, badge.name]
    );
    return true;
  }

  return false;
}

export async function getParticipantByEmail(email: string) {
  const [rows] = await pool.query<RowDataPacket[]>(
    'SELECT * FROM participants WHERE email = ?',
    [email]
  );

  return rows.length > 0 ? rows[0] : null;
}

export async function getParticipantBadges(participantId: string) {
  const [rows] = await pool.query<RowDataPacket[]>(
    'SELECT * FROM participant_badges WHERE participant_id = ? ORDER BY earned_at DESC',
    [participantId]
  );

  return rows;
}

export async function getLeaderboard(limit: number = 10) {
  const [rows] = await pool.query<RowDataPacket[]>(
    'SELECT * FROM participants ORDER BY total_points DESC LIMIT ?',
    [limit]
  );

  return rows;
}
