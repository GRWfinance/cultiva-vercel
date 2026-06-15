const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const ctrl = require('../controllers/learningController');

router.use(authenticate);

router.post('/courses', authorize('ADMIN', 'HR'), ctrl.createCourse);
router.get('/courses', ctrl.listCourses);
router.get('/courses/:id', ctrl.getCourse);
router.post('/courses/:id/enroll', ctrl.enroll);
router.post('/modules/:moduleId/complete', ctrl.completeModule);
router.get('/my-enrollments', ctrl.listMyEnrollments);

module.exports = router;
