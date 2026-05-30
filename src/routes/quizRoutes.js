const express = require('express');

const quizController = require('../controllers/quizController');
const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();

router.post('/start', authMiddleware, quizController.startQuiz);
router.post('/answer', authMiddleware, quizController.answerQuestion);
router.post('/regenerate', authMiddleware, quizController.regenerateQuestion);
router.post('/finish', authMiddleware, quizController.finishQuiz);

module.exports = router;
