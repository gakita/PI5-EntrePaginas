/**
 * llmService.js — Serviço de integração com o Google Gemini (LLM).
 *
 * Este serviço é responsável por:
 *   1. Configurar o cliente do Gemini com a API key
 *   2. Montar o prompt de sistema (system instruction) que diz ao
 *      modelo como ele deve se comportar
 *   3. Enviar as mensagens do chat e receber a resposta
 *
 * Requisitos atendidos:
 *   - RIA01: Envia contexto mínimo (preferências + filtros + histórico)
 *   - RIA02: Pede resposta em JSON estruturado
 *   - RIA03: Pede justificativa curta por recomendação
 *   - RIA05: Pede que o modelo indique temas sensíveis
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');
const env = require('../config/env');

// ── Preferências Simuladas ──────────────────────────────────
// No MVP mínimo, as preferências são hardcoded.
// Quando a feature de preferências do usuário for implementada,
// basta trocar este objeto por dados vindos do banco.
const SIMULATED_PREFERENCES = {
  genres: ['ficção científica', 'fantasia', 'romance', 'terror'],
  types: ['livro', 'hq', 'mangá'],
  favoriteAuthors: [],
};

// ── Prompt de Sistema ───────────────────────────────────────
// O system instruction é enviado UMA VEZ ao modelo e define
// como ele deve se comportar durante toda a conversa.
// Ele NÃO aparece nas mensagens visíveis do chat.
const SYSTEM_INSTRUCTION = `
Você é o assistente de recomendação de leitura do "Entre Páginas".
Seu objetivo é ajudar o usuário a descobrir livros, HQs e mangás.

REGRAS:
1. Sempre responda em português brasileiro.
2. Quando o usuário pedir recomendações, retorne no máximo 5 itens.
3. Para cada item, inclua: título, tipo (livro/hq/mangá), autor (se souber) e uma justificativa curta.
4. Se o item tiver temas sensíveis (violência, saúde mental, etc.), indique com "temaSensivel: true".
5. Seja conversacional e amigável — não precisa ser formal.
6. Considere as preferências do usuário ao recomendar.

PREFERÊNCIAS DO USUÁRIO:
- Gêneros favoritos: ${SIMULATED_PREFERENCES.genres.join(', ')}
- Tipos aceitos: ${SIMULATED_PREFERENCES.types.join(', ')}
- Autores favoritos: ${SIMULATED_PREFERENCES.favoriteAuthors.length > 0 ? SIMULATED_PREFERENCES.favoriteAuthors.join(', ') : 'nenhum definido'}

Quando fizer recomendações, responda SEMPRE neste formato JSON (sem markdown, sem crases):
{
  "message": "Sua mensagem conversacional aqui",
  "recommendations": [
    {
      "title": "Nome do Livro",
      "type": "livro",
      "author": "Nome do Autor",
      "justification": "Por que recomendo este livro...",
      "sensitiveContent": false
    }
  ]
}

Se a mensagem do usuário for uma conversa casual (saudação, dúvida geral, etc.)
e NÃO pedir recomendações, responda apenas com:
{
  "message": "Sua resposta aqui",
  "recommendations": []
}
`;

/**
 * Inicializa o cliente do Gemini.
 *
 * O GoogleGenerativeAI é a classe principal do SDK.
 * Passamos a API key para autenticar nossas requisições.
 */
const genAI = new GoogleGenerativeAI(env.geminiApiKey);

/**
 * Gera uma resposta do Gemini para a conversa atual.
 *
 * @param {Array} messageHistory - Histórico de mensagens: [{role, content}, ...]
 *   - role: "user" ou "assistant" (do nosso lado)
 *   - O Gemini usa "user" e "model" como roles, então convertemos.
 *
 * @returns {object} Objeto com { message, recommendations }
 */
async function generateRecommendation(messageHistory) {
  // Obtém o modelo configurado (ex: "gemini-2.5-flash-lite")
  // O systemInstruction é passado aqui e define o comportamento do assistente
  const model = genAI.getGenerativeModel({
    model: env.geminiModel,
    systemInstruction: SYSTEM_INSTRUCTION,
  });

  // ── Converter nosso formato de mensagens para o formato do Gemini ──
  // Nosso formato: { role: "user" | "assistant", content: "..." }
  // Formato Gemini: { role: "user" | "model",   parts: [{ text: "..." }] }
  const geminiHistory = messageHistory.map((msg) => ({
    role: msg.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: msg.content }],
  }));

  // Separamos a última mensagem (que é a do usuário) do histórico anterior.
  // O método sendMessage do Gemini espera:
  //   - history: todas as mensagens anteriores (contexto)
  //   - a mensagem atual é passada como argumento do sendMessage
  const currentMessage = geminiHistory.pop();
  const previousMessages = geminiHistory;

  // Inicia um chat com o histórico anterior
  const chat = model.startChat({
    history: previousMessages,
  });

  // Envia a mensagem atual e aguarda a resposta
  const result = await chat.sendMessage(currentMessage.parts[0].text);
  const responseText = result.response.text();

  // ── Tentar parsear o JSON da resposta ──
  // O modelo foi instruído a responder em JSON, mas nem sempre
  // ele segue perfeitamente. Por isso, tentamos parsear e, se
  // falhar, criamos um fallback com o texto puro.
  try {
    // Remove possíveis crases de markdown (```json ... ```)
    const cleanedText = responseText
      .replace(/```json\s*/gi, '')
      .replace(/```\s*/gi, '')
      .trim();

    const parsed = JSON.parse(cleanedText);

    return {
      message: parsed.message || responseText,
      recommendations: parsed.recommendations || [],
    };
  } catch {
    // Fallback: se o JSON não parseou, retorna o texto puro como mensagem
    // Isso atende o requisito RNF12 (tolerância a falhas) e MQ05 (fallback)
    console.warn('LLM não retornou JSON válido. Usando fallback de texto puro.');

    return {
      message: responseText,
      recommendations: [],
    };
  }
}

module.exports = {
  generateRecommendation,
};
