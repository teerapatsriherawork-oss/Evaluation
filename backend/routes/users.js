// routes/users.js
const express = require('express');
const bcrypt = require('bcryptjs');
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

// GET /api/users (Admin only) 
router.get('/', checkAuth, checkAdmin, async (req, res) => {
  try {
    const [users] = await db.query('SELECT id, email, first_name, last_name, role, assessor_id FROM users');
    res.status(200).json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching users.', error: err.message });
  }
});

// POST /api/users (Admin only) ** 
router.post('/', checkAuth, checkAdmin, jsonParser, async (req, res) => {
  const { email, password, role, assessor_id, first_name, last_name } = req.body;

  // Validation
  if (!email || !password || !role) {
    return res.status(400).json({ message: 'Email, password, and role are required.' });
  }
  if (password.length < 8) {
    return res.status(400).json({ message: 'Password must be at least 8 characters long.' });
  }

  try {
    // Check if email already exists
    const [existingUsers] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existingUsers.length > 0) {
      return res.status(409).json({ message: 'Email already in use.' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Handle assessor_id (null if not provided or empty)
    const finalAssessorId = (role === 'employee' && assessor_id) ? assessor_id : null;

    // Insert user
    // [!!! แก้ไข 3/4 !!!] เพิ่ม first_name, last_name
    const [result] = await db.query(
      'INSERT INTO users (email, first_name, last_name, password, role, assessor_id) VALUES (?, ?, ?, ?, ?, ?)',
      [email, first_name || null, last_name || null, hashedPassword, role, finalAssessorId]
    );

    res.status(201).json({ message: 'User created successfully.', userId: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error creating user.', error: err.message });
  }
});


// PUT /api/users/:id (แก้ไขผู้ใช้)
router.put('/:id', checkAuth, checkAdmin, jsonParser, async (req, res) => {
  const { id } = req.params;
  // [!!! แก้ไข 4/4 !!!] เพิ่ม first_name, last_name
  const { email, role, assessor_id, password, first_name, last_name } = req.body;

  // Validation
  if (!email || !role) {
    return res.status(400).json({ message: 'Email and role are required.' });
  }

  try {
    // 1. ตรวจสอบว่ามีการส่งรหัสผ่านใหม่มาหรือไม่
    if (password && password.length > 0) {
      if (password.length < 8) {
        return res.status(400).json({ message: 'Password must be at least 8 characters long.' });
      }
      // ถ้ามี ให้ hash และอัปเดต
      const hashedPassword = await bcrypt.hash(password, 10);
      await db.query(
        'UPDATE users SET password = ? WHERE id = ?',
        [hashedPassword, id]
      );
    }

    // 2. อัปเดตข้อมูลส่วนที่เหลือ
    const finalAssessorId = (role === 'employee' && assessor_id) ? assessor_id : null;
    
    const [result] = await db.query(
      'UPDATE users SET email = ?, first_name = ?, last_name = ?, role = ?, assessor_id = ? WHERE id = ?',
      [email, first_name || null, last_name || null, role, finalAssessorId, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'User not found.' });
    }
    res.status(200).json({ message: 'User updated successfully.' });

  } catch (err) {
    // จัดการ Error ถ้าอีเมลซ้ำ
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'Email already in use by another user.' });
    }
    console.error('Update User Error:', err);
    res.status(500).json({ message: 'Error updating user.', error: err.message });
  }
});


// DELETE /api/users/:id (ลบผู้ใช้)
router.delete('/:id', checkAuth, checkAdmin, async (req, res) => {
  const { id } = req.params;
  const adminId = req.userData.userId; // ID ของ Admin ที่กำลังล็อกอินอยู่

  // ป้องกัน Admin ลบบัญชีตัวเอง
  if (parseInt(id, 10) === adminId) {
    return res.status(403).json({ message: 'You cannot delete your own account.' });
  }

  try {
    const [result] = await db.query('DELETE FROM users WHERE id = ?', [id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'User not found.' });
    }
    res.status(200).json({ message: 'User deleted successfully.' });

  } catch (err) {
    // จัดการ Error ถ้า User นี้ถูกใช้อยู่ (เช่น เป็น Assessor ของคนอื่น หรือมี Submissions)
    if (err.code === 'ER_ROW_IS_REFERENCED_2') {
      return res.status(409).json({ message: 'Cannot delete user. They are referenced by other data (e.g., as an assessor or in submissions).' });
    }
    console.error('Delete User Error:', err);
    res.status(500).json({ message: 'Error deleting user.', error: err.message });
  }
});


module.exports = router;