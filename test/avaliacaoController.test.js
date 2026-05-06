const test = require('node:test');
const assert = require('node:assert/strict');

const avaliacaoController = require('../src/controllers/avaliacaoController');
const avaliacaoModel = require('../src/models/avaliacaoModel');

function createResponse() {
  return {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
  };
}

test('getMyEvaluations returns the authenticated user list', async () => {
  const originalListByUserEmail = avaliacaoModel.listByUserEmail;
  avaliacaoModel.listByUserEmail = async (email) => {
    assert.equal(email, 'reader@example.com');
    return [{ googleBooksId: 'abc123' }];
  };

  const req = { user: { email: 'reader@example.com' } };
  const res = createResponse();

  try {
    await avaliacaoController.getMyEvaluations(req, res, () => {});
    assert.equal(res.statusCode, 200);
    assert.deepEqual(res.body, [{ googleBooksId: 'abc123' }]);
  } finally {
    avaliacaoModel.listByUserEmail = originalListByUserEmail;
  }
});

test('upsertEvaluation validates required fields', async () => {
  const req = {
    user: { email: 'reader@example.com' },
    body: { title: 'Duna', rating: 5 },
  };
  const res = createResponse();

  await avaliacaoController.upsertEvaluation(req, res, () => {});

  assert.equal(res.statusCode, 400);
  assert.deepEqual(res.body, {
    message: 'Os campos "googleBooksId" e "title" sao obrigatorios.',
  });
});

test('upsertEvaluation validates rating range', async () => {
  const req = {
    user: { email: 'reader@example.com' },
    body: { googleBooksId: 'abc123', title: 'Duna', rating: 6 },
  };
  const res = createResponse();

  await avaliacaoController.upsertEvaluation(req, res, () => {});

  assert.equal(res.statusCode, 400);
  assert.deepEqual(res.body, {
    message: 'O campo "rating" deve ser um numero entre 1 e 5.',
  });
});

test('upsertEvaluation persists and returns normalized payload', async () => {
  const originalUpsertByUserEmail = avaliacaoModel.upsertByUserEmail;
  avaliacaoModel.upsertByUserEmail = async (email, payload) => {
    assert.equal(email, 'reader@example.com');
    assert.deepEqual(payload, {
      googleBooksId: 'abc123',
      title: 'Duna',
      rating: 5,
      comment: 'Excelente',
    });

    return payload;
  };

  const req = {
    user: { email: 'reader@example.com' },
    body: {
      googleBooksId: 'abc123',
      title: ' Duna ',
      rating: 5,
      comment: ' Excelente ',
    },
  };
  const res = createResponse();

  try {
    await avaliacaoController.upsertEvaluation(req, res, () => {});

    assert.equal(res.statusCode, 200);
    assert.deepEqual(res.body, {
      googleBooksId: 'abc123',
      title: 'Duna',
      rating: 5,
      comment: 'Excelente',
    });
  } finally {
    avaliacaoModel.upsertByUserEmail = originalUpsertByUserEmail;
  }
});
