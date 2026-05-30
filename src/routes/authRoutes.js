const express = require('express');

const authController = require('../controllers/authController');
const authMiddleware = require('../middlewares/authMiddleware');
const { authRateLimiter } = require('../middlewares/security');

const router = express.Router();

router.post('/register', authRateLimiter, authController.register);
router.post('/login', authRateLimiter, authController.login);
router.post('/forgot-password', authRateLimiter, authController.forgotPassword);
router.post('/reset-password', authRateLimiter, authController.resetPassword);
router.post('/send-code', authRateLimiter, authController.sendCode);
router.post('/verify-code', authRateLimiter, authController.verifyCode);
router.get('/me', authMiddleware, authController.me);
router.patch('/me', authMiddleware, authController.updateMe);
router.delete('/me', authMiddleware, authController.deleteMe);

module.exports = router;
