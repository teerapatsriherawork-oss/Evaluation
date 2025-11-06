// config/db.js
const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: 'utf8mb4',
});

// Test connection
pool.getConnection()
  .then(conn => {u
    console.log('MySQL Connected successfully.');
    conn.release();
  })
  .catch(err => {
    console.error('MySQL Connection Failed:', err.message);
  });

module.exports = pool;
