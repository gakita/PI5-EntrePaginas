const express = require('express');

const authController = require('../controllers/authController');
const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);
router.get('/me', authMiddleware, authController.me);
router.patch('/me', authMiddleware, authController.updateMe);
router.delete('/me', authMiddleware, authController.deleteMe);

module.exports = router;
