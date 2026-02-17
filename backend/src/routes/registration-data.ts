import express from 'express';
import pool from '../db/connection.js';
import { ResultSetHeader, RowDataPacket } from 'mysql2';

const router = express.Router();

// POST /api/registration-data/batch - Batch create registration data
router.post('/batch', async (req: any, res: any) => {
  const connection = await pool.getConnection();

  try {
    const { registration_id, data } = req.body;

    await connection.beginTransaction();

    // Insert all registration data
    for (const item of data) {
      await connection.query(
        `INSERT INTO registration_data (registration_id, custom_field_id, value)
         VALUES (?, ?, ?)`,
        [registration_id, item.custom_field_id, item.value || '']
      );
    }

    await connection.commit();

    const [newData] = await connection.query<RowDataPacket[]>(
      'SELECT * FROM registration_data WHERE registration_id = ?',
      [registration_id]
    );

    res.status(201).json(newData);
  } catch (error: any) {
    await connection.rollback();
    res.status(500).json({ error: error.message });
  } finally {
    connection.release();
  }
});

export default router;
