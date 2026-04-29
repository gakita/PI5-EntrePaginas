#!/usr/bin/env node

/**
 * Script manual para validar o fluxo HTTP do quiz.
 *
 * Pre-requisitos:
 *   1. npm run db:quiz
 *   2. npm run dev
 *
 * Uso:
 *   node scripts/testQuiz.js --email=admin@example.com --password=123456
 */

const BASE_URL = 'http://localhost:3000';

function getArg(flag) {
  const arg = process.argv.find((item) => item.startsWith(`${flag}=`));
  return arg ? arg.split('=').slice(1).join('=') : null;
}

let passed = 0;
let failed = 0;

async function request(method, path, body = null, token = null) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;

  const options = { method, headers };
  if (body) options.body = JSON.stringify(body);

  const response = await fetch(`${BASE_URL}${path}`, options);
  const data = await response.json();
  return { status: response.status, data };
}

function assert(testName, condition, detail = '') {
  if (condition) {
    console.log(`  PASS ${testName}`);
    passed++;
    return;
  }

  console.log(`  FAIL ${testName}${detail ? `: ${detail}` : ''}`);
  failed++;
}

async function login(email, password) {
  console.log('\nCENARIO 1: Login');
  const { status, data } = await request('POST', '/auth/login', { email, password });

  assert('Status HTTP 200', status === 200, `recebido: ${status}`);
  assert('Retorna token', typeof data.token === 'string' && data.token.length > 0);

  return data.token;
}

async function startQuiz(token) {
  console.log('\nCENARIO 2: Iniciar quiz');
  const { status, data } = await request('POST', '/quiz/start', {}, token);

  assert('Status HTTP 201', status === 201, `recebido: ${status}`);
  assert('Retorna sessionId', typeof data.sessionId === 'string' && data.sessionId.length > 0);
  assert('Retorna 3 perguntas genericas', Array.isArray(data.questions) && data.questions.length === 3);
  assert('maxQuestions = 8', data.maxQuestions === 8);

  return data;
}

async function answerQuestion(token, sessionId, question, answer) {
  const { status, data } = await request(
    'POST',
    '/quiz/answer',
    { sessionId, questionId: question.id, answer },
    token
  );

  assert(`Responder ${question.id} retorna 200`, status === 200, `recebido: ${status}`);
  assert('Retorna answeredCount numerico', typeof data.answeredCount === 'number');
  return data;
}

async function runQuizAnswers(token, quiz) {
  console.log('\nCENARIO 3: Responder perguntas e receber adaptativa');

  let result = await answerQuestion(token, quiz.sessionId, quiz.questions[0], 'Manga');
  result = await answerQuestion(token, quiz.sessionId, quiz.questions[1], 'Reflexiva');
  result = await answerQuestion(token, quiz.sessionId, quiz.questions[2], 'Fantasia');

  assert('Depois da terceira resposta pode finalizar', result.canFinish === true);
  assert('Retorna pergunta adaptativa', result.question && typeof result.question.text === 'string');
  assert('Pergunta adaptativa tem opcoes', Array.isArray(result.question.options) && result.question.options.length >= 2);

  return result;
}

async function finishQuiz(token, sessionId) {
  console.log('\nCENARIO 4: Finalizar quiz');
  const { status, data } = await request(
    'POST',
    '/quiz/finish',
    { sessionId, savePreferences: true },
    token
  );

  assert('Status HTTP 200', status === 200, `recebido: ${status}`);
  assert('Retorna preferences', data.preferences && Array.isArray(data.preferences.genres));
  assert('Retorna recommendations array', Array.isArray(data.recommendations));
  assert('Retorna preferencesSaved true', data.preferencesSaved === true);
}

async function testValidation(token) {
  console.log('\nCENARIO 5: Validacoes');

  const missingToken = await request('POST', '/quiz/start');
  assert('Start sem token retorna 401', missingToken.status === 401, `recebido: ${missingToken.status}`);

  const missingAnswer = await request('POST', '/quiz/answer', { sessionId: 'abc', questionId: 'q' }, token);
  assert('Answer sem answer retorna 400', missingAnswer.status === 400, `recebido: ${missingAnswer.status}`);
}

async function run() {
  const email = getArg('--email') || 'admin@example.com';
  const password = getArg('--password') || '123456';

  console.log('Entre Paginas - Testes manuais do Quiz Backend');
  console.log(`Servidor: ${BASE_URL}`);
  console.log(`Usuario: ${email}`);

  try {
    const token = await login(email, password);
    const quiz = await startQuiz(token);
    await runQuizAnswers(token, quiz);
    await finishQuiz(token, quiz.sessionId);
    await testValidation(token);
  } catch (error) {
    console.error('\nErro inesperado:', error.message);
    console.error('Verifique se o servidor esta rodando e se as tabelas foram criadas.');
    process.exit(1);
  }

  const total = passed + failed;
  console.log('\nResultado');
  console.log(`${passed}/${total} testes passaram`);

  if (failed > 0) {
    process.exit(1);
  }
}

run();
