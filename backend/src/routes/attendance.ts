import express from 'express';
import pool from '../db/connection.js';
import { ResultSetHeader, RowDataPacket } from 'mysql2';

const router = express.Router();

// GET /api/attendance/by-registration/:regId - Check attendance for a registration
router.get('/by-registration/:regId', async (req, res) => {
  try {
    const [attendances] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM attendance WHERE registration_id = ?',
      [req.params.regId]
    );

    res.json(attendances.length > 0 ? attendances[0] : null);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/attendance - Create attendance record
router.post('/', async (req, res) => {
  try {
    const {
      registration_id,
      notes
    } = req.body;

    // Check if attendance already exists
    const [existing] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM attendance WHERE registration_id = ?',
      [registration_id]
    );

    if (existing.length > 0) {
      return res.status(400).json({ error: 'Attendance already recorded' });
    }

    const [result] = await pool.query<ResultSetHeader>(
      `INSERT INTO attendance (id, registration_id, notes, points_awarded)
       VALUES (UUID(), ?, ?, 0)`,
      [registration_id, notes || '']
    );

    const [newAttendance] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM attendance WHERE registration_id = ?',
      [registration_id]
    );

    res.status(201).json(newAttendance[0]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/attendance/by-registration/:regId - Delete attendance record
router.delete('/by-registration/:regId', async (req, res) => {
  try {
    const [result] = await pool.query<ResultSetHeader>(
      'DELETE FROM attendance WHERE registration_id = ?',
      [req.params.regId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Attendance not found' });
    }

    res.status(204).send();
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
