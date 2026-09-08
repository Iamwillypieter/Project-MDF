const express = require('express');
const router  = express.Router();
const {
  createShiftReport,
  getAllShiftReports,
  getShiftReportById,
  updateShiftReport,
  deleteShiftReport,
} = require('../controllers/laporanQcLabShiftController');
const { verifyToken, authorizeRoles } = require('../middlewares/authMiddleware');

router.use(verifyToken);

// qc_lab & admin bisa CRUD; hanya admin yang bisa delete
router.post('/',      authorizeRoles('qc_lab', 'admin'), createShiftReport);
router.get('/',       authorizeRoles('qc_lab', 'admin'), getAllShiftReports);
router.get('/:id',    authorizeRoles('qc_lab', 'admin'), getShiftReportById);
router.put('/:id',    authorizeRoles('qc_lab', 'admin'), updateShiftReport);
router.delete('/:id', authorizeRoles('admin'),            deleteShiftReport);

module.exports = router;
