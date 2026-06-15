const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const ctrl = require('../controllers/pdiController');

router.use(authenticate);

router.post('/', ctrl.createPDI);
router.get('/', ctrl.listPDIs);
router.get('/:id', ctrl.getPDI);
router.patch('/:id', ctrl.updatePDI);
router.post('/:id/goals', ctrl.addGoal);
router.patch('/goals/:goalId', ctrl.updateGoal);

module.exports = router;
