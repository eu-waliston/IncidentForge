const test = require('node:test');
const assert = require('node:assert/strict');
const { SEVERITIES, STATUSES, CATEGORIES } = require('../src/models/incident');

test('incident domain exposes expected enum values', () => {
  assert.deepEqual(SEVERITIES, ['low', 'medium', 'high', 'critical']);
  assert.ok(STATUSES.includes('investigating'));
  assert.ok(STATUSES.includes('closed'));
  assert.ok(CATEGORIES.includes('unauthorized_access'));
});
