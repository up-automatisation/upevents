import express from 'express';
import pool from '../db/connection.js';
import { ResultSetHeader, RowDataPacket } from 'mysql2';
import { nanoid } from 'nanoid';

const router = express.Router();

// GET /api/registrations/by-event/:eventId - Get registrations for an event
router.get('/by-event/:eventId', async (req: any, res: any) => {
  try {
    const [registrations] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM registrations WHERE event_id = ? ORDER BY registered_at DESC',
      [req.params.eventId]
    );
    res.json(registrations);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/registrations/by-qr/:qrCode - Get registration by QR code
router.get('/by-qr/:qrCode', async (req: any, res: any) => {
  try {
    const [registrations] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM registrations WHERE qr_code = ?',
      [req.params.qrCode]
    );

    if (registrations.length === 0) {
      return res.status(404).json({ error: 'Registration not found' });
    }

    res.json(registrations[0]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/registrations - Create new registration
router.post('/', async (req: any, res: any) => {
  try {
    const {
      event_id,
      first_name,
      last_name,
      email,
      company
    } = req.body;

    const qr_code = nanoid(20);

    const [result] = await pool.query<ResultSetHeader>(
      `INSERT INTO registrations (event_id, first_name, last_name, email, company, qr_code, points_earned)
       VALUES (?, ?, ?, ?, ?, ?, 0)`,
      [event_id, first_name, last_name, email, company || '', qr_code]
    );

    const [newRegistration] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM registrations WHERE id = ?',
      [result.insertId]
    );

    res.status(201).json(newRegistration[0]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/registrations/:id - Update registration
router.put('/:id', async (req: any, res: any) => {
  try {
    const {
      first_name,
      last_name,
      email,
      company
    } = req.body;

    await pool.query(
      `UPDATE registrations
       SET first_name = ?, last_name = ?, email = ?, company = ?
       WHERE id = ?`,
      [first_name, last_name, email, company || '', req.params.id]
    );

    const [updatedRegistration] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM registrations WHERE id = ?',
      [req.params.id]
    );

    res.json(updatedRegistration[0]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// PATCH /api/registrations/:id/cancel - Cancel registration
router.patch('/:id/cancel', async (req: any, res: any) => {
  try {
    await pool.query(
      'UPDATE registrations SET cancelled = TRUE WHERE id = ?',
      [req.params.id]
    );

    const [updatedRegistration] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM registrations WHERE id = ?',
      [req.params.id]
    );

    res.json(updatedRegistration[0]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
