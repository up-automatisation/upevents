import express from 'express';
import {
  getOrCreateParticipant,
  awardAttendancePoints,
  getParticipantByEmail,
  getParticipantBadges,
  getLeaderboard,
  POINTS,
  LEVELS,
  BADGES,
  getLevelInfo
} from '../services/gamification.service.js';

const router = express.Router();

// GET /api/gamification/leaderboard - Get leaderboard
router.get('/leaderboard', async (req: any, res: any) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const leaderboard = await getLeaderboard(limit);
    res.json(leaderboard);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/gamification/participant/:email - Get participant by email
router.get('/participant/:email', async (req: any, res: any) => {
  try {
    const participant = await getParticipantByEmail(req.params.email);

    if (!participant) {
      return res.status(404).json({ error: 'Participant not found' });
    }

    const levelInfo = getLevelInfo(participant.total_points);

    res.json({
      ...participant,
      levelInfo
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/gamification/badges/:participantId - Get participant badges
router.get('/badges/:participantId', async (req: any, res: any) => {
  try {
    const badges = await getParticipantBadges(Number(req.params.participantId));
    res.json(badges);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/gamification/award-attendance - Award attendance points
router.post('/award-attendance', async (req: any, res: any) => {
  try {
    const { participant_id, registration_id } = req.body;

    const result = await awardAttendancePoints(participant_id, registration_id);

    if (!result) {
      return res.status(404).json({ error: 'Participant not found' });
    }

    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/gamification/config - Get gamification configuration
router.get('/config', async (req: any, res: any) => {
  try {
    res.json({
      points: POINTS,
      levels: LEVELS,
      badges: Object.values(BADGES)
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
