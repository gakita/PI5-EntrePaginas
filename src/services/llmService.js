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

LIVROS QUE O USUÁRIO JÁ LEU (Baseie-se nestes, mas NÃO os recomende novamente):
${readBooks.length > 0 ? readBooks.map(b => `- ${b.title} (Nota: ${b.rating}/5)` + (b.comment ? ` - Comentário: ${b.comment}` : '')).join('\n') : 'Nenhum histórico de leitura registrado.'}

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

  logger.info('Generating adaptive quiz question...', { answeredCount: answers.length });

  const prompt = `
Voce cria perguntas objetivas para um quiz de recomendacao de leitura do Entre Paginas.

PERGUNTAS JA FEITAS:
${questions.map((q, index) => `${index + 1}. ${q.text} Opcoes: ${q.options.join(', ')}`).join('\n')}

RESPOSTAS DO USUARIO:
${answers.map((item, index) => `${index + 1}. ${item.question} Resposta: ${item.answer}`).join('\n')}

Crie a proxima pergunta mais util para descobrir preferencias de leitura.
Regras:
- A pergunta deve ser em portugues brasileiro.
- A pergunta deve ser objetiva.
- Retorne de 2 a 5 opcoes curtas.
- Nao repita perguntas ja feitas.
- Nao use markdown.

Responda APENAS com JSON:
{
  "text": "Pergunta aqui",
  "options": ["Opcao 1", "Opcao 2", "Opcao 3", "Opcao 4"]
}
`;

  try {
    // Adicionando um timeout manual de 10s para a chamada da IA
    const result = await Promise.race([
      model.generateContent(prompt),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Gemini Timeout')), 10000))
    ]);

    const text = result.response.text();
    const parsed = JSON.parse(cleanJsonText(text));

    logger.info('Adaptive quiz question generated successfully');

    return {
      text: typeof parsed.text === 'string' ? parsed.text : '',
      options: safeArray(parsed.options),
    };
  } catch (error) {
    logger.error('Error generating adaptive quiz question', { error: error.message });
    throw error; // quizService ja tem o catch para fallback
  }
}

async function inferQuizPreferences(answers) {
  const model = genAI.getGenerativeModel({ model: env.geminiModel });

  const prompt = `
Com base nas respostas de um quiz de recomendacao de leitura, inferir preferencias do usuario.

RESPOSTAS:
${answers.map((item, index) => `${index + 1}. ${item.question} Resposta: ${item.answer}`).join('\n')}

Responda APENAS com JSON:
{
  "genres": ["generos ou temas inferidos"],
  "types": ["livro", "hq", "manga"],
  "favoriteAuthors": ["autores mencionados pelo usuario"]
}

Use arrays vazios quando nao houver informacao suficiente.
`;

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

  logger.info('Generating final quiz recommendations...', { userEmail: preferences?.userEmail || 'unknown' });

  const prompt = `
O usuario respondeu a um quiz de perfil de leitura.

RESPOSTAS DO QUIZ:
${answers.map((item, index) => `${index + 1}. ${item.question} Resposta: ${item.answer}`).join('\n')}

Gere ate 5 recomendacoes de livros, HQs ou mangas que combinem com essas respostas.
Inclua justificativa curta conectada ao quiz.
Marque sensitiveContent como true quando houver violencia, saude mental, suicidio ou outros temas sensiveis.

Responda APENAS com JSON:
{
  "message": "Mensagem curta para apresentar as recomendacoes",
  "recommendations": [
    {
      "title": "Titulo",
      "type": "livro",
      "author": "Autor",
      "justification": "Justificativa curta",
      "sensitiveContent": false
    }
  ]
}
`;

  try {
    const result = await Promise.race([
      model.generateContent(prompt),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Gemini Recommendation Timeout')), 15000))
    ]);

    const text = result.response.text();
    const parsed = JSON.parse(cleanJsonText(text));

    logger.info('Quiz recommendations generated successfully');

    return {
      message: parsed.message || 'Aqui estao algumas recomendacoes baseadas no seu quiz.',
      recommendations: safeArray(parsed.recommendations),
    };
  } catch (error) {
    logger.warn('Falha ao gerar recomendacoes do quiz', { error: error.message });
    return {
      message: 'Nao foi possivel gerar recomendacoes agora. Tente novamente em alguns instantes.',
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
