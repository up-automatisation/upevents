import express from 'express';
import pool from '../db/connection.js';
import { ResultSetHeader, RowDataPacket } from 'mysql2';
import { nanoid } from 'nanoid';

const router = express.Router();

// GET /api/events - Get all events
router.get('/', async (req, res) => {
  try {
    const { include_closed } = req.query;

    let query = `
      SELECT e.*, c.name as category_name, c.color as category_color
      FROM events e
      LEFT JOIN categories c ON e.category_id = c.id
    `;

    if (include_closed !== 'true') {
      query += ' WHERE e.is_closed = FALSE';
    }

    query += ' ORDER BY e.event_date DESC';

    const [events] = await pool.query<RowDataPacket[]>(query);
    res.json(events);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// IMPORTANT: Routes with fixed paths MUST come before /:id to avoid being
// captured by the parameterized route.

// GET /api/events/by-registration-code/:code - Get event by registration code
router.get('/by-registration-code/:code', async (req, res) => {
  try {
    const [events] = await pool.query<RowDataPacket[]>(
      `SELECT e.*, c.name as category_name, c.color as category_color
       FROM events e
       LEFT JOIN categories c ON e.category_id = c.id
       WHERE e.registration_code = ?`,
      [req.params.code]
    );

    if (events.length === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }

    res.json(events[0]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/events/by-attendance-code/:code - Get event by attendance code
router.get('/by-attendance-code/:code', async (req, res) => {
  try {
    const [events] = await pool.query<RowDataPacket[]>(
      `SELECT e.*, c.name as category_name, c.color as category_color
       FROM events e
       LEFT JOIN categories c ON e.category_id = c.id
       WHERE e.attendance_code = ?`,
      [req.params.code]
    );

    if (events.length === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }

    res.json(events[0]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/events/:id - Get event by ID (must be after specific routes)
router.get('/:id', async (req, res) => {
  try {
    const [events] = await pool.query<RowDataPacket[]>(
      `SELECT e.*, c.name as category_name, c.color as category_color
       FROM events e
       LEFT JOIN categories c ON e.category_id = c.id
       WHERE e.id = ?`,
      [req.params.id]
    );

    if (events.length === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }

    res.json(events[0]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/events - Create new event
router.post('/', async (req, res) => {
  try {
    const {
      title,
      description,
      location,
      event_date,
      category_id
    } = req.body;

    const registration_code = nanoid(10);
    const attendance_code = nanoid(10);

    const [result] = await pool.query<ResultSetHeader>(
      `INSERT INTO events (id, title, description, location, event_date, registration_code, attendance_code, category_id, is_active)
       VALUES (UUID(), ?, ?, ?, ?, ?, ?, ?, FALSE)`,
      [title, description || '', location || '', event_date, registration_code, attendance_code, category_id || null]
    );

    const [newEvent] = await pool.query<RowDataPacket[]>(
      `SELECT e.*, c.name as category_name, c.color as category_color
       FROM events e
       LEFT JOIN categories c ON e.category_id = c.id
       WHERE e.registration_code = ?`,
      [registration_code]
    );

    res.status(201).json(newEvent[0]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/events/:id - Update event
router.put('/:id', async (req, res) => {
  try {
    const {
      title,
      description,
      location,
      event_date,
      category_id
    } = req.body;

    await pool.query(
      `UPDATE events
       SET title = ?, description = ?, location = ?, event_date = ?, category_id = ?
       WHERE id = ?`,
      [title, description || '', location || '', event_date, category_id || null, req.params.id]
    );

    const [updatedEvent] = await pool.query<RowDataPacket[]>(
      `SELECT e.*, c.name as category_name, c.color as category_color
       FROM events e
       LEFT JOIN categories c ON e.category_id = c.id
       WHERE e.id = ?`,
      [req.params.id]
    );

    res.json(updatedEvent[0]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/events/:id - Delete event
router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM events WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// PATCH /api/events/:id/toggle-status - Toggle active status
router.patch('/:id/toggle-status', async (req, res) => {
  try {
    await pool.query(
      'UPDATE events SET is_active = NOT is_active WHERE id = ?',
      [req.params.id]
    );

    const [updatedEvent] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM events WHERE id = ?',
      [req.params.id]
    );

    res.json(updatedEvent[0]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// PATCH /api/events/:id/close - Close event
router.patch('/:id/close', async (req, res) => {
  try {
    await pool.query(
      'UPDATE events SET is_closed = TRUE WHERE id = ?',
      [req.params.id]
    );

    const [updatedEvent] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM events WHERE id = ?',
      [req.params.id]
    );

    res.json(updatedEvent[0]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
