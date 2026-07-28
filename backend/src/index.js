const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes           = require('./routes/authRoutes');
const userRoutes           = require('./routes/userRoutes');
const laporanMdfRoutes     = require('./routes/laporanMdfRoutes');
const laporanChipperRoutes = require('./routes/laporanChipperRoutes');
const laporanCoolingRoutes = require('./routes/laporanCoolingRoutes');
const laporanImalRoutes    = require('./routes/laporanImalRoutes');
const { testConnection } = require('./config/db');
const initDb = require('./config/initDb');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: (origin, callback) => {
    // Izinkan request tanpa origin (mobile app, Postman, dll)
    if (!origin) return callback(null, true);

    const allowedPatterns = [
      /^http:\/\/localhost(:\d+)?$/,
      /^http:\/\/127\.0\.0\.1(:\d+)?$/,
      /^http:\/\/192\.168\.\d{1,3}\.\d{1,3}(:\d+)?$/,
      /^http:\/\/10\.\d{1,3}\.\d{1,3}\.\d{1,3}(:\d+)?$/,
      /^http:\/\/172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}(:\d+)?$/,
    ];

    const allowed = allowedPatterns.some((pattern) => pattern.test(origin));
    if (allowed) {
      callback(null, true);
    } else {
      callback(new Error(`CORS blocked: ${origin}`));
    }
  },
  credentials: true,
}));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/laporan-mdf', laporanMdfRoutes);
app.use('/api/laporan-chipper', laporanChipperRoutes);
app.use('/api/laporan-cooling', laporanCoolingRoutes);
app.use('/api/laporan-imal', laporanImalRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Global error:', err.message);
  res.status(500).json({ message: 'Internal server error', detail: err.message });
});

// Start server
app.listen(PORT, '0.0.0.0', async () => {
  console.log(`Server running on:`);
  console.log(`  Local:   http://localhost:${PORT}`);
  console.log(`  Network: http://192.168.3.77:${PORT}`);

  const connected = await testConnection();
  if (connected) {
    await initDb();
  } else {
    console.error('Skipping DB initialization due to connection failure.');
  }
});

// Prevent crash on unhandled errors
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err.message);
});

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection:', reason);
});
