#!/usr/bin/env node

/**
 * Testes HTTP abrangentes do quiz adaptativo.
 *
 * Pre-requisitos:
 *   1. npm run db:quiz
 *   2. npm run dev
 *
 * Uso:
 *   npm run test:quiz -- --email=admin@example.com --password=123456
 */

const DEFAULT_BASE_URL = 'http://localhost:3000';

function getArg(flag) {
  const arg = process.argv.find((item) => item.startsWith(`${flag}=`));
  return arg ? arg.split('=').slice(1).join('=') : null;
}

const BASE_URL = getArg('--base-url') || process.env.BASE_URL || DEFAULT_BASE_URL;
const EMAIL = getArg('--email') || process.env.TEST_EMAIL || 'admin@example.com';
const PASSWORD = getArg('--password') || process.env.TEST_PASSWORD || '123456';

const state = {
  passed: 0,
  failed: 0,
  token: null,
};

async function request(method, path, body = undefined, token = state.token) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;

  const options = { method, headers };
  if (body !== undefined) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(`${BASE_URL}${path}`, options);
  let data = null;

  try {
    data = await response.json();
  } catch {
    data = null;
  }

  return { status: response.status, data };
}

function pass(message) {
  console.log(`  PASS ${message}`);
  state.passed++;
}

function fail(message, detail = '') {
  console.log(`  FAIL ${message}${detail ? `: ${detail}` : ''}`);
  state.failed++;
}

function assert(message, condition, detail = '') {
  if (condition) {
    pass(message);
    return;
  }

  fail(message, detail);
}

async function scenario(name, fn) {
  console.log(`\nCENARIO: ${name}`);
  try {
    await fn();
  } catch (error) {
    fail('Cenario executou sem erro inesperado', error.message);
  }
}

function assertQuestionShape(question, label = 'pergunta') {
  assert(`${label} possui id`, question && typeof question.id === 'string' && question.id.length > 0);
  assert(`${label} possui texto`, question && typeof question.text === 'string' && question.text.length > 0);
  assert(`${label} possui opcoes`, question && Array.isArray(question.options) && question.options.length >= 2);
}

function answerForQuestion(question, index) {
  if (!question || !Array.isArray(question.options) || question.options.length === 0) {
    return `Resposta ${index}`;
  }

  return question.options[index % question.options.length];
}

async function login() {
  await scenario('login valido para obter JWT', async () => {
    const { status, data } = await request('POST', '/auth/login', {
      email: EMAIL,
      password: PASSWORD,
    }, null);

    assert('POST /auth/login retorna 200', status === 200, `recebido ${status}`);
    assert('login retorna token', typeof data?.token === 'string' && data.token.length > 0);
    state.token = data?.token || null;
  });
}

async function testAuthScenarios() {
  await scenario('rotas protegidas exigem token', async () => {
    const start = await request('POST', '/quiz/start', {}, null);
    const answer = await request('POST', '/quiz/answer', {}, null);
    const finish = await request('POST', '/quiz/finish', {}, null);

    assert('POST /quiz/start sem token retorna 401', start.status === 401, `recebido ${start.status}`);
    assert('POST /quiz/answer sem token retorna 401', answer.status === 401, `recebido ${answer.status}`);
    assert('POST /quiz/finish sem token retorna 401', finish.status === 401, `recebido ${finish.status}`);
  });

  await scenario('token invalido e rejeitado', async () => {
    const { status } = await request('POST', '/quiz/start', {}, 'token_invalido');
    assert('POST /quiz/start com token invalido retorna 401', status === 401, `recebido ${status}`);
  });
}

async function startQuiz() {
  const { status, data } = await request('POST', '/quiz/start', {});

  assert('POST /quiz/start retorna 201', status === 201, `recebido ${status}`);
  assert('start retorna sessionId', typeof data?.sessionId === 'string' && data.sessionId.length > 0);
  assert('start retorna maxQuestions 8', data?.maxQuestions === 8, `recebido ${data?.maxQuestions}`);
  assert('start retorna 3 perguntas genericas', Array.isArray(data?.questions) && data.questions.length === 3);

  for (const [index, question] of (data?.questions || []).entries()) {
    assertQuestionShape(question, `pergunta generica ${index + 1}`);
  }

  return data;
}

async function testStartScenario() {
  let quiz = null;

  await scenario('inicio do quiz retorna perguntas genericas', async () => {
    quiz = await startQuiz();
  });

  return quiz;
}

async function testAnswerValidationScenarios(validQuiz) {
  await scenario('validacoes de payload do answer', async () => {
    const withoutSession = await request('POST', '/quiz/answer', {
      questionId: 'preferred_type',
      answer: 'Manga',
    });
    const withoutQuestion = await request('POST', '/quiz/answer', {
      sessionId: validQuiz.sessionId,
      answer: 'Manga',
    });
    const withoutAnswer = await request('POST', '/quiz/answer', {
      sessionId: validQuiz.sessionId,
      questionId: 'preferred_type',
    });

    assert('answer sem sessionId retorna 400', withoutSession.status === 400, `recebido ${withoutSession.status}`);
    assert('answer sem questionId retorna 400', withoutQuestion.status === 400, `recebido ${withoutQuestion.status}`);
    assert('answer sem answer retorna 400', withoutAnswer.status === 400, `recebido ${withoutAnswer.status}`);
  });

  await scenario('sessao ou pergunta invalida no answer', async () => {
    const missingSession = await request('POST', '/quiz/answer', {
      sessionId: 'sessao-inexistente',
      questionId: 'preferred_type',
      answer: 'Manga',
    });
    const missingQuestion = await request('POST', '/quiz/answer', {
      sessionId: validQuiz.sessionId,
      questionId: 'pergunta_inexistente',
      answer: 'Manga',
    });

    assert('answer com sessao inexistente retorna 404', missingSession.status === 404, `recebido ${missingSession.status}`);
    assert('answer com pergunta inexistente retorna 400', missingQuestion.status === 400, `recebido ${missingQuestion.status}`);
  });
}

async function answerQuestion(sessionId, question, index) {
  return request('POST', '/quiz/answer', {
    sessionId,
    questionId: question.id,
    answer: answerForQuestion(question, index),
  });
}

async function testFinishTooEarlyScenario() {
  await scenario('finish antes de 3 respostas retorna 400', async () => {
    const quiz = await startQuiz();
    const firstAnswer = await answerQuestion(quiz.sessionId, quiz.questions[0], 0);
    assert('primeira resposta retorna 200', firstAnswer.status === 200, `recebido ${firstAnswer.status}`);

    const finish = await request('POST', '/quiz/finish', {
      sessionId: quiz.sessionId,
      savePreferences: false,
    });

    assert('finish cedo retorna 400', finish.status === 400, `recebido ${finish.status}`);
  });
}

async function answerUntilAdaptiveQuestion(quiz) {
  let result = null;

  for (let index = 0; index < 3; index++) {
    const response = await answerQuestion(quiz.sessionId, quiz.questions[index], index);
    result = response.data;
    assert(`resposta generica ${index + 1} retorna 200`, response.status === 200, `recebido ${response.status}`);
    assert(`answeredCount apos resposta ${index + 1}`, result?.answeredCount === index + 1, `recebido ${result?.answeredCount}`);
  }

  return result;
}

async function testAdaptiveScenario() {
  let quiz = null;
  let adaptiveResult = null;

  await scenario('tres respostas liberam finalizacao e retornam pergunta adaptativa', async () => {
    quiz = await startQuiz();
    adaptiveResult = await answerUntilAdaptiveQuestion(quiz);

    assert('canFinish fica true apos 3 respostas', adaptiveResult?.canFinish === true);
    assert('quiz ainda nao esta completo apos 3 respostas', adaptiveResult?.isComplete === false);
    assertQuestionShape(adaptiveResult?.question, 'pergunta adaptativa');
  });

  return { quiz, adaptiveQuestion: adaptiveResult?.question };
}

async function testMaxLimitScenario() {
  await scenario('quiz nao passa de 8 respostas', async () => {
    const quiz = await startQuiz();
    let currentQuestion = null;
    let result = null;

    for (let index = 0; index < 8; index++) {
      currentQuestion = index < quiz.questions.length ? quiz.questions[index] : result.question;
      assertQuestionShape(currentQuestion, `pergunta ${index + 1}`);

      const response = await answerQuestion(quiz.sessionId, currentQuestion, index);
      result = response.data;

      assert(`resposta ${index + 1} retorna 200`, response.status === 200, `recebido ${response.status}`);
      assert(`answeredCount = ${index + 1}`, result?.answeredCount === index + 1, `recebido ${result?.answeredCount}`);
    }

    assert('isComplete true na oitava resposta', result?.isComplete === true);
    assert('nao retorna nova pergunta na oitava resposta', result?.question === null);

    const extra = await request('POST', '/quiz/answer', {
      sessionId: quiz.sessionId,
      questionId: currentQuestion.id,
      answer: answerForQuestion(currentQuestion, 9),
    });

    assert('nona resposta retorna 409', extra.status === 409, `recebido ${extra.status}`);
  });
}

async function testFinishSuccessScenario() {
  let sessionId = null;

  await scenario('finish retorna preferencias e recomendacoes', async () => {
    const quiz = await startQuiz();
    sessionId = quiz.sessionId;
    await answerUntilAdaptiveQuestion(quiz);

    const finish = await request('POST', '/quiz/finish', {
      sessionId,
      savePreferences: true,
    });

    assert('finish retorna 200', finish.status === 200, `recebido ${finish.status}`);
    assert('finish retorna message', typeof finish.data?.message === 'string' && finish.data.message.length > 0);
    assert('finish retorna preferences.genres array', Array.isArray(finish.data?.preferences?.genres));
    assert('finish retorna preferences.types array', Array.isArray(finish.data?.preferences?.types));
    assert('finish retorna recommendations array', Array.isArray(finish.data?.recommendations));
    assert('finish retorna preferencesSaved true', finish.data?.preferencesSaved === true);

    for (const [index, recommendation] of (finish.data?.recommendations || []).entries()) {
      assert(`recomendacao ${index + 1} possui title`, typeof recommendation.title === 'string');
      assert(`recomendacao ${index + 1} possui type`, typeof recommendation.type === 'string');
      assert(`recomendacao ${index + 1} possui sensitiveContent boolean`, typeof recommendation.sensitiveContent === 'boolean');
      assert(`recomendacao ${index + 1} possui coverUrl`, Object.prototype.hasOwnProperty.call(recommendation, 'coverUrl'));
      assert(`recomendacao ${index + 1} possui synopsis`, Object.prototype.hasOwnProperty.call(recommendation, 'synopsis'));
    }
  });

  await scenario('finish repetido retorna 409', async () => {
    const again = await request('POST', '/quiz/finish', {
      sessionId,
      savePreferences: false,
    });

    assert('finish repetido retorna 409', again.status === 409, `recebido ${again.status}`);
  });
}

async function testRestartScenario() {
  await scenario('start substitui sessao ativa anterior', async () => {
    const oldQuiz = await startQuiz();
    const newQuiz = await startQuiz();

    assert('nova sessao tem sessionId diferente', oldQuiz.sessionId !== newQuiz.sessionId);

    const oldSessionAnswer = await request('POST', '/quiz/answer', {
      sessionId: oldQuiz.sessionId,
      questionId: oldQuiz.questions[0].id,
      answer: 'Livro',
    });

    assert('sessao antiga nao aceita resposta apos novo start', oldSessionAnswer.status === 404, `recebido ${oldSessionAnswer.status}`);
  });
}

async function testFinishValidationScenarios() {
  await scenario('validacoes de payload do finish', async () => {
    const withoutSession = await request('POST', '/quiz/finish', {
      savePreferences: false,
    });
    const missingSession = await request('POST', '/quiz/finish', {
      sessionId: 'sessao-inexistente',
      savePreferences: false,
    });

    assert('finish sem sessionId retorna 400', withoutSession.status === 400, `recebido ${withoutSession.status}`);
    assert('finish com sessao inexistente retorna 404', missingSession.status === 404, `recebido ${missingSession.status}`);
  });
}

async function run() {
  console.log('Entre Paginas - Testes completos do Quiz Backend');
  console.log(`Servidor: ${BASE_URL}`);
  console.log(`Usuario: ${EMAIL}`);

  await testAuthScenarios();
  await login();

  const quiz = await testStartScenario();
  if (quiz?.sessionId) {
    await testAnswerValidationScenarios(quiz);
  }

  await testFinishValidationScenarios();
  await testFinishTooEarlyScenario();
  await testAdaptiveScenario();
  await testMaxLimitScenario();
  await testFinishSuccessScenario();
  await testRestartScenario();

  const total = state.passed + state.failed;
  console.log('\nResultado');
  console.log(`${state.passed}/${total} testes passaram`);

  if (state.failed > 0) {
    process.exit(1);
  }
}

run().catch((error) => {
  console.error('\nErro fatal:', error.message);
  console.error('Verifique se o servidor esta rodando e se as tabelas foram criadas.');
  process.exit(1);
});
