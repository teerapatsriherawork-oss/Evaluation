const express = require('express');
const router = express.Router();
const db = require('../config/db');
const checkAuth = require('../middleware/checkAuth');
const multer = require('multer');
const path = require('path');

// เพิ่ม Middleware สำหรับ /evaluate
const jsonParser = express.json();


// --- 1. Multer Storage Configuration ---
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // ใช้ 'uploads/' เพื่อให้ถูกต้องตามโครงสร้างโปรเจกต์ (backend/uploads/)
    cb(null, 'uploads/'); 
  },
  filename: (req, file, cb) => {
    // สร้างชื่อไฟล์ใหม่ที่ไม่ซ้ำกัน
    const uniqueName = `${req.userData.userId}-${Date.now()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|ppt|pptx/;
    const mimetype = allowedTypes.test(file.mimetype);
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());

    if (mimetype && extname) {
      cb(null, true);
    } else {
      cb(new Error('File type not allowed! Only specific formats are accepted.'), false);
    }
  },
});

// --- 2. The Upload Route ---
router.post('/upload', checkAuth, (req, res, next) => {
    // ใช้ Multer Middleware เพื่อจัดการไฟล์
    upload.single('evaluationFile')(req, res, function (err) {
        if (err) {
            // Handle Multer and fileFilter errors
            const message = err.message || 'File upload failed due to server error.';
            console.error("Upload Error:", err);
            return res.status(400).json({ message: message });
        }
        next();
    });
} , async (req, res) => {
  
  try {
    const { indicator_id } = req.body; // Multer parse form data to req.body
    const user_id = req.userData.userId;
    
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded or file parsing error.' });
    }
    
    // ใช้ 'uploads/' เป็น URL path
    const filePath = `uploads/${req.file.filename}`; 

    // ตรวจสอบว่ามี submission นี้อยู่แล้วหรือยัง (UPSERT Logic)
    const [existing] = await db.query(
      'SELECT id FROM submissions WHERE user_id = ? AND indicator_id = ?',
      [user_id, indicator_id]
    );

    let submission_id;

    if (existing.length > 0) {
      submission_id = existing[0].id;
      await db.query(
        'UPDATE submissions SET file_url = ?, score = NULL, comment = NULL WHERE id = ?',
        [filePath, submission_id]
      );
    } else {
      const [result] = await db.query(
        'INSERT INTO submissions (user_id, indicator_id, file_url) VALUES (?, ?, ?)',
        [user_id, indicator_id, filePath]
      );
      submission_id = result.insertId;
    }

    res.status(201).json({
      message: 'File uploaded successfully',
      filePath: filePath,
      submission_id: submission_id
    });

  } catch (err) {
    console.error('Upload Error:', err);
    res.status(500).json({ message: 'Server error during file upload.', error: err.message });
  }
});


// --- 3. The Get Submissions Route ---
router.get('/', checkAuth, async (req, res) => {
  const { userId, role } = req.userData;
  
  try {
    let sql;
    let params = [];

    if (role === 'employee') {
      params = [userId];
      // (ส่วนนี้ดึงข้อมูลของตัวเอง ไม่ต้องแก้)
      sql = `
        SELECT t.id AS topic_id, t.name AS topic_name, i.id AS indicator_id, i.name AS indicator_name, i.detail AS indicator_detail, s.id AS submission_id, s.file_url, s.score, s.comment
        FROM indicators i JOIN topics t ON i.topic_id = t.id LEFT JOIN submissions s ON i.id = s.indicator_id AND s.user_id = ? ORDER BY t.id, i.id;
      `;
    } else if (role === 'assessor') {
      params = [userId];
      // (นี่คือ SQL ที่แก้ไขแล้วสำหรับดึงชื่อ)
      sql = `
        SELECT 
          s.id AS submission_id, s.file_url, s.score, s.comment, 
          i.id AS indicator_id, i.name AS indicator_name, 
          u.id AS user_id, u.email AS user_email,
          u.first_name AS user_first_name, 
          u.last_name AS user_last_name
        FROM submissions s 
        JOIN users u ON s.user_id = u.id 
        JOIN indicators i ON s.indicator_id = i.id 
        WHERE u.assessor_id = ? 
        ORDER BY u.id, s.id;
      `;
    } else {
      // Admin (หรือ Role อื่นๆ)
      // (นี่คือ SQL ที่แก้ไขแล้วสำหรับดึงชื่อ)
      sql = `
        SELECT 
          s.id AS submission_id, s.file_url, s.score, s.comment, 
          i.id AS indicator_id, i.name AS indicator_name, 
          u.id AS user_id, u.email AS user_email, t.name AS topic_name,
          u.first_name AS user_first_name,
          u.last_name AS user_last_name
        FROM submissions s 
        JOIN users u ON s.user_id = u.id 
        JOIN indicators i ON s.indicator_id = i.id 
        JOIN topics t ON i.topic_id = t.id 
        ORDER BY u.id, s.id;
      `;
    }
    
    const [data] = await db.query(sql, params);
    return res.status(200).json(data);

  } catch (err) {
    console.error('Get Submissions Error:', err);
    res.status(500).json({ message: 'Server error.', error: err.message });
  }
});


// --- 4. The Evaluate Route ---
router.post('/evaluate', checkAuth, jsonParser, async (req, res) => { // ใช้ jsonParser
  const { role, userId: assessorId } = req.userData;
  const { submission_id, score, comment } = req.body;

  if (role !== 'assessor') {
    // [!!! นี่คือจุดที่แก้ไข !!!] เปลี่ยนจาก 4AJB เป็น 403
    return res.status(403).json({ message: 'Only assessors can evaluate' });
  }
  
  // Validation
  if (!submission_id || !score || score < 1 || score > 5) {
    return res.status(400).json({ message: 'Invalid input. Score must be between 1 and 5.' });
  }

  try {
    const [rows] = await db.query(
      `SELECT s.id FROM submissions s JOIN users u ON s.user_id = u.id WHERE s.id = ? AND u.assessor_id = ?`,
      [submission_id, assessorId]
    );

    if (rows.length === 0) {
      return res.status(403).json({ message: 'Forbidden. You are not assigned to this user.' });
    }

    // อัปเดตคะแนน
    await db.query(
      'UPDATE submissions SET score = ?, comment = ? WHERE id = ?',
      [score, comment || null, submission_id]
    );

    res.status(200).json({ message: 'Evaluation submitted successfully' });

  } catch (err) {
    console.error('Evaluate Error:', err);
    res.status(500).json({ message: 'Server error.', error: err.message });
  }
});

module.exports = router;