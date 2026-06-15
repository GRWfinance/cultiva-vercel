const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const ctrl = require('../controllers/kudosController');

router.use(authenticate);

router.post('/', ctrl.createKudos);
router.get('/', ctrl.listKudos);
router.get('/stats', ctrl.getKudosStats);
router.post('/:id/like', ctrl.likeKudos);

module.exports = router;
