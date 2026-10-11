const test = require('node:test');
const assert = require('node:assert/strict');
const { buildListQuery } = require('../src/services/event-query');

test('applies safe defaults and valid filters', () => {
  const result = buildListQuery({ page: '2', limit: '10', severity: 'high', from: '2026-10-01T00:00:00Z' });
  assert.equal(result.page, 2);
  assert.equal(result.limit, 10);
  assert.equal(result.filter.severity, 'high');
  assert.ok(result.filter.occurredAt.$gte instanceof Date);
});

test('rejects oversized limits and unknown query parameters', () => {
  assert.throws(() => buildListQuery({ limit: '101' }), { code: 'INVALID_LIMIT' });
  assert.throws(() => buildListQuery({ $where: 'true' }), { code: 'UNKNOWN_QUERY_FIELDS' });
});

test('rejects inverted date ranges', () => {
  assert.throws(() => buildListQuery({ from: '2026-10-12', to: '2026-10-01' }), { code: 'INVALID_DATE_RANGE' });
});
