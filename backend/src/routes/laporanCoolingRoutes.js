const express = require('express');
const router  = express.Router();
const {
  createLaporanCooling, getAllLaporanCooling,
  getLaporanCoolingById, updateLaporanCooling, deleteLaporanCooling,
} = require('../controllers/laporanCoolingController');
const { verifyToken, authorizeRoles } = require('../middlewares/authMiddleware');

router.use(verifyToken);

router.post('/',      authorizeRoles('produksi', 'admin'),            createLaporanCooling);
router.get('/',       authorizeRoles('admin', 'produksi', 'sending'), getAllLaporanCooling);
router.get('/:id',    authorizeRoles('admin', 'produksi', 'sending'), getLaporanCoolingById);
router.put('/:id',    authorizeRoles('produksi', 'admin'),                   updateLaporanCooling);
router.delete('/:id', authorizeRoles('admin'),                        deleteLaporanCooling);

module.exports = router;
