const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const ctrl = require('../controllers/surveyController');

router.use(authenticate);

router.post('/', authorize('ADMIN', 'HR'), ctrl.createSurvey);
router.get('/', authorize('ADMIN', 'HR'), ctrl.listSurveys);
router.get('/available', ctrl.listAvailableSurveys);
router.post('/:id/activate', authorize('ADMIN', 'HR'), ctrl.activateSurvey);
router.post('/:id/close', authorize('ADMIN', 'HR'), ctrl.closeSurvey);
router.post('/:id/responses', ctrl.submitResponse);
router.get('/:id/results', authorize('ADMIN', 'HR'), ctrl.getSurveyResults);

module.exports = router;
