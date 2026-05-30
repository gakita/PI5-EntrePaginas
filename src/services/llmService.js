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
function buildSystemInstruction(preferences, readBooks = []) {
  const prefs = preferences || DEFAULT_PREFERENCES;
  const allowedSensitive = prefs.sensitiveThemes || [];

  const sensitiveRules = allowedSensitive.length > 0
    ? `Permitido APENAS: ${allowedSensitive.join(', ')}. Não recomende se contiver qualquer outro tema sensível. Se contiver algum tema permitido, marque "sensitiveContent": true no JSON.`
    : `Bloqueado totalmente. Não recomende nenhuma obra com conteúdo sensível (violência, abuso, morte, etc.). Defina obrigatoriamente "sensitiveContent": false no JSON.`;

  return `Você é o assistente de recomendação de leitura do "Entre Páginas".
Aja de forma direta, concisa e objetiva. Evite rodeios, saudações excessivas ou enrolações.

REGRAS:
1. Idioma: Sempre responda em português brasileiro.
2. Resposta: Direta e concisa nas suas interações e explicações.
3. Quantidade: No máximo 5 recomendações por vez.
4. Temas Sensíveis: ${sensitiveRules}
5. Histórico: Não recomende novamente obras já lidas pelo usuário.
6. Justificativa: Extremamente curta e focada no motivo exato da recomendação.

PREFERÊNCIAS DO USUÁRIO:
- Gêneros: ${prefs.genres && prefs.genres.length > 0 ? prefs.genres.join(', ') : 'Não definidos'}
- Tipos: ${prefs.types && prefs.types.length > 0 ? prefs.types.join(', ') : 'Todos'}
- Autores: ${prefs.favoriteAuthors && prefs.favoriteAuthors.length > 0 ? prefs.favoriteAuthors.join(', ') : 'Nenhum'}

HISTÓRICO DE LEITURA (Não recomende novamente):
${readBooks.length > 0 ? readBooks.map(b => `- ${b.title} (Nota: ${b.rating}/5)` + (b.comment ? ` - Comentário: ${b.comment}` : '')).join('\n') : 'Nenhum.'}

FORMATO DE RESPOSTA (Obrigatório retornar JSON puro, sem markdown, sem crases):
Se pedir recomendação:
{
  "message": "Apresentação extremamente direta das recomendações.",
  "recommendations": [
    {
      "title": "Nome da obra",
      "type": "livro" | "hq" | "mangá",
      "author": "Nome do Autor",
      "justification": "Justificativa direta (máximo 15 palavras).",
      "sensitiveContent": false
    }
  ]
}

Se for conversa casual:
{
  "message": "Resposta direta e objetiva.",
  "recommendations": []
}`;
}

function cleanJsonText(text) {
  const cleaned = text
    .replace(/```json\s*/gi, '')
    .replace(/```\s*/gi, '')
    .trim();

  // Tenta extrair o bloco JSON caso o modelo retorne texto antes/depois
  const match = cleaned.match(/\{[\s\S]*\}/);
  return match ? match[0] : cleaned;
}

function safeArray(value) {
  return Array.isArray(value) ? value : [];
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
async function generateRecommendation(messageHistory, preferences = null, readBooks = []) {
  const start = Date.now();

  const model = genAI.getGenerativeModel({
    model: env.geminiModel,
    systemInstruction: buildSystemInstruction(preferences, readBooks), // Usa preferências reais e histórico (RIA01)
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
    const cleaned = cleanJsonText(responseText);

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

  const prompt = `Analise a conversa abaixo e extraia as preferências de leitura implícitas do usuário de forma direta.

Conversa:
${conversationText}

Responda APENAS com JSON puro (sem markdown, sem crases):
{
  "genres": ["gêneros ou temas de interesse mencionados ou inferidos"],
  "types": ["livro", "hq", "mangá", "manhwa" — apenas os que demonstrou interesse],
  "favoriteAuthors": ["autores citados com interesse"]
}

Se não houver dados suficientes para um campo, retorne o array vazio [].`;

  try {
    const result = await model.generateContent(prompt);
    const text = cleanJsonText(result.response.text());
    const parsed = JSON.parse(text);

    return {
      genres:          safeArray(parsed.genres),
      types:           safeArray(parsed.types),
      favoriteAuthors: safeArray(parsed.favoriteAuthors),
    };
  } catch {
    logger.warn('Falha ao inferir preferências — retornando vazio');
    return { genres: [], types: [], favoriteAuthors: [] };
  }
}

async function generateQuizQuestion(questions, answers) {
  const model = genAI.getGenerativeModel({ model: env.geminiModel });

  const prompt = `Crie a próxima pergunta objetiva para um quiz de recomendação de leitura. Seja curto e direto.

PERGUNTAS ANTERIORES:
${questions.map((q, index) => `- ${q.text} (Opções: ${q.options.join(', ')})`).join('\n')}

RESPOSTAS DO USUÁRIO:
${answers.map((item, index) => `- ${item.question}: ${item.answer}`).join('\n')}

DIRETRIZES:
1. Pergunta: Curta, objetiva e útil para mapear o perfil. Em português brasileiro.
2. Opções: 2 a 5 alternativas curtas. Não repita perguntas passadas.
3. Formato: Retorne APENAS o JSON puro (sem markdown, sem crases).

Responda APENAS neste formato:
{
  "text": "Pergunta direta?",
  "options": ["Opção A", "Opção B", "Opção C"]
}`;

  const result = await model.generateContent(prompt);
  const parsed = JSON.parse(cleanJsonText(result.response.text()));

  return {
    text: typeof parsed.text === 'string' ? parsed.text : '',
    options: safeArray(parsed.options),
  };
}

async function inferQuizPreferences(answers) {
  const model = genAI.getGenerativeModel({ model: env.geminiModel });

  const prompt = `Infira as preferências de leitura do usuário com base no quiz de forma direta.

RESPOSTAS DO QUIZ:
${answers.map((item, index) => `- ${item.question}: ${item.answer}`).join('\n')}

Responda APENAS com JSON puro (sem markdown, sem crases):
{
  "genres": ["gêneros ou temas de interesse inferidos"],
  "types": ["livro", "hq", "mangá"],
  "favoriteAuthors": ["autores preferidos"]
}

Use arrays vazios [] onde não houver informações suficientes.`;

  try {
    const result = await model.generateContent(prompt);
    const parsed = JSON.parse(cleanJsonText(result.response.text()));

    return {
      genres: safeArray(parsed.genres),
      types: safeArray(parsed.types),
      favoriteAuthors: safeArray(parsed.favoriteAuthors),
    };
  } catch (error) {
    logger.warn('Falha ao inferir preferencias do quiz', { error: error.message });
    return { genres: [], types: [], favoriteAuthors: [] };
  }
}

async function generateQuizRecommendations(answers, preferences = null, readBooks = []) {
  const model = genAI.getGenerativeModel({
    model: env.geminiModel,
    systemInstruction: buildSystemInstruction(preferences, readBooks),
  });

  const prompt = `Gere até 5 recomendações de leitura com base no quiz de perfil do usuário.

RESPOSTAS DO QUIZ:
${answers.map((item, index) => `- ${item.question}: ${item.answer}`).join('\n')}

DIRETRIZES:
1. Obras: No máximo 5 recomendações qualificadas.
2. Justificativa: Curta, concisa e diretamente relacionada às respostas.
3. Marque "sensitiveContent": true apenas para temas sensíveis (violência, abusos, etc.).

Responda APENAS com JSON puro (sem markdown, sem crases):
{
  "message": "Apresentação extremamente direta das recomendações.",
  "recommendations": [
    {
      "title": "Título da obra",
      "type": "livro" | "hq" | "mangá",
      "author": "Nome do Autor",
      "justification": "Justificativa curta e objetiva.",
      "sensitiveContent": false
    }
  ]
}`;

  try {
    const result = await model.generateContent(prompt);
    const parsed = JSON.parse(cleanJsonText(result.response.text()));

    return {
      message: parsed.message || 'Aqui estão algumas recomendações baseadas no seu quiz.',
      recommendations: safeArray(parsed.recommendations),
    };
  } catch (error) {
    logger.warn('Falha ao gerar recomendacoes do quiz', { error: error.message });
    return {
      message: 'Não foi possível gerar recomendações agora. Tente novamente em alguns instantes.',
      recommendations: [],
    };
  }
}

module.exports = {
  generateRecommendation,
  generateQuizQuestion,
  generateQuizRecommendations,
  inferPreferences,
  inferQuizPreferences,
};
