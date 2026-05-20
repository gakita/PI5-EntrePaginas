const express = require('express');
const authMiddleware = require('../middlewares/authMiddleware');
const authController = require('../controllers/authController');

const router = express.Router();

// 🔒 TODAS as rotas aqui exigem autenticação (operações sobre dados do usuário)
router.use(authMiddleware);

// Usuário só pode deletar sua própria conta
router.delete('/me', authController.deleteMe);

// Usuário só pode ver seus próprios dados
router.get('/me', authController.me);
router.patch('/me', authController.updateMe);

module.exports = router;
