// routes/indicators.js
const express = require('express');
const db = require('../config/db');
const checkAuth = require('../middleware/checkAuth');

const router = express.Router();

const jsonParser = express.json();

// Middleware to check if user is admin
const checkAdmin = (req, res, next) => {
  if (req.userData.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied. Admin role required.' });
  }
  next();
};

// GET /api/indicators (All authenticated users)
router.get('/', checkAuth, async (req, res) => {
  try {
    // [!!! แก้ไข 1/4 !!!] ลบ i.format ออกจาก SELECT
    const sql = `
      SELECT i.id, i.topic_id, i.name, i.detail, t.name AS topic_name
      FROM indicators i
      JOIN topics t ON i.topic_id = t.id
      ORDER BY t.name, i.name
    `;
    const [indicators] = await db.query(sql);
    res.status(200).json(indicators);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching indicators.', error: err.message });
  }
});

// POST /api/indicators (Admin only)
router.post('/', checkAuth, checkAdmin, jsonParser, async (req, res) => {
  // [!!! แก้ไข 2/4 !!!] ลบ format ออกจาก req.body
  const { topic_id, name, detail } = req.body;

  if (!topic_id || !name) {
    return res.status(400).json({ message: 'Topic ID and Name are required.' });
  }

  try {
    // [!!! แก้ไข 3/4 !!!] ลบ format ออกจาก INSERT
    const [result] = await db.query(
      'INSERT INTO indicators (topic_id, name, detail) VALUES (?, ?, ?)',
      [topic_id, name, detail || null]
    );
    res.status(201).json({ message: 'Indicator created successfully.', indicatorId: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error creating indicator.', error: err.message });
  }
});

// PUT /api/indicators/:id (Admin only)
router.put('/:id', checkAuth, checkAdmin, jsonParser, async (req, res) => {
  const { id } = req.params;
  // [!!! แก้ไข 4/4 !!!] ลบ format ออกจาก req.body และ UPDATE
  const { topic_id, name, detail } = req.body;

  if (!topic_id || !name) {
    return res.status(400).json({ message: 'Topic ID and Name are required.' });
  }

  try {
    const [result] = await db.query(
      'UPDATE indicators SET topic_id = ?, name = ?, detail = ? WHERE id = ?',
      [topic_id, name, detail || null, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Indicator not found.' });
    }
    res.status(200).json({ message: 'Indicator updated successfully.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error updating indicator.', error: err.message });
  }
});

// DELETE /api/indicators/:id (Admin only)
router.delete('/:id', checkAuth, checkAdmin, async (req, res) => {
  const { id } = req.params;

  try {
    const [result] = await db.query('DELETE FROM indicators WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Indicator not found.' });
    }
    res.status(200).json({ message: 'Indicator deleted successfully.' });
  } catch (err) {
    console.error(err);
    if (err.code === 'ER_ROW_IS_REFERENCED_2') {
      return res.status(409).json({ message: 'Cannot delete indicator. It is referenced by existing submissions.' });
    }
    res.status(500).json({ message: 'Error deleting indicator.', error: err.message });
  }
});

module.exports = router;