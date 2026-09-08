const express = require('express');
const router  = express.Router();
const {
  createLaporanQcLab,
  getAllLaporanQcLab,
  getLaporanQcLabById,
  updateLaporanQcLab,
  deleteLaporanQcLab,
} = require('../controllers/laporanQcLabController');
const { verifyToken, authorizeRoles } = require('../middlewares/authMiddleware');

router.use(verifyToken);

router.post('/',      authorizeRoles('qc_lab', 'admin'),              createLaporanQcLab);
router.get('/',       authorizeRoles('qc_lab', 'admin'),              getAllLaporanQcLab);
router.get('/:id',    authorizeRoles('qc_lab', 'admin'),              getLaporanQcLabById);
router.put('/:id',    authorizeRoles('qc_lab', 'admin'),              updateLaporanQcLab);
router.delete('/:id', authorizeRoles('admin'),                        deleteLaporanQcLab);

module.exports = router;
