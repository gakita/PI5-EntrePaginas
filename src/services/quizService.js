const { randomUUID } = require('node:crypto');

const avaliacaoModel = require('../models/avaliacaoModel');
const catalogService = require('./catalogService');
const llmService = require('./llmService');
const preferenceModel = require('../models/preferenceModel');
const quizModel = require('../models/quizModel');
const suggestionModel = require('../models/suggestionModel');
const logger = require('../utils/logger');

const MAX_QUESTIONS = 8;
const MIN_ANSWERS_TO_FINISH = 3;

const GENERIC_QUESTIONS = [
  {
    id: 'reading_mood',
    text: 'Que tipo de experiência você procura?',
    options: ['Leve', 'Emocionante', 'Sombria', 'Reflexiva'],
  },
  {
    id: 'favorite_theme',
    text: 'Qual tema chama mais sua atenção hoje?',
    options: ['Fantasia', 'Mistério', 'Romance', 'Ficção científica'],
  },
];

const FALLBACK_AI_QUESTIONS = [
  {
    text: 'Você prefere uma história mais focada em personagens ou em acontecimentos?',
    options: ['Personagens', 'Acontecimentos', 'Equilibrada', 'Não tenho preferência'],
  },
  {
    text: 'Qual ritmo combina mais com o que você quer ler?',
    options: ['Rápido', 'Médio', 'Lento e contemplativo', 'Tanto faz'],
  },
  {
    text: 'Você quer evitar temas sensíveis nessa recomendação?',
    options: ['Sim', 'Não', 'Depende do tema', 'Prefiro avisos antes'],
  },
  {
    text: 'Que nível de complexidade você quer agora?',
    options: ['Simples', 'Moderado', 'Complexo', 'Tanto faz'],
  },
  {
    text: 'Você prefere obras populares ou descobertas menos óbvias?',
    options: ['Populares', 'Menos óbvias', 'Misturar as duas', 'Tanto faz'],
  },
];

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function nowIso() {
  return new Date().toISOString();
}

function createInitialSession(userEmail) {
  return {
    sessionId: randomUUID(),
    userEmail,
    maxQuestions: MAX_QUESTIONS,
    questions: clone(GENERIC_QUESTIONS),
    answers: [],
    finished: false,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };
}

function findQuestion(session, questionId) {
  return session.questions.find((question) => question.id === questionId);
}

function isComplete(session) {
  return session.answers.length >= MAX_QUESTIONS;
}

function canFinish(session) {
  return session.answers.length >= MIN_ANSWERS_TO_FINISH;
}

function createHttpError(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function recordAnswer(session, { questionId, answer }) {
  if (session.finished) {
    throw createHttpError('Quiz já finalizado.', 409);
  }

  if (isComplete(session)) {
    throw createHttpError('O quiz atingiu o limite de 8 perguntas.', 409);
  }

  const question = findQuestion(session, questionId);
  if (!question) {
    throw createHttpError('Pergunta não encontrada nesta sessão de quiz.', 400);
  }

  const normalizedAnswer = typeof answer === 'string' ? answer.trim() : answer;
  if (!normalizedAnswer || typeof normalizedAnswer !== 'string') {
    throw createHttpError('A resposta deve ser um texto não vazio.', 400);
  }

  const nextSession = clone(session);
  const existingAnswerIndex = nextSession.answers.findIndex((item) => item.questionId === questionId);
  const answerEntry = {
    questionId,
    answer: normalizedAnswer,
    answeredAt: nowIso(),
  };

  if (existingAnswerIndex >= 0) {
    nextSession.answers[existingAnswerIndex] = answerEntry;
  } else {
    nextSession.answers.push(answerEntry);
  }

  nextSession.updatedAt = nowIso();
  return nextSession;
}

function fallbackQuestion(questionNumber) {
  const fallback = FALLBACK_AI_QUESTIONS[(questionNumber - 4) % FALLBACK_AI_QUESTIONS.length];
  return {
    id: `ai_${questionNumber}`,
    text: fallback.text,
    options: fallback.options,
  };
}

function normalizeAiQuestion(question, questionNumber) {
  const text = typeof question?.text === 'string' ? question.text.trim() : '';
  const options = Array.isArray(question?.options)
    ? question.options.map((option) => String(option).trim()).filter(Boolean)
    : [];

  if (!text || options.length < 2) {
    return fallbackQuestion(questionNumber);
  }

  return {
    id: `ai_${questionNumber}`,
    text,
    options: options.slice(0, 5),
  };
}

function buildQuestionAnswerPairs(session) {
  return session.answers.map((answer) => ({
    question: findQuestion(session, answer.questionId)?.text || answer.questionId,
    questionId: answer.questionId,
    answer: answer.answer,
  }));
}

async function startQuiz(userEmail) {
  const session = createInitialSession(userEmail);
  await quizModel.upsertActiveSession(userEmail, session);

  logger.info('Quiz started', { userEmail, sessionId: session.sessionId });

  return {
    sessionId: session.sessionId,
    maxQuestions: MAX_QUESTIONS,
    questions: session.questions,
    questionNumber: 1,
    canFinish: false,
  };
}

async function answerQuestion(userEmail, { sessionId, questionId, answer }) {
  const existing = await quizModel.findActiveBySessionId(userEmail, sessionId);
  if (!existing) {
    throw createHttpError('Sessão de quiz não encontrada.', 404);
  }

  let session = recordAnswer(existing, { questionId, answer });
  let nextQuestion = null;

  if (!isComplete(session)) {
    const nextQuestionNumber = session.answers.length + 1;

    if (nextQuestionNumber > session.questions.length) {
      try {
        const generated = await llmService.generateQuizQuestion(
          session.questions,
          buildQuestionAnswerPairs(session)
        );
        nextQuestion = normalizeAiQuestion(generated, nextQuestionNumber);
      } catch (error) {
        logger.warn('Falha ao gerar pergunta adaptativa do quiz', {
          userEmail,
          sessionId,
          error: error.message,
        });
        nextQuestion = fallbackQuestion(nextQuestionNumber);
      }

      session.questions.push(nextQuestion);
    } else {
      nextQuestion = session.questions[nextQuestionNumber - 1];
    }
  }

  await quizModel.upsertActiveSession(userEmail, session);

  return {
    sessionId: session.sessionId,
    answeredCount: session.answers.length,
    maxQuestions: MAX_QUESTIONS,
    question: nextQuestion,
    canFinish: canFinish(session),
    isComplete: isComplete(session),
  };
}

async function regenerateCurrentQuestion(userEmail, sessionId) {
  const session = await quizModel.findActiveBySessionId(userEmail, sessionId);
  if (!session) {
    throw createHttpError('Sessão de quiz não encontrada.', 404);
  }

  if (session.finished) {
    throw createHttpError('Quiz já finalizado.', 409);
  }

  if (isComplete(session)) {
    throw createHttpError('O quiz atingiu o limite de 8 perguntas.', 409);
  }

  const currentIndex = session.answers.length;

  if (currentIndex < GENERIC_QUESTIONS.length) {
    throw createHttpError('Apenas perguntas geradas pela IA podem ser regeradas.', 400);
  }

  const currentQuestionNumber = currentIndex + 1;
  let newQuestion;

  try {
    const generated = await llmService.generateQuizQuestion(
      session.questions.slice(0, currentIndex),
      buildQuestionAnswerPairs(session)
    );
    newQuestion = normalizeAiQuestion(generated, currentQuestionNumber);
  } catch (error) {
    logger.warn('Falha ao regerar pergunta adaptativa do quiz', {
      userEmail,
      sessionId,
      error: error.message,
    });
    newQuestion = fallbackQuestion(currentQuestionNumber);
  }

  const nextSession = clone(session);
  nextSession.questions[currentIndex] = newQuestion;
  nextSession.updatedAt = nowIso();

  await quizModel.upsertActiveSession(userEmail, nextSession);

  return {
    sessionId: nextSession.sessionId,
    answeredCount: nextSession.answers.length,
    maxQuestions: MAX_QUESTIONS,
    question: newQuestion,
    canFinish: canFinish(nextSession),
    isComplete: isComplete(nextSession),
  };
}

async function finishQuiz(userEmail, { sessionId, savePreferences = false }) {
  const session = await quizModel.findActiveBySessionId(userEmail, sessionId);
  if (!session) {
    throw createHttpError('Sessão de quiz não encontrada.', 404);
  }

  if (session.finished) {
    throw createHttpError('Quiz já finalizado.', 409);
  }

  if (!canFinish(session)) {
    throw createHttpError('Responda pelo menos 3 perguntas antes de finalizar o quiz.', 400);
  }

  const qaPairs = buildQuestionAnswerPairs(session);
  const existingPreferences = await preferenceModel.findByUserEmail(userEmail);
  const readBooks = await avaliacaoModel.findReadBooksByUserEmail(userEmail);
  const inferredPreferences = await llmService.inferQuizPreferences(qaPairs);

  const preferences = {
    genres: Array.isArray(inferredPreferences?.genres) ? inferredPreferences.genres : [],
    types: Array.isArray(inferredPreferences?.types) ? inferredPreferences.types : [],
    favoriteAuthors: Array.isArray(inferredPreferences?.favoriteAuthors)
      ? inferredPreferences.favoriteAuthors
      : [],
  };

  let savedPreferences = null;
  if (savePreferences) {
    savedPreferences = await preferenceModel.upsertPreferences(userEmail, preferences);
  }

  const recommendationPreferences = {
    genres: [
      ...new Set([...(existingPreferences?.genres || []), ...preferences.genres]),
    ],
    types: [
      ...new Set([...(existingPreferences?.types || []), ...preferences.types]),
    ],
    favoriteAuthors: [
      ...new Set([...(existingPreferences?.favoriteAuthors || []), ...preferences.favoriteAuthors]),
    ],
  };

  const aiResponse = await llmService.generateQuizRecommendations(
    qaPairs,
    savedPreferences || recommendationPreferences,
    readBooks
  );
  const enrichedRecommendations = await catalogService.enrichRecommendations(aiResponse.recommendations);

  if (savePreferences) {
    await suggestionModel.saveAll(userEmail, enrichedRecommendations);
  }

  const finishedSession = {
    ...session,
    finished: true,
    updatedAt: nowIso(),
  };
  await quizModel.upsertActiveSession(userEmail, finishedSession);

  logger.info('Quiz finished', {
    userEmail,
    sessionId,
    recommendationsCount: enrichedRecommendations.length,
    preferencesSaved: Boolean(savePreferences),
  });

  return {
    message: aiResponse.message,
    preferences: savedPreferences || preferences,
    recommendations: enrichedRecommendations,
    preferencesSaved: Boolean(savePreferences),
  };
}

module.exports = {
  startQuiz,
  answerQuestion,
  regenerateCurrentQuestion,
  finishQuiz,
  _test: {
    canFinish,
    createInitialSession,
    isComplete,
    normalizeAiQuestion,
    recordAnswer,
  },
};
