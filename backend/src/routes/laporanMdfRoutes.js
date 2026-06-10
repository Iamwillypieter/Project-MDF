const express = require('express');
const router = express.Router();
const {
  createLaporan, getAllLaporan, getLaporanById, updateLaporan, deleteLaporan,
} = require('../controllers/laporanMdfController');
const { verifyToken, authorizeRoles } = require('../middlewares/authMiddleware');

router.use(verifyToken);

router.post('/',      authorizeRoles('produksi', 'admin'),           createLaporan);
router.get('/',       authorizeRoles('admin', 'produksi', 'sending'), getAllLaporan);
router.get('/:id',    authorizeRoles('admin', 'produksi', 'sending'), getLaporanById);
router.put('/:id',    authorizeRoles('produksi', 'admin'),                  updateLaporan);
router.delete('/:id', authorizeRoles('admin'),                        deleteLaporan);

module.exports = router;
