const express = require('express');
const rateLimit = require('express-rate-limit');

const authController = require('../controllers/authController');
const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();

// 🔒 Rate limiters específicos para rotas de autenticação
// Limite de login: 5 tentativas por 15 minutos por IP
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Muitas tentativas de login. Tente novamente em 15 minutos.',
  skipSuccessfulRequests: true, // Não conta tentativas bem-sucedidas
  standardHeaders: true,
  legacyHeaders: false,
});

// Limite de registro: 3 por 30 minutos por IP
const registerLimiter = rateLimit({
  windowMs: 30 * 60 * 1000,
  max: 3,
  message: 'Muitos registros deste IP. Tente novamente mais tarde.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Limite de recuperação de senha: 3 por hora
const forgotPasswordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  message: 'Muitas requisições de recuperação de senha. Tente novamente em 1 hora.',
  standardHeaders: true,
  legacyHeaders: false,
});

router.post('/register', registerLimiter, authController.register);
router.post('/login', loginLimiter, authController.login);
router.post('/forgot-password', forgotPasswordLimiter, authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);
router.get('/me', authMiddleware, authController.me);
router.patch('/me', authMiddleware, authController.updateMe);
router.delete('/me', authMiddleware, authController.deleteMe);

module.exports = router;
