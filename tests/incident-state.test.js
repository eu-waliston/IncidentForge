const test = require('node:test');
const assert = require('node:assert/strict');
const { canTransition, assertTransition } = require('../src/services/incident-state');

test('allows valid forward transitions', () => {
  assert.equal(canTransition('new', 'triaged'), true);
  assert.equal(canTransition('investigating', 'contained'), true);
  assert.equal(canTransition('resolved', 'closed'), true);
});

test('rejects skipped and terminal transitions', () => {
  assert.equal(canTransition('new', 'closed'), false);
  assert.equal(canTransition('closed', 'investigating'), false);
  assert.throws(() => assertTransition('new', 'resolved'), { code: 'INVALID_STATUS_TRANSITION', statusCode: 409 });
});

test('rejects unknown states', () => {
  assert.equal(canTransition('unknown', 'closed'), false);
});
