const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const ctrl = require('../controllers/oneOnOneController');

router.use(authenticate);

// 1:1s
router.post('/', ctrl.createOneOnOne);
router.get('/', ctrl.listOneOnOnes);
router.get('/my-action-items', ctrl.listMyActionItems);
router.get('/:id', ctrl.getOneOnOne);
router.patch('/:id/status', ctrl.updateOneOnOneStatus);

// Pauta (topics)
router.post('/:id/topics', ctrl.addTopic);

// Notas
router.post('/:id/notes', ctrl.addNote);

// Action items
router.post('/:id/action-items', ctrl.createActionItem);
router.post('/action-items/standalone', ctrl.createActionItem); // sem 1:1 vinculado
router.patch('/action-items/:itemId/status', ctrl.updateActionItemStatus);

module.exports = router;
