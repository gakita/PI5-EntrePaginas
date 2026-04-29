const test = require('node:test');
const assert = require('node:assert/strict');

const runQuizTests = require('../scripts/runQuizTests');

test('classifies quiz route as available when protected endpoint returns 401', () => {
  assert.equal(runQuizTests._test.classifyQuizRouteStatus(401), 'available');
});

test('classifies quiz route as stale server when protected endpoint returns 404', () => {
  assert.equal(runQuizTests._test.classifyQuizRouteStatus(404), 'missing');
});

test('classifies unexpected quiz route status separately', () => {
  assert.equal(runQuizTests._test.classifyQuizRouteStatus(500), 'unexpected');
});
