const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const ctrl = require('../controllers/reviewController');

router.use(authenticate);

// Ciclos (Admin/HR)
router.post('/cycles', authorize('ADMIN', 'HR'), ctrl.createCycle);
router.get('/cycles', ctrl.listCycles);
router.post('/cycles/:id/open', authorize('ADMIN', 'HR'), ctrl.openCycle);
router.post('/cycles/:id/close', authorize('ADMIN', 'HR'), ctrl.closeCycle);

// Minhas avaliações
router.get('/my-reviews', ctrl.listMyReviews);
router.get('/:id', ctrl.getReview);
router.post('/:id/submit', ctrl.submitReview);

// Resultados consolidados
router.get('/participants/:id/results', ctrl.getParticipantResults);

module.exports = router;
