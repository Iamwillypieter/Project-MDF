/**
 * Middleware: Sanitasi & Validasi Input
 *
 * Menggunakan express-validator untuk:
 * - Mencegah XSS (escape karakter berbahaya)
 * - Mencegah SQL Injection / NoSQL Injection (trim & escape)
 * - Validasi format data sebelum masuk ke controller/query DB
 *
 * Cara pakai di route:
 *   const { sanitizeLogin } = require('../middlewares/sanitizeInput');
 *   router.post('/login', sanitizeLogin, authController.login);
 */

const { body, validationResult } = require('express-validator');

// ── Helper: kirim error validasi ke client ───────────────────────────────────
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      message: 'Data tidak valid',
      errors: errors.array().map((e) => ({ field: e.path, msg: e.msg })),
    });
  }
  next();
};

// ── Sanitasi Login ────────────────────────────────────────────────────────────
const sanitizeLogin = [
  body('username')
    .trim()
    .escape()                            // encode < > & " ' /
    .notEmpty().withMessage('Username wajib diisi')
    .isLength({ min: 3, max: 50 }).withMessage('Username 3–50 karakter')
    .matches(/^[a-zA-Z0-9._-]+$/).withMessage('Username hanya boleh huruf, angka, titik, strip, underscore'),

  body('password')
    .trim()
    .notEmpty().withMessage('Password wajib diisi')
    .isLength({ min: 6, max: 128 }).withMessage('Password minimal 6 karakter'),

  handleValidationErrors,
];

// ── Sanitasi Umum untuk Form Laporan ─────────────────────────────────────────
// Gunakan ini sebagai middleware dasar di semua route POST/PUT laporan.
// Tambahkan validasi spesifik di masing-masing route jika diperlukan.
const sanitizeGenericForm = [
  // Escape semua field string di body secara dinamis
  body('*').trim().escape(),
  handleValidationErrors,
];

// ── Sanitasi User (create/update) ─────────────────────────────────────────────
const sanitizeUserForm = [
  body('name')
    .trim()
    .escape()
    .notEmpty().withMessage('Nama wajib diisi')
    .isLength({ min: 2, max: 100 }).withMessage('Nama 2–100 karakter'),

  body('username')
    .trim()
    .escape()
    .notEmpty().withMessage('Username wajib diisi')
    .isLength({ min: 3, max: 50 }).withMessage('Username 3–50 karakter')
    .matches(/^[a-zA-Z0-9._-]+$/).withMessage('Username hanya boleh huruf, angka, titik, strip, underscore'),

  body('password')
    .optional()
    .trim()
    .isLength({ min: 6, max: 128 }).withMessage('Password minimal 6 karakter'),

  body('role')
    .trim()
    .escape()
    .optional()
    .isIn(['admin', 'operator', 'viewer']).withMessage('Role tidak valid'),

  handleValidationErrors,
];

module.exports = {
  sanitizeLogin,
  sanitizeGenericForm,
  sanitizeUserForm,
  handleValidationErrors,
};
