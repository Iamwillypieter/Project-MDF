const express = require('express');
const router  = express.Router();
const {
  createLaporanChipper,
  getAllLaporanChipper,
  getLaporanChipperById,
  updateLaporanChipper,
  deleteLaporanChipper,
} = require('../controllers/laporanChipperController');
const { verifyToken, authorizeRoles } = require('../middlewares/authMiddleware');

router.use(verifyToken);

router.post('/',      authorizeRoles('produksi', 'admin'),           createLaporanChipper);
router.get('/',       authorizeRoles('admin', 'produksi', 'sending'), getAllLaporanChipper);
router.get('/:id',    authorizeRoles('admin', 'produksi', 'sending'), getLaporanChipperById);
router.put('/:id',    authorizeRoles('produksi', 'admin'),                  updateLaporanChipper);
router.delete('/:id', authorizeRoles('admin'),                        deleteLaporanChipper);

module.exports = router;
