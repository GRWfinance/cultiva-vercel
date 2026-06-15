const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const ctrl = require('../controllers/feedbackController');

router.use(authenticate);

router.post('/', ctrl.createFeedback);
router.get('/received', ctrl.listReceivedFeedbacks);
router.get('/sent', ctrl.listSentFeedbacks);
router.get('/public', ctrl.listPublicFeedbacks);
router.get('/employee/:userId', ctrl.listFeedbacksForEmployee);

module.exports = router;
