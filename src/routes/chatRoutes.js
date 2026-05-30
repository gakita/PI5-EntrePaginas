/**
 * chatRoutes.js — Definição de todas as rotas do chat.
 *
 * Todas as rotas exigem autenticação JWT (authMiddleware).
 *
 * Rotas disponíveis:
 *   POST   /chat/message        → Envia mensagem, recebe resposta da IA enriquecida
 *   GET    /chat/history        → Busca histórico da última conversa
 *   DELETE /chat/history        → Limpa histórico (inicia nova conversa)
 *   POST   /chat/close          → Encerra conversa (salva preferências + sugestões)
 *   GET    /chat/preferences    → Retorna preferências de leitura do usuário
 *   GET    /chat/suggestions    → Retorna sugestões salvas pelo chatbot
 *   PUT    /chat/preferences    → Atualiza preferências manualmente
 *   DELETE /chat/preferences    → Apaga/reseta preferências
 */

const express = require('express');

const chatController = require('../controllers/chatController');
const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();

// ── Conversa ──
router.post('/message',     authMiddleware, chatController.sendMessage);
router.get('/history',      authMiddleware, chatController.getHistory);
router.delete('/history',   authMiddleware, chatController.clearHistory);
router.post('/close',       authMiddleware, chatController.closeConversation);

// ── Preferências ──
router.get('/preferences',  authMiddleware, chatController.getPreferences);
router.get('/suggestions',  authMiddleware, chatController.getSuggestions);
router.put('/preferences',  authMiddleware, chatController.updatePreferences);
router.delete('/preferences', authMiddleware, chatController.clearPreferences);

module.exports = router;
