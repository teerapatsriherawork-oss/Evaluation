// routes/topics.js
const express = require('express');
const db = require('../config/db');
const checkAuth = require('../middleware/checkAuth');

const router = express.Router();

// [!!! ใหม่ !!!] 1. เพิ่ม jsonParser สำหรับรับ req.body
const jsonParser = express.json();

// [!!! ใหม่ !!!] 2. เพิ่ม Middleware (เหมือนไฟล์ users.js / indicators.js)
const checkAdmin = (req, res, next) => {
  if (req.userData.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied. Admin role required.' });
  }
  next();
};


// GET /api/topics (All authenticated users)
// (โค้ดเดิมของคุณ ไม่ต้องแก้ไข)
router.get('/', checkAuth, async (req, res) => {
  try {
    const [topics] = await db.query('SELECT * FROM topics ORDER BY name');
    res.status(200).json(topics);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching topics.', error: err.message });
  }
});

// [!!! ใหม่ !!!] 3. สร้าง API สำหรับ POST (สร้างหัวข้อใหม่)
router.post('/', checkAuth, checkAdmin, jsonParser, async (req, res) => {
  const { name } = req.body;

  if (!name) {
    return res.status(400).json({ message: 'Topic name is required.' });
  }

  try {
    const [result] = await db.query(
      'INSERT INTO topics (name) VALUES (?)',
      [name]
    );
    res.status(201).json({ message: 'Topic created successfully.', topicId: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error creating topic.', error: err.message });
  }
});

// [!!! ใหม่ !!!] 4. สร้าง API สำหรับ PUT (แก้ไขหัวข้อ)
router.put('/:id', checkAuth, checkAdmin, jsonParser, async (req, res) => {
  const { id } = req.params;
  const { name } = req.body;

  if (!name) {
    return res.status(400).json({ message: 'Topic name is required.' });
  }

  try {
    const [result] = await db.query(
      'UPDATE topics SET name = ? WHERE id = ?',
      [name, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Topic not found.' });
    }
    res.status(200).json({ message: 'Topic updated successfully.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error updating topic.', error: err.message });
  }
});

// [!!! ใหม่ !!!] 5. สร้าง API สำหรับ DELETE (ลบหัวข้อ)
router.delete('/:id', checkAuth, checkAdmin, async (req, res) => {
  const { id } = req.params;

  try {
    const [result] = await db.query('DELETE FROM topics WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Topic not found.' });
    }
    res.status(200).json({ message: 'Topic deleted successfully.' });
  } catch (err) {
    console.error(err);
    // [สำคัญ] จัดการ Error เหมือนไฟล์ indicators.js
    // หากมี "ตัวชี้วัด" (indicators) ใช้งานหัวข้อนี้อยู่
    if (err.code === 'ER_ROW_IS_REFERENCED_2') {
      return res.status(409).json({ message: 'Cannot delete topic. It is referenced by existing indicators.' });
    }
    res.status(500).json({ message: 'Error deleting topic.', error: err.message });
  }
});


module.exports = router;