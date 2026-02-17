import express from 'express';
import pool from '../db/connection.js';
import { ResultSetHeader, RowDataPacket } from 'mysql2';

const router = express.Router();

// GET /api/custom-fields/by-event/:eventId - Get custom fields for an event
router.get('/by-event/:eventId', async (req, res) => {
  try {
    const [fields] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM custom_fields WHERE event_id = ? ORDER BY display_order',
      [req.params.eventId]
    );
    res.json(fields);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/custom-fields - Create new custom field
router.post('/', async (req, res) => {
  try {
    const {
      event_id,
      field_name,
      field_type,
      field_options,
      is_required,
      display_order
    } = req.body;

    const [result] = await pool.query<ResultSetHeader>(
      `INSERT INTO custom_fields (id, event_id, field_name, field_type, field_options, is_required, display_order)
       VALUES (UUID(), ?, ?, ?, ?, ?, ?)`,
      [event_id, field_name, field_type, JSON.stringify(field_options || []), is_required || false, display_order || 0]
    );

    const [newField] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM custom_fields WHERE event_id = ? ORDER BY id DESC LIMIT 1',
      [event_id]
    );

    res.status(201).json(newField[0]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/custom-fields/:id - Delete custom field
router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM custom_fields WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
