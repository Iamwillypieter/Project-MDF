const express = require('express');
const router  = express.Router();
const {
  createLaporanImal, getAllLaporanImal, getLaporanImalById,
  updateLaporanImal, verifikasiLaporanImal, deleteLaporanImal,
} = require('../controllers/laporanImalController');
const { verifyToken, authorizeRoles } = require('../middlewares/authMiddleware');

router.use(verifyToken);

router.post('/',               authorizeRoles('produksi', 'admin'),            createLaporanImal);
router.get('/',                authorizeRoles('admin', 'produksi', 'sending'), getAllLaporanImal);
router.get('/:id',             authorizeRoles('admin', 'produksi', 'sending'), getLaporanImalById);
router.put('/:id',             authorizeRoles('produksi', 'admin'),                   updateLaporanImal);
router.patch('/:id/verifikasi',authorizeRoles('admin'),                        verifikasiLaporanImal);
router.delete('/:id',          authorizeRoles('admin'),                        deleteLaporanImal);

module.exports = router;
