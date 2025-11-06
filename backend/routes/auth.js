const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const checkAuth = require('../middleware/checkAuth');

const router = express.Router();

// [!!! FIXED !!!] เพิ่ม Middleware สำหรับ Route นี้โดยเฉพาะ
// นี่คือสิ่งจำเป็นเพราะเราเอา express.json() ออกจาก server.js แล้ว
const jsonParser = express.json();
// [!!! END FIXED !!!]

// POST /api/auth/login
// [!!! FIXED !!!] ใช้ jsonParser เพื่อให้อ่าน req.body (email, password) ได้
router.post('/login', jsonParser, async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }

  try {
    const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    if (users.length === 0) {
      return res.status(401).json({ message: 'Authentication failed. User not found.' });
    }

    const user = users[0];

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Authentication failed. Invalid credentials.' });
    }

    const token = jwt.sign(
      { userId: user.id, role: user.role, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '3h' }
    );

    // Don't send password back
    const userResponse = {
      id: user.id,
      email: user.email,
      role: user.role,
      assessor_id: user.assessor_id,
    };

    res.status(200).json({ token, user: userResponse });
  } catch (err) {
    console.error("Login Error:", err);
    res.status(500).json({ message: 'Error logging in.', error: err.message });
  }
});

// GET /api/auth/profile
router.get('/profile', checkAuth, async (req, res) => {
  try {
    const [users] = await db.query('SELECT id, email, role, assessor_id FROM users WHERE id = ?', [req.userData.userId]);
    if (users.length === 0) {
      return res.status(404).json({ message: 'User not found.' });
    }
    res.status(200).json(users[0]);
  } catch (err) {
    console.error("Profile Error:", err);
    res.status(500).json({ message: 'Error fetching profile.', error: err.message });
  }
});

module.exports = router;
