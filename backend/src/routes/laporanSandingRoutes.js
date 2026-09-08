const express = require('express');
const router  = express.Router();
const {
  createLaporanSanding,
  getAllLaporanSanding,
  getLaporanSandingById,
  updateLaporanSanding,
  deleteLaporanSanding,
} = require('../controllers/laporanSandingController');
const { verifyToken, authorizeRoles } = require('../middlewares/authMiddleware');

router.use(verifyToken);

// Semua role sending & sanding bisa POST dan GET
// admin bisa semua
router.post('/',      authorizeRoles('sending', 'admin'), createLaporanSanding);
router.get('/',       authorizeRoles('sending', 'admin'), getAllLaporanSanding);
router.get('/:id',    authorizeRoles('sending', 'admin'), getLaporanSandingById);
router.put('/:id',    authorizeRoles('sending', 'admin'), updateLaporanSanding);
router.delete('/:id', authorizeRoles('admin'),            deleteLaporanSanding);

module.exports = router;
