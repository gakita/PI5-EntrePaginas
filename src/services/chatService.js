/**
 * chatService.js — Camada de regra de negócio do chat.
 *
 * Orquestra o fluxo completo de cada funcionalidade do chat:
 *
 *   sendMessage()       → recebe mensagem, chama Gemini, enriquece, salva
 *   getHistory()        → busca conversa do banco
 *   clearHistory()      → apaga conversa
 *   closeConversation() → salva preferências inferidas e sugestões do chat
 *   getPreferences()    → retorna preferências salvas
 *   updatePreferences() → atualiza preferências manualmente
 *   clearPreferences()  → apaga/reseta preferências salvas
 */

const chatModel      = require('../models/chatModel');
const preferenceModel = require('../models/preferenceModel');
const suggestionModel = require('../models/suggestionModel');
const avaliacaoModel  = require('../models/avaliacaoModel');
const llmService     = require('./llmService');
const catalogService = require('./catalogService');
const logger         = require('../utils/logger');

/**
 * Processa uma nova mensagem e retorna a resposta da IA enriquecida.
 *
 * @param {string} userEmail
 * @param {string} userMessage
 */
async function sendMessage(userEmail, userMessage) {
  logger.info('Chat message received', { userEmail });

  // Busca preferências salvas do usuário
  const preferences = await preferenceModel.findByUserEmail(userEmail);

  // Busca os livros avaliados pelo usuário
  const readBooks = await avaliacaoModel.findReadBooksByUserEmail(userEmail);

  // Carrega o histórico de mensagens
  const existingConversation = await chatModel.findByUserEmail(userEmail);
  const messages = existingConversation ? existingConversation.messages : [];

  // Adiciona a nova mensagem do usuário
  messages.push({
    role: 'user',
    content: userMessage,
    timestamp: new Date().toISOString(),
  });

  // Gera a recomendação com o modelo de linguagem
  const aiResponse = await llmService.generateRecommendation(messages, preferences, readBooks);

  // Adiciona detalhes adicionais aos livros recomendados
  const enrichedRecs = await catalogService.enrichRecommendations(aiResponse.recommendations);

  // Adiciona a resposta do assistente ao histórico
  messages.push({
    role: 'assistant',
    content: aiResponse.message,
    recommendations: enrichedRecs,
    timestamp: new Date().toISOString(),
  });

  // Salva a conversa atualizada
  await chatModel.upsertConversation(userEmail, messages);

  logger.info('Chat message processed', {
    userEmail,
    messageCount: messages.length,
    recommendationsCount: enrichedRecs.length,
  });

  return {
    reply:           aiResponse.message,
    recommendations: enrichedRecs,
    messageCount:    messages.length,
  };
}

/**
 * Retorna o histórico da última conversa do usuário.
 */
async function getHistory(userEmail) {
  const conversation = await chatModel.findByUserEmail(userEmail);
  if (!conversation) return { messages: [] };
  return { messages: conversation.messages };
}

/**
 * Limpa o histórico do chat (inicia nova conversa).
 */
async function clearHistory(userEmail) {
  await chatModel.deleteByUserEmail(userEmail);
  logger.info('Chat history cleared', { userEmail });
}

/**
 * Encerra a conversa atual, processando as preferências e sugestões do chat.
 *
 * @param {string} userEmail
 */
async function closeConversation(userEmail) {
  logger.info('Closing conversation', { userEmail });

  const conversation = await chatModel.findByUserEmail(userEmail);

  if (!conversation || conversation.messages.length === 0) {
    return { saved: false, reason: 'Nenhuma conversa ativa.' };
  }

  // Agrupa todas as recomendações feitas pelo assistente
  const allRecommendations = conversation.messages
    .filter((m) => m.role === 'assistant' && Array.isArray(m.recommendations))
    .flatMap((m) => m.recommendations);

  // Remove duplicadas pelo título
  const seen = new Set();
  const uniqueRecs = allRecommendations.filter((r) => {
    if (!r.title || seen.has(r.title.toLowerCase())) return false;
    seen.add(r.title.toLowerCase());
    return true;
  });

  // Identifica novas preferências do usuário com base no diálogo
  const inferredPrefs = await llmService.inferPreferences(conversation.messages);

  // Atualiza as preferências no banco de dados
  const savedPrefs = await preferenceModel.upsertPreferences(userEmail, inferredPrefs);

  // Salva as sugestões recomendadas
  await suggestionModel.saveAll(userEmail, uniqueRecs);

  logger.info('Conversation closed', {
    userEmail,
    suggestionsSaved: uniqueRecs.length,
    preferencesUpdated: true,
  });

  return {
    saved: true,
    suggestionsSaved: uniqueRecs.length,
    preferencesUpdated: savedPrefs,
  };
}

/**
 * Retorna as preferências salvas do usuário.
 */
async function getPreferences(userEmail) {
  const prefs = await preferenceModel.findByUserEmail(userEmail);
  // Retorna objeto padrão se não houver preferências salvas
  return prefs || { genres: [], types: [], favoriteAuthors: [] };
}

/**
 * Retorna as sugestões salvas do chatbot, enriquecidas com dados do catálogo.
 */
async function getSuggestions(userEmail, limit = 20) {
  const suggestions = await suggestionModel.findByUserEmail(userEmail, limit);
  return catalogService.enrichRecommendations(suggestions);
}

/**
 * Atualiza as preferências manualmente (via frontend de configurações).
 */
async function updatePreferences(userEmail, preferences) {
  return preferenceModel.upsertPreferences(userEmail, preferences);
}

/**
 * Apaga as preferências salvas do usuário.
 */
async function clearPreferences(userEmail) {
  await preferenceModel.deleteByUserEmail(userEmail);
  logger.info('User preferences cleared', { userEmail });
}

module.exports = {
  sendMessage,
  getHistory,
  clearHistory,
  closeConversation,
  getPreferences,
  getSuggestions,
  updatePreferences,
  clearPreferences,
};
