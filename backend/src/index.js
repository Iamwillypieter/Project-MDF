/**
 * Entry Point – MDF Backend
 * Security: helmet, cors (whitelist), rate-limit, input sanitasi, static serving SPA
 */

const path    = require('path');
const express = require('express');
const cors    = require('cors');
const helmet  = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const authRoutes               = require('./routes/authRoutes');
const userRoutes               = require('./routes/userRoutes');
const laporanMdfRoutes         = require('./routes/laporanMdfRoutes');
const laporanChipperRoutes     = require('./routes/laporanChipperRoutes');
const laporanCoolingRoutes     = require('./routes/laporanCoolingRoutes');
const laporanImalRoutes        = require('./routes/laporanImalRoutes');
const laporanSandingRoutes     = require('./routes/laporanSandingRoutes');
const laporanKertasPasirRoutes = require('./routes/laporanKertasPasirRoutes');
const laporanQcLabRoutes       = require('./routes/laporanQcLabRoutes');
const laporanQcLabShiftRoutes  = require('./routes/laporanQcLabShiftRoutes');
const laporanDailyTestRoutes   = require('./routes/laporanDailyTestRoutes');
const { testConnection }       = require('./config/db');
const initDb                   = require('./config/initDb');

const app  = express();
const PORT = process.env.PORT || 5000;
const isProd = process.env.NODE_ENV === 'production';

// ── 1. Security Headers (Helmet) ────────────────────────────────────────────
// Helmet otomatis menyembunyikan X-Powered-By dan mengatur banyak header keamanan.
app.use(
  helmet({
    // Nonaktifkan HSTS karena server tidak pakai HTTPS
    strictTransportSecurity: false,
    // Content-Security-Policy: sesuaikan jika ada CDN/font eksternal
    contentSecurityPolicy: isProd
      ? {
          directives: {
            defaultSrc:  ["'self'"],
            scriptSrc:   ["'self'"],
            styleSrc:    ["'self'", "'unsafe-inline'"], // Tailwind inline style
            imgSrc:      ["'self'", 'data:'],
            connectSrc:  ["'self'"],
            fontSrc:     ["'self'"],
            objectSrc:   ["'none'"],
            frameSrc:    ["'none'"],
            upgradeInsecureRequests: isProd ? [] : null,
          },
        }
      : false, // Nonaktifkan CSP di dev agar HMR Vite tidak terganggu
    crossOriginEmbedderPolicy: false, // Bisa menyebabkan masalah dengan asset embed
  })
);

// ── 2. CORS – Whitelist Ketat ────────────────────────────────────────────────
// Daftar origin yang diizinkan dibaca dari .env agar mudah dikonfigurasi per-server.
// Format di .env: ALLOWED_ORIGINS=http://192.168.3.77,https://pabrik.example.com
const buildAllowedOrigins = () => {
  const fromEnv = process.env.ALLOWED_ORIGINS || '';
  const envList = fromEnv
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

  if (isProd) {
    // Production: hanya izinkan origin eksplisit dari .env
    return envList.length > 0 ? envList : [];
  }

  // Development: tambahkan localhost & LAN secara otomatis
  return [
    ...envList,
    'http://localhost:5173',
    'http://localhost:3000',
    'http://127.0.0.1:5173',
  ];
};

const allowedOrigins = buildAllowedOrigins();

app.use(
  cors({
    origin: (origin, callback) => {
      // Izinkan request tanpa origin (browser same-origin, Postman, dll)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      console.warn(`[CORS] Origin diblokir: ${origin}`);
      return callback(new Error(`CORS: origin tidak diizinkan – ${origin}`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// ── 3. Body Parser ──────────────────────────────────────────────────────────
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

// ── 4. Rate Limiter – Global (semua endpoint) ────────────────────────────────
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 menit
  max: 300,                  // maks 300 request per IP per window
  message: { message: 'Terlalu banyak permintaan, coba lagi nanti.' },
});
app.use('/api', globalLimiter);

// ── 5. Rate Limiter – Ketat untuk endpoint Auth & Form Submit ────────────────
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 menit
  max: 20,                   // maks 20 percobaan login per IP per 15 menit
  message: { message: 'Terlalu banyak percobaan login. Silakan tunggu 15 menit.' },
  skipSuccessfulRequests: true,
});
app.use('/api/auth/login', authLimiter);

// Rate limiter untuk form submit laporan (anti-spam)
const submitLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 menit
  max: 30,                  // maks 30 submit per IP per menit
  message: { message: 'Terlalu banyak pengiriman data. Coba lagi dalam 1 menit.' },
});
app.use('/api/laporan-mdf',       submitLimiter);
app.use('/api/laporan-chipper',   submitLimiter);
app.use('/api/laporan-cooling',   submitLimiter);
app.use('/api/laporan-imal',      submitLimiter);
app.use('/api/laporan-sanding',   submitLimiter);
app.use('/api/laporan-kertas-pasir', submitLimiter);
app.use('/api/laporan-qclab',     submitLimiter);
app.use('/api/laporan-qclab-shift',  submitLimiter);
app.use('/api/laporan-daily-test',   submitLimiter);

// ── 6. API Routes ────────────────────────────────────────────────────────────
app.use('/api/auth',             authRoutes);
app.use('/api/users',            userRoutes);
app.use('/api/laporan-mdf',      laporanMdfRoutes);
app.use('/api/laporan-chipper',  laporanChipperRoutes);
app.use('/api/laporan-cooling',  laporanCoolingRoutes);
app.use('/api/laporan-imal',     laporanImalRoutes);
app.use('/api/laporan-sanding',  laporanSandingRoutes);
app.use('/api/laporan-kertas-pasir', laporanKertasPasirRoutes);
app.use('/api/laporan-qclab',       laporanQcLabRoutes);
app.use('/api/laporan-qclab-shift', laporanQcLabShiftRoutes);
app.use('/api/laporan-daily-test',  laporanDailyTestRoutes);

// ── 7. Health Check ──────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', env: process.env.NODE_ENV });
});

// ── 8. Static Files SPA (Production Only) ────────────────────────────────────
// Serve hasil build Vite (frontend/dist) dan fallback ke index.html
// agar React Router tidak 404 saat halaman di-refresh.
if (isProd) {
  const distPath = path.join(__dirname, '..', '..', 'frontend', 'dist');

  app.use(
    express.static(distPath, {
      maxAge: '7d',      // cache asset statis browser 7 hari
      etag: true,
      lastModified: true,
    })
  );

  // Fallback SPA – semua route non-API dikembalikan index.html
  app.get('*', (req, res, next) => {
    // Pastikan tidak menimpa route /api/*
    if (req.path.startsWith('/api/')) return next();
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

// ── 9. Global Error Handler ──────────────────────────────────────────────────
// Jangan bocorkan stack trace ke client di production.
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, _next) => {
  const status = err.status || 500;

  // Log lengkap di server
  console.error(`[${new Date().toISOString()}] ${req.method} ${req.path} → ${status}: ${err.message}`);

  // Response ke client: detail hanya di development
  res.status(status).json({
    message: isProd ? 'Internal server error' : err.message,
    ...(isProd ? {} : { stack: err.stack }),
  });
});

// ── 10. Start Server ─────────────────────────────────────────────────────────
app.listen(PORT, '0.0.0.0', async () => {
  console.log(`[${process.env.NODE_ENV}] Server running on port ${PORT}`);
  if (!isProd) {
    console.log(`  Local:   http://localhost:${PORT}`);
    console.log(`  Network: http://192.168.3.77:${PORT}`);
  }

  const connected = await testConnection();
  if (connected) {
    await initDb();
  } else {
    console.error('Skipping DB initialization due to connection failure.');
  }

  // Sinyal ke PM2 bahwa aplikasi siap (diperlukan untuk wait_ready: true)
  if (process.send) {
    process.send('ready');
  }
});

// ── 11. Graceful Shutdown (PM2 SIGINT pada reload) ───────────────────────────
process.on('SIGINT', () => {
  console.log('SIGINT received – graceful shutdown...');
  process.exit(0);
});

// ── 12. Catch-all untuk error yang tidak tertangkap ─────────────────────────
process.on('uncaughtException', (err) => {
  console.error(`[uncaughtException] ${err.message}`);
  // Jangan exit – PM2 akan restart otomatis jika diperlukan
});

process.on('unhandledRejection', (reason) => {
  console.error('[unhandledRejection]', reason);
});
