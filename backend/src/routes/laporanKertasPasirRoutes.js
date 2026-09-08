const express = require('express');
const router  = express.Router();
const {
  createLaporanKertasPasir,
  getAllLaporanKertasPasir,
  getLaporanKertasPasirById,
  updateLaporanKertasPasir,
  deleteLaporanKertasPasir,
} = require('../controllers/laporanKertasPasirController');
const { verifyToken, authorizeRoles } = require('../middlewares/authMiddleware');

router.use(verifyToken);

router.post('/',      authorizeRoles('sending', 'admin'), createLaporanKertasPasir);
router.get('/',       authorizeRoles('sending', 'admin'), getAllLaporanKertasPasir);
router.get('/:id',    authorizeRoles('sending', 'admin'), getLaporanKertasPasirById);
router.put('/:id',    authorizeRoles('sending', 'admin'), updateLaporanKertasPasir);
router.delete('/:id', authorizeRoles('admin'),            deleteLaporanKertasPasir);

module.exports = router;
