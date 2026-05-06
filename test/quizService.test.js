const test = require('node:test');
const assert = require('node:assert/strict');

const quizService = require('../src/services/quizService');

test('creates a quiz session with three generic objective questions', () => {
  const session = quizService._test.createInitialSession('user@example.com');

  assert.equal(session.userEmail, 'user@example.com');
  assert.equal(session.maxQuestions, 8);
  assert.equal(session.questions.length, 3);
  assert.equal(session.answers.length, 0);
  assert.equal(session.finished, false);
  assert.ok(session.sessionId);

  for (const question of session.questions) {
    assert.equal(typeof question.id, 'string');
    assert.equal(typeof question.text, 'string');
    assert.ok(Array.isArray(question.options));
    assert.ok(question.options.length >= 2);
  }
});

test('records answers only for known questions', () => {
  const session = quizService._test.createInitialSession('user@example.com');

  const updated = quizService._test.recordAnswer(session, {
    questionId: 'preferred_type',
    answer: 'Manga',
  });

  assert.equal(updated.answers.length, 1);
  assert.equal(updated.answers[0].questionId, 'preferred_type');
  assert.equal(updated.answers[0].answer, 'Manga');

  assert.throws(
    () => quizService._test.recordAnswer(session, { questionId: 'missing', answer: 'Teste' }),
    /Pergunta nao encontrada/
  );
});

test('does not allow more than eight answers', () => {
  const session = quizService._test.createInitialSession('user@example.com');
  session.questions = Array.from({ length: 8 }, (_, index) => ({
    id: `q_${index + 1}`,
    text: `Pergunta ${index + 1}`,
    options: ['A', 'B'],
  }));
  session.answers = session.questions.map((question) => ({
    questionId: question.id,
    answer: 'A',
    answeredAt: new Date().toISOString(),
  }));

  assert.equal(quizService._test.isComplete(session), true);
  assert.throws(
    () => quizService._test.recordAnswer(session, { questionId: 'q_1', answer: 'B' }),
    /limite de 8 perguntas/
  );
});

test('normalizes invalid AI question with fallback', () => {
  const fallback = quizService._test.normalizeAiQuestion({
    text: '',
    options: ['Uma opcao'],
  }, 4);

  assert.equal(fallback.id, 'ai_4');
  assert.equal(typeof fallback.text, 'string');
  assert.ok(fallback.text.length > 0);
  assert.ok(Array.isArray(fallback.options));
  assert.ok(fallback.options.length >= 2);
});
