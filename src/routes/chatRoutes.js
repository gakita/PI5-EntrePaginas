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
 *   PUT    /chat/preferences    → Atualiza preferências manualmente
 *   DELETE /chat/preferences    → Apaga/reseta preferências
 */

const express = require('express');
const rateLimit = require('express-rate-limit');

const chatController = require('../controllers/chatController');
const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();

// 🔒 Rate limiter por usuário autenticado (por user.id)
// 30 mensagens por hora para evitar spam na IA
const chatLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 30, // 30 mensagens
  keyGenerator: (req) => {
    // Usa o ID do usuário autenticado, não o IP
    return req.user?.id || req.ip;
  },
  message: 'Limite de mensagens atingido. Você pode enviar até 30 mensagens por hora.',
  standardHeaders: true,
  legacyHeaders: false,
});

// ── Conversa ──
router.post('/message',     authMiddleware, chatLimiter, chatController.sendMessage);
router.get('/history',      authMiddleware, chatController.getHistory);
router.delete('/history',   authMiddleware, chatController.clearHistory);
router.post('/close',       authMiddleware, chatController.closeConversation);

// ── Preferências ──
router.get('/preferences',  authMiddleware, chatController.getPreferences);
router.put('/preferences',  authMiddleware, chatController.updatePreferences);
router.delete('/preferences', authMiddleware, chatController.clearPreferences);

module.exports = router;
