const express = require('express');
const router  = express.Router();
const {
  createDailyTest, getAllDailyTests, getDailyTestById,
  updateDailyTest, deleteDailyTest,
} = require('../controllers/laporanDailyTestController');
const { verifyToken, authorizeRoles } = require('../middlewares/authMiddleware');

router.use(verifyToken);

router.post('/',      authorizeRoles('sending', 'admin'), createDailyTest);
router.get('/',       authorizeRoles('sending', 'admin', 'qc_lab'), getAllDailyTests);
router.get('/:id',    authorizeRoles('sending', 'admin', 'qc_lab'), getDailyTestById);
router.put('/:id',    authorizeRoles('sending', 'admin'), updateDailyTest);
router.delete('/:id', authorizeRoles('admin'),            deleteDailyTest);

module.exports = router;
