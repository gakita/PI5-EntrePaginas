const express = require('express');
const rateLimit = require('express-rate-limit');

const quizController = require('../controllers/quizController');
const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();

// 🔒 Rate limiter por usuário para quiz (10 quiz por hora)
const quizLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  keyGenerator: (req) => req.user?.id || req.ip,
  message: 'Limite de quiz atingido. Tente novamente em 1 hora.',
  standardHeaders: true,
  legacyHeaders: false,
});

router.post('/start', authMiddleware, quizLimiter, quizController.startQuiz);
router.post('/answer', authMiddleware, quizController.answerQuestion);
router.post('/finish', authMiddleware, quizController.finishQuiz);

module.exports = router;
