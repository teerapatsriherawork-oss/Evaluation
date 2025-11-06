const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware (Global)
app.use(cors());

// [!!! FINAL FIX !!!]
// เอา Global body parsers ออก เพื่อไม่ให้รบกวน multer
// เราจะไปใส่เฉพาะใน Route ที่ต้องการ JSON/URL Encoded
app.use(express.json());             // <-- ลบออก
// app.use(express.urlencoded({ extended: true })); // <-- ลบออก
// [!!! END FINAL FIX !!!]

// Serve static files (uploads)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Import Routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const topicRoutes = require('./routes/topics');
const indicatorRoutes = require('./routes/indicators');
const submissionRoutes = require('./routes/submissions');

// Use Routes
app.use('/api/auth', authRoutes); // ต้องมี jsonParser ภายใน Route นี้
app.use('/api/users', userRoutes); // ต้องมี jsonParser ภายใน Route นี้
app.use('/api/topics', topicRoutes); // ต้องมี jsonParser ภายใน Route นี้
app.use('/api/indicators', indicatorRoutes); // ต้องมี jsonParser ภายใน Route นี้
app.use('/api/submissions', submissionRoutes); // Multer จะจัดการเอง, /evaluate มี jsonParser ภายใน

// Global Error Handler
app.use((err, req, res, next) => {
  console.error("Global Error Handler:", err.stack); 
  res.status(500).json({ message: 'Something broke!', error: err.message }); 
});

// Start Server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
