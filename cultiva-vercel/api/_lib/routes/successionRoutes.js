const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const ctrl = require('../controllers/successionController');

router.use(authenticate);
router.use(authorize('ADMIN', 'HR', 'MANAGER'));

router.post('/entries', ctrl.upsertEntry);
router.get('/matrix', ctrl.getMatrix);
router.post('/candidates', ctrl.addCandidate);
router.get('/critical-positions', ctrl.listCriticalPositions);

module.exports = router;
