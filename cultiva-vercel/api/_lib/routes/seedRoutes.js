const express = require('express');
const router = express.Router();
const { runSeed } = require('../controllers/seedController');

// POST /api/seed - popula o banco com dados de demonstração (protegido por SEED_SECRET)
router.post('/', runSeed);

module.exports = router;
