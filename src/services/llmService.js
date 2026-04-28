/**
 * llmService.js — Serviço de integração com o Google Gemini (LLM).
 *
 * Responsabilidades:
 *   1. Configurar o cliente do Gemini com a API key
 *   2. Montar o prompt de sistema com preferências reais do usuário (RIA01)
 *   3. Gerar recomendações estruturadas em JSON (RIA02/RIA03)
 *   4. Inferir preferências ao encerrar uma conversa (RIA07)
 *
 * Mudanças em relação à versão anterior:
 *   - generateRecommendation() agora aceita `preferences` como parâmetro
 *   - inferPreferences() é uma nova função para o /chat/close
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');
const env = require('../config/env');
const logger = require('../utils/logger');

// ── Preferências padrão (usadas quando o usuário não tem preferências salvas) ──
const DEFAULT_PREFERENCES = {
  genres: ['ficção científica', 'fantasia', 'romance', 'terror'],
  types: ['livro', 'hq', 'mangá'],
  favoriteAuthors: [],
};

/**
 * Monta o texto do prompt de sistema com as preferências do usuário.
 * Ao separar isso em uma função, fica fácil mudar o comportamento
 * do assistente sem alterar toda a lógica de requisição.
 *
 * @param {object} preferences - Preferências do usuário.
 */
function buildSystemInstruction(preferences) {
  const prefs = preferences || DEFAULT_PREFERENCES;

  return `
Você é o assistente de recomendação de leitura do "Entre Páginas".
Seu objetivo é ajudar o usuário a descobrir livros, HQs e mangás.

REGRAS:
1. Sempre responda em português brasileiro.
2. Quando o usuário pedir recomendações, retorne no máximo 5 itens.
3. Para cada item, inclua: título, tipo (livro/hq/mangá), autor (se souber) e uma justificativa curta.
4. Se o item tiver temas sensíveis (violência, saúde mental, etc.), indique com "sensitiveContent: true".
5. Seja conversacional e amigável.
6. Priorize itens que combinam com as preferências do usuário.

PREFERÊNCIAS DO USUÁRIO:
- Gêneros favoritos: ${prefs.genres.length > 0 ? prefs.genres.join(', ') : 'não definido'}
- Tipos aceitos: ${prefs.types.length > 0 ? prefs.types.join(', ') : 'qualquer'}
- Autores favoritos: ${prefs.favoriteAuthors?.length > 0 ? prefs.favoriteAuthors.join(', ') : 'nenhum definido'}

Quando fizer recomendações, responda SEMPRE neste formato JSON (sem markdown, sem crases):
{
  "message": "Sua mensagem conversacional aqui",
  "recommendations": [
    {
      "title": "Nome do Livro",
      "type": "livro",
      "author": "Nome do Autor",
      "justification": "Por que recomendo...",
      "sensitiveContent": false
    }
  ]
}

Se a mensagem do usuário for conversa casual (saudação, dúvida geral) sem pedir recomendações:
{
  "message": "Sua resposta aqui",
  "recommendations": []
}
`;
}

// Inicializa o cliente do Gemini com a API key do .env
const genAI = new GoogleGenerativeAI(env.geminiApiKey);

/**
 * Gera uma resposta do Gemini para a conversa atual.
 *
 * @param {Array} messageHistory - Histórico de mensagens [{role, content}, ...]
 * @param {object|null} preferences - Preferências reais do usuário (ou null para usar padrão)
 * @returns {{ message: string, recommendations: Array }}
 */
async function generateRecommendation(messageHistory, preferences = null) {
  const start = Date.now();

  const model = genAI.getGenerativeModel({
    model: env.geminiModel,
    systemInstruction: buildSystemInstruction(preferences), // Usa preferências reais (RIA01)
  });

  // Converte nosso formato {role, content} para o formato do Gemini {role, parts}
  // "assistant" no nosso sistema = "model" na API do Gemini
  const geminiHistory = messageHistory.map((msg) => ({
    role: msg.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: msg.content }],
  }));

  // Separa a última mensagem (atual) do histórico anterior (contexto)
  const currentMessage = geminiHistory.pop();
  const previousMessages = geminiHistory;

  const chat = model.startChat({ history: previousMessages });

  let responseText;
  try {
    const result = await chat.sendMessage(currentMessage.parts[0].text);
    responseText = result.response.text();
  } catch (err) {
    // Se o Gemini retornar 503 (sobrecarga) ou outro erro de rede,
    // retornamos uma mensagem de fallback amigável (RNF12)
    const errStatus = err?.status || err?.statusCode || 0;
    const isServiceError = errStatus >= 500 || errStatus === 429;
    if (isServiceError) {
      logger.warn('Gemini indisponível — usando fallback', { status: errStatus, message: err?.message });
      return {
        message: 'O assistente está sobrecarregado no momento. Por favor, tente novamente em alguns segundos.',
        recommendations: [],
      };
    }
    throw err; // Outros erros (autenticação, etc.) propagam normalmente
  }

  const durationMs = Date.now() - start;
  logger.info('LLM request completed', { durationMs, model: env.geminiModel });

  // Tenta parsear JSON — se falhar, usa fallback de texto puro (MQ05 / RNF12)
  try {
    const cleaned = responseText
      .replace(/```json\s*/gi, '')
      .replace(/```\s*/gi, '')
      .trim();

    const parsed = JSON.parse(cleaned);

    return {
      message: parsed.message || responseText,
      recommendations: parsed.recommendations || [],
    };
  } catch {
    logger.warn('LLM retornou formato não-JSON — usando fallback de texto puro', {
      preview: responseText.substring(0, 100),
    });

    return { message: responseText, recommendations: [] };
  }
}

/**
 * Pede ao Gemini para inferir as preferências do usuário com base na conversa.
 * Usada ao encerrar a conversa (RF13/RIA07).
 *
 * @param {Array} messageHistory - Histórico completo da conversa.
 * @returns {{ genres: string[], types: string[], favoriteAuthors: string[] }}
 */
async function inferPreferences(messageHistory) {
  const model = genAI.getGenerativeModel({ model: env.geminiModel });

  // Formata a conversa como texto simples para o modelo analisar
  const conversationText = messageHistory
    .map((m) => `${m.role === 'user' ? 'Usuário' : 'Assistente'}: ${m.content}`)
    .join('\n');

  const prompt = `
Com base na conversa abaixo entre um usuário e um assistente de recomendação de leitura,
identifique as preferências de leitura implícitas do usuário.

Conversa:
${conversationText}

Responda APENAS com JSON (sem markdown, sem crases):
{
  "genres": ["lista de gêneros mencionados ou inferidos"],
  "types": ["livro", "hq", "mangá", "manhwa" — apenas os que o usuário demonstrou interesse],
  "favoriteAuthors": ["autores que o usuário mencionou gostar"]
}

Se não houver informação suficiente para algum campo, retorne um array vazio [].
`;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text().replace(/```json\s*/gi, '').replace(/```\s*/gi, '').trim();
    const parsed = JSON.parse(text);

    return {
      genres:          Array.isArray(parsed.genres)          ? parsed.genres          : [],
      types:           Array.isArray(parsed.types)           ? parsed.types           : [],
      favoriteAuthors: Array.isArray(parsed.favoriteAuthors) ? parsed.favoriteAuthors : [],
    };
  } catch {
    logger.warn('Falha ao inferir preferências — retornando vazio');
    return { genres: [], types: [], favoriteAuthors: [] };
  }
}

module.exports = {
  generateRecommendation,
  inferPreferences,
};
