const test = require('node:test');
const assert = require('node:assert/strict');
const { parsePagination, validateIncidentFields, validateListQuery } = require('../src/utils/validation');

test('pagination applies safe defaults', () => {
  assert.deepEqual(parsePagination({}), { page: 1, limit: 20 });
});
test('pagination rejects excessive limits', () => {
  assert.throws(() => parsePagination({ limit: '101' }), { code: 'INVALID_LIMIT', statusCode: 400 });
});
test('incident input rejects protected fields', () => {
  assert.throws(() => validateIncidentFields({ title: 'Test title', description: 'A valid description' , status: 'closed' }), { code: 'UNKNOWN_FIELDS', statusCode: 400 });
});
test('incident input requires title and description on creation', () => {
  assert.throws(() => validateIncidentFields({ title: 'Test title' }), { code: 'MISSING_REQUIRED_FIELDS', statusCode: 400 });
});
test('list query rejects unknown filters', () => {
  assert.throws(() => validateListQuery({ owner: 'root' }), { code: 'UNKNOWN_FIELDS', statusCode: 400 });
});
