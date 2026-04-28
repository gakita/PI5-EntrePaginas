/**
 * chatRoutes.js — Definição das rotas do chat.
 *
 * Todas as rotas usam o authMiddleware, o que significa que
 * o usuário PRECISA estar autenticado (ter um token JWT válido)
 * para usar o chat. Isso atende o requisito RNF05 de controle
 * de acesso e garante o isolamento de dados por usuário.
 *
 * Rotas disponíveis:
 *   POST   /chat/message  → Envia mensagem e recebe resposta da IA
 *   GET    /chat/history   → Busca histórico da última conversa
 *   DELETE /chat/history   → Limpa histórico (nova conversa)
 */

const express = require('express');

const chatController = require('../controllers/chatController');
const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();

// Todas as rotas do chat exigem autenticação
router.post('/message', authMiddleware, chatController.sendMessage);
router.get('/history', authMiddleware, chatController.getHistory);
router.delete('/history', authMiddleware, chatController.clearHistory);

module.exports = router;
