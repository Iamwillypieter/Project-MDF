const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // SSL sudah diatur via sslmode=require di connection string
  // Nonaktifkan rejectUnauthorized untuk Neon pooler
  ssl: {
    rejectUnauthorized: false,
  },
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

// Handle unexpected errors agar server tidak crash
pool.on('error', (err) => {
  console.error('Unexpected database error:', err.message);
});

// Test koneksi saat startup
const testConnection = async (retries = 5, delay = 3000) => {
  for (let i = 1; i <= retries; i++) {
    try {
      const client = await pool.connect();
      console.log('Connected to Neon PostgreSQL database');
      client.release();
      return true;
    } catch (err) {
      console.error(`Database connection attempt ${i}/${retries} failed: ${err.message}`);
      if (i < retries) {
        console.log(`Retrying in ${delay / 1000}s...`);
        await new Promise((res) => setTimeout(res, delay));
      }
    }
  }
  console.error('Could not connect to database after all retries.');
  return false;
};

module.exports = { pool, testConnection };
