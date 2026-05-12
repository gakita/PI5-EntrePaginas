const express = require('express');

const authMiddleware = require('../middlewares/authMiddleware');
const avaliacaoController = require('../controllers/avaliacaoController');

const router = express.Router();

router.get('/', authMiddleware, avaliacaoController.getMyEvaluations);
router.post('/', authMiddleware, avaliacaoController.upsertEvaluation);

module.exports = router;
