/**
 * chatController.js — Camada de controle (Controller) do chat.
 *
 * Handlers HTTP para os endpoints do chat. Cada função:
 *   1. Valida a entrada (req.body / req.params)
 *   2. Chama o chatService para a lógica de negócio
 *   3. Retorna resposta HTTP padronizada
 *
 * Novos endpoints em relação à versão anterior:
 *   - closeConversation (POST /chat/close)
 *   - getPreferences    (GET /chat/preferences)
 *   - updatePreferences (PUT /chat/preferences)
 *   - clearPreferences  (DELETE /chat/preferences)
 */

const chatService = require('../services/chatService');

/**
 * POST /chat/message
 * Envia mensagem e recebe resposta da IA enriquecida.
 */
async function sendMessage(req, res, next) {
  try {
    const { message } = req.body;

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return res.status(400).json({
        message: 'O campo "message" e obrigatorio e deve ser um texto.',
      });
    }

    const result = await chatService.sendMessage(req.user.email, message.trim());

    return res.status(200).json(result);
  } catch (error) {
    return next(error);
  }
}

/**
 * GET /chat/history
 * Retorna o histórico da última conversa.
 */
async function getHistory(req, res, next) {
  try {
    const result = await chatService.getHistory(req.user.email);
    return res.status(200).json(result);
  } catch (error) {
    return next(error);
  }
}

/**
 * DELETE /chat/history
 * Limpa o histórico do chat.
 */
async function clearHistory(req, res, next) {
  try {
    await chatService.clearHistory(req.user.email);
    return res.status(200).json({ message: 'Historico do chat limpo com sucesso.' });
  } catch (error) {
    return next(error);
  }
}

/**
 * POST /chat/close
 * Encerra a conversa atual:
 *   - Inferir preferências da conversa com Gemini
 *   - Salvar preferências atualizadas no banco
 *   - Salvar sugestões da conversa no banco
 *
 * Atende RF13 e RIA07.
 */
async function closeConversation(req, res, next) {
  try {
    const result = await chatService.closeConversation(req.user.email);

    if (!result.saved) {
      return res.status(200).json({ message: result.reason });
    }

    return res.status(200).json({
      message: 'Conversa encerrada e dados salvos com sucesso.',
      suggestionsSaved:   result.suggestionsSaved,
      preferencesUpdated: result.preferencesUpdated,
    });
  } catch (error) {
    return next(error);
  }
}

/**
 * GET /chat/preferences
 * Retorna as preferências de leitura do usuário.
 */
async function getPreferences(req, res, next) {
  try {
    const prefs = await chatService.getPreferences(req.user.email);
    return res.status(200).json(prefs);
  } catch (error) {
    return next(error);
  }
}

/**
 * PUT /chat/preferences
 * Atualiza as preferências manualmente.
 *
 * Body: { genres: [...], types: [...], favoriteAuthors: [...] }
 */
async function updatePreferences(req, res, next) {
  try {
    const { genres, types, favoriteAuthors } = req.body;

    // Valida que os campos são arrays (quando fornecidos)
    for (const [key, val] of Object.entries({ genres, types, favoriteAuthors })) {
      if (val !== undefined && !Array.isArray(val)) {
        return res.status(400).json({
          message: `O campo "${key}" deve ser um array.`,
        });
      }
    }

    const updated = await chatService.updatePreferences(req.user.email, {
      genres:          genres          || [],
      types:           types           || [],
      favoriteAuthors: favoriteAuthors || [],
    });

    return res.status(200).json({
      message: 'Preferencias atualizadas com sucesso.',
      preferences: updated,
    });
  } catch (error) {
    return next(error);
  }
}

/**
 * DELETE /chat/preferences
 * Apaga/reseta as preferências de leitura do usuário.
 */
async function clearPreferences(req, res, next) {
  try {
    await chatService.clearPreferences(req.user.email);

    return res.status(200).json({
      message: 'Preferencias resetadas com sucesso.',
      preferences: {
        genres: [],
        types: [],
        favoriteAuthors: [],
      },
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  sendMessage,
  getHistory,
  clearHistory,
  closeConversation,
  getPreferences,
  updatePreferences,
  clearPreferences,
};
