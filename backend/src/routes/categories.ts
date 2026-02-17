import express from 'express';
import pool from '../db/connection.js';
import { ResultSetHeader, RowDataPacket } from 'mysql2';

const router = express.Router();

// GET /api/categories - Get all categories
router.get('/', async (req: any, res: any) => {
  try {
    const [categories] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM categories ORDER BY name'
    );
    res.json(categories);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/categories - Create new category
router.post('/', async (req: any, res: any) => {
  try {
    const { name, color } = req.body;

    const [result] = await pool.query<ResultSetHeader>(
      'INSERT INTO categories (name, color) VALUES (?, ?)',
      [name, color || '#3B82F6']
    );

    const [newCategory] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM categories WHERE id = ?',
      [result.insertId]
    );

    res.status(201).json(newCategory[0]);
  } catch (error: any) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'Category with this name already exists' });
    }
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/categories/:id - Update category
router.put('/:id', async (req: any, res: any) => {
  try {
    const { name, color } = req.body;

    await pool.query(
      'UPDATE categories SET name = ?, color = ? WHERE id = ?',
      [name, color, req.params.id]
    );

    const [updatedCategory] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM categories WHERE id = ?',
      [req.params.id]
    );

    res.json(updatedCategory[0]);
  } catch (error: any) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'Category with this name already exists' });
    }
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/categories/:id - Delete category
router.delete('/:id', async (req: any, res: any) => {
  try {
    await pool.query('DELETE FROM categories WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
