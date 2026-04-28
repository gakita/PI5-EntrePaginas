/**
 * chatService.js — Camada de regra de negócio (Service) do chat.
 *
 * Este serviço orquestra o fluxo completo de uma mensagem:
 *   1. Busca a conversa existente no banco (se houver)
 *   2. Adiciona a mensagem do usuário ao histórico
 *   3. Chama o Gemini (via llmService) para gerar a resposta
 *   4. Adiciona a resposta da IA ao histórico
 *   5. Salva o histórico atualizado no banco (upsert)
 *   6. Retorna a resposta para o controller
 *
 * A separação em camadas (Controller → Service → Model) é um
 * padrão de arquitetura que facilita manutenção e testes:
 *   - Controller: lida com HTTP (req/res)
 *   - Service: lida com regras de negócio
 *   - Model: lida com o banco de dados
 */

const chatModel = require('../models/chatModel');
const llmService = require('./llmService');

/**
 * Processa uma nova mensagem do usuário e retorna a resposta da IA.
 *
 * @param {string} userEmail - Email do usuário autenticado (vem do token JWT).
 * @param {string} userMessage - Texto da mensagem enviada pelo usuário.
 * @returns {object} Objeto com { reply, recommendations, messageCount }
 */
async function sendMessage(userEmail, userMessage) {
  // ── PASSO 1: Buscar conversa existente ──
  // Se o usuário já conversou antes, buscamos o histórico
  // para manter o contexto (RIA01: contexto mínimo).
  const existingConversation = await chatModel.findByUserEmail(userEmail);

  // Se existe conversa, usa as mensagens dela; senão, começa com array vazio
  const messages = existingConversation ? existingConversation.messages : [];

  // ── PASSO 2: Adicionar mensagem do usuário ao histórico ──
  messages.push({
    role: 'user',
    content: userMessage,
    timestamp: new Date().toISOString(),
  });

  // ── PASSO 3: Chamar o Gemini ──
  // Passamos todo o histórico para que o modelo tenha contexto
  // das mensagens anteriores da conversa.
  const aiResponse = await llmService.generateRecommendation(messages);

  // ── PASSO 4: Adicionar resposta da IA ao histórico ──
  messages.push({
    role: 'assistant',
    content: aiResponse.message,
    timestamp: new Date().toISOString(),
  });

  // ── PASSO 5: Salvar no banco (upsert) ──
  // O upsert garante que:
  //   - Se não existe conversa → cria uma nova (INSERT)
  //   - Se já existe → atualiza com o histórico completo (UPDATE)
  // Isso atende o RF12: "salvar somente a última conversa"
  await chatModel.upsertConversation(userEmail, messages);

  // ── PASSO 6: Retornar resposta ──
  return {
    reply: aiResponse.message,
    recommendations: aiResponse.recommendations,
    messageCount: messages.length,
  };
}

/**
 * Retorna o histórico da última conversa do usuário.
 *
 * @param {string} userEmail - Email do usuário autenticado.
 * @returns {object} Objeto com { messages }
 */
async function getHistory(userEmail) {
  const conversation = await chatModel.findByUserEmail(userEmail);

  // Se não existe conversa, retorna array vazio
  if (!conversation) {
    return { messages: [] };
  }

  return { messages: conversation.messages };
}

/**
 * Limpa o histórico do chat (inicia nova conversa).
 * A próxima mensagem do usuário criará uma conversa nova.
 *
 * @param {string} userEmail - Email do usuário autenticado.
 */
async function clearHistory(userEmail) {
  await chatModel.deleteByUserEmail(userEmail);
}

module.exports = {
  sendMessage,
  getHistory,
  clearHistory,
};
