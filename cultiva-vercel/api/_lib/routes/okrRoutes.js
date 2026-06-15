const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const ctrl = require('../controllers/okrController');

router.use(authenticate);

router.post('/', ctrl.createObjective);
router.get('/', ctrl.listObjectives);
router.get('/dashboard', ctrl.getOKRDashboard);
router.get('/:id', ctrl.getObjective);
router.patch('/:id', ctrl.updateObjective);
router.post('/:id/key-results', ctrl.addKeyResult);
router.post('/key-results/:krId/check-in', ctrl.checkInKeyResult);

module.exports = router;
