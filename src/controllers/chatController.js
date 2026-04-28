/**
 * chatController.js — Camada de controle (Controller) do chat.
 *
 * O Controller é responsável por:
 *   1. Receber a requisição HTTP (req)
 *   2. Validar os dados de entrada (body, params, etc.)
 *   3. Chamar o Service para processar a lógica de negócio
 *   4. Retornar a resposta HTTP (res) com o resultado
 *
 * Ele NÃO deve conter lógica de negócio nem acessar o banco
 * diretamente — isso é responsabilidade do Service e do Model.
 *
 * Todas as rotas deste controller exigem autenticação (JWT).
 * O middleware authMiddleware já decodifica o token e coloca
 * os dados do usuário em req.user (email, id).
 */

const chatService = require('../services/chatService');

/**
 * POST /chat/message
 *
 * Recebe uma mensagem do usuário e retorna a resposta da IA.
 *
 * Body esperado: { "message": "texto da mensagem do usuário" }
 * Resposta: { reply, recommendations, messageCount }
 */
async function sendMessage(req, res, next) {
  try {
    const { message } = req.body;

    // Validação: a mensagem é obrigatória
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return res.status(400).json({
        message: 'O campo "message" e obrigatorio e deve ser um texto.',
      });
    }

    // req.user.email vem do authMiddleware (decodificado do token JWT)
    const userEmail = req.user.email;

    // Chama o service que orquestra todo o fluxo
    const result = await chatService.sendMessage(userEmail, message.trim());

    return res.status(200).json(result);
  } catch (error) {
    // Passa o erro para o errorHandler middleware (tratamento centralizado)
    return next(error);
  }
}

/**
 * GET /chat/history
 *
 * Retorna o histórico da última conversa do usuário.
 * Se não houver conversa, retorna { messages: [] }.
 */
async function getHistory(req, res, next) {
  try {
    const userEmail = req.user.email;

    const result = await chatService.getHistory(userEmail);

    return res.status(200).json(result);
  } catch (error) {
    return next(error);
  }
}

/**
 * DELETE /chat/history
 *
 * Limpa o histórico do chat do usuário.
 * Após isso, a próxima mensagem inicia uma conversa nova.
 */
async function clearHistory(req, res, next) {
  try {
    const userEmail = req.user.email;

    await chatService.clearHistory(userEmail);

    return res.status(200).json({
      message: 'Historico do chat limpo com sucesso.',
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  sendMessage,
  getHistory,
  clearHistory,
};
