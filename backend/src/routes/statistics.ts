import express from 'express';
import {
  getEventStatistics,
  getParticipantStatistics,
  getParticipantDetails
} from '../services/statistics.service.js';

const router = express.Router();

// GET /api/statistics/events - Get event statistics
router.get('/events', async (req: any, res: any) => {
  try {
    const stats = await getEventStatistics();
    res.json(stats);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/statistics/participants - Get participant statistics
router.get('/participants', async (req: any, res: any) => {
  try {
    const stats = await getParticipantStatistics();
    res.json(stats);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/statistics/participants/:email - Get participant details
router.get('/participants/:email', async (req: any, res: any) => {
  try {
    const details = await getParticipantDetails(req.params.email);

    if (!details) {
      return res.status(404).json({ error: 'Participant not found' });
    }

    res.json(details);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
