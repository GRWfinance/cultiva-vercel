const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const ctrl = require('../controllers/peopleAnalyticsController');

router.use(authenticate);
router.use(authorize('ADMIN', 'HR', 'MANAGER'));

router.get('/overview', ctrl.getOverview);
router.get('/engagement', ctrl.getEngagementOverview);
router.get('/performance', ctrl.getPerformanceOverview);
router.get('/learning', ctrl.getLearningOverview);

module.exports = router;
