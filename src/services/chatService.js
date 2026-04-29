/**
 * chatService.js — Camada de regra de negócio do chat.
 *
 * Orquestra o fluxo completo de cada funcionalidade do chat:
 *
 *   sendMessage()       → recebe mensagem, chama Gemini, enriquece, salva
 *   getHistory()        → busca conversa do banco
 *   clearHistory()      → apaga conversa
 *   closeConversation() → salva preferências inferidas e sugestões (RF13/RIA07)
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
 * Fluxo:
 *   1. Busca preferências reais do usuário (RIA01)
 *   2. Busca histórico da conversa
 *   3. Adiciona mensagem do usuário ao histórico
 *   4. Chama Gemini com preferências e histórico
 *   5. Enriquece recomendações com Google Books (RIA04)
 *   6. Salva histórico atualizado (com recommendations embutidas) no banco (RF12)
 *   7. Retorna resposta ao controller
 *
 * @param {string} userEmail
 * @param {string} userMessage
 */
async function sendMessage(userEmail, userMessage) {
  logger.info('Chat message received', { userEmail });

  // ── Passo 1: Preferências reais (RIA01) ──
  // Busca do banco; se ainda não existirem, o llmService usa as padrão.
  const preferences = await preferenceModel.findByUserEmail(userEmail);

  // ── Passo 1.5: Histórico de Leitura (Avaliações) ──
  const readBooks = await avaliacaoModel.findReadBooksByUserEmail(userEmail);

  // ── Passo 2: Histórico da conversa ──
  const existingConversation = await chatModel.findByUserEmail(userEmail);
  const messages = existingConversation ? existingConversation.messages : [];

  // ── Passo 3: Adicionar mensagem do usuário ──
  messages.push({
    role: 'user',
    content: userMessage,
    timestamp: new Date().toISOString(),
  });

  // ── Passo 4: Chamar o Gemini ──
  // Passamos as preferências reais e livros lidos para personalizar o prompt (RIA01)
  const aiResponse = await llmService.generateRecommendation(messages, preferences, readBooks);

  // ── Passo 5: Enriquecer com Google Books (RIA04) ──
  // Adiciona capa, sinopse e data de publicação a cada recomendação
  const enrichedRecs = await catalogService.enrichRecommendations(aiResponse.recommendations);

  // ── Passo 6: Adicionar resposta da IA ao histórico ──
  // Guardamos as recommendations junto à mensagem para usar no /close
  messages.push({
    role: 'assistant',
    content: aiResponse.message,
    recommendations: enrichedRecs, // armazenado para RF13
    timestamp: new Date().toISOString(),
  });

  // ── Passo 7: Salvar no banco (RF12 — só a última conversa) ──
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
 * Encerra a conversa atual: salva preferências inferidas e sugestões (RF13/RIA07).
 *
 * Fluxo:
 *   1. Busca a conversa atual no banco
 *   2. Coleta todas as recomendações de mensagens do assistente
 *   3. Pede ao Gemini para inferir as preferências da conversa (RIA07)
 *   4. Salva preferências no banco (mesclando com as existentes)
 *   5. Salva sugestões no banco (deduplica por título)
 *
 * @param {string} userEmail
 */
async function closeConversation(userEmail) {
  logger.info('Closing conversation', { userEmail });

  const conversation = await chatModel.findByUserEmail(userEmail);

  if (!conversation || conversation.messages.length === 0) {
    return { saved: false, reason: 'Nenhuma conversa ativa.' };
  }

  // ── Coleta todas as recomendações armazenadas nas mensagens da IA ──
  const allRecommendations = conversation.messages
    .filter((m) => m.role === 'assistant' && Array.isArray(m.recommendations))
    .flatMap((m) => m.recommendations);

  // Deduplica por título (mesmo livro pode ter sido recomendado mais de uma vez)
  const seen = new Set();
  const uniqueRecs = allRecommendations.filter((r) => {
    if (!r.title || seen.has(r.title.toLowerCase())) return false;
    seen.add(r.title.toLowerCase());
    return true;
  });

  // ── Inferir preferências com Gemini (RIA07) ──
  const inferredPrefs = await llmService.inferPreferences(conversation.messages);

  // ── Salvar preferências no banco (mescla com as existentes) ──
  const savedPrefs = await preferenceModel.upsertPreferences(userEmail, inferredPrefs);

  // ── Salvar sugestões no banco ──
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
  // Se ainda não tem preferências, retorna o padrão
  return prefs || { genres: [], types: [], favoriteAuthors: [] };
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
  updatePreferences,
  clearPreferences,
};
