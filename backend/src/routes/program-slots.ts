import express from 'express';
import pool from '../db/connection.js';
import { ResultSetHeader, RowDataPacket } from 'mysql2';

const router = express.Router();

// GET /api/program-slots/by-event/:eventId - Get program slots for an event
router.get('/by-event/:eventId', async (req: any, res: any) => {
  try {
    const [slots] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM program_slots WHERE event_id = ? ORDER BY order_index, start_time',
      [req.params.eventId]
    );
    res.json(slots);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/program-slots - Create new program slot
router.post('/', async (req: any, res: any) => {
  try {
    const {
      event_id,
      start_time,
      end_time,
      title,
      description,
      objective,
      is_break,
      speaker,
      order_index
    } = req.body;

    const [result] = await pool.query<ResultSetHeader>(
      `INSERT INTO program_slots (id, event_id, start_time, end_time, title, description, objective, is_break, speaker, order_index)
       VALUES (UUID(), ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [event_id, start_time, end_time, title, description || '', objective || '', is_break || false, speaker || '', order_index || 0]
    );

    const [newSlot] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM program_slots WHERE event_id = ? ORDER BY id DESC LIMIT 1',
      [event_id]
    );

    res.status(201).json(newSlot[0]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/program-slots/batch - Batch update/create program slots
// IMPORTANT: Must be before /:id to avoid "batch" being captured as an ID
router.put('/batch', async (req: any, res: any) => {
  const connection = await pool.getConnection();

  try {
    const { event_id, slots } = req.body;

    await connection.beginTransaction();

    // Delete all existing slots for this event
    await connection.query('DELETE FROM program_slots WHERE event_id = ?', [event_id]);

    // Insert new slots
    for (const slot of slots) {
      await connection.query(
        `INSERT INTO program_slots (id, event_id, start_time, end_time, title, description, objective, is_break, speaker, order_index)
         VALUES (UUID(), ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          event_id,
          slot.start_time,
          slot.end_time,
          slot.title,
          slot.description || '',
          slot.objective || '',
          slot.is_break || false,
          slot.speaker || '',
          slot.order_index || 0
        ]
      );
    }

    await connection.commit();

    const [newSlots] = await connection.query<RowDataPacket[]>(
      'SELECT * FROM program_slots WHERE event_id = ? ORDER BY order_index, start_time',
      [event_id]
    );

    res.json(newSlots);
  } catch (error: any) {
    await connection.rollback();
    res.status(500).json({ error: error.message });
  } finally {
    connection.release();
  }
});

// PUT /api/program-slots/:id - Update program slot (must be after /batch)
router.put('/:id', async (req: any, res: any) => {
  try {
    const {
      start_time,
      end_time,
      title,
      description,
      objective,
      is_break,
      speaker,
      order_index
    } = req.body;

    await pool.query(
      `UPDATE program_slots
       SET start_time = ?, end_time = ?, title = ?, description = ?, objective = ?, is_break = ?, speaker = ?, order_index = ?
       WHERE id = ?`,
      [start_time, end_time, title, description || '', objective || '', is_break || false, speaker || '', order_index || 0, req.params.id]
    );

    const [updatedSlot] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM program_slots WHERE id = ?',
      [req.params.id]
    );

    res.json(updatedSlot[0]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/program-slots/:id - Delete program slot
router.delete('/:id', async (req: any, res: any) => {
  try {
    await pool.query('DELETE FROM program_slots WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
