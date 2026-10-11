const test = require('node:test');
const assert = require('node:assert/strict');
const { normalizeEvent } = require('../src/services/event-normalizer');

test('normalizes common source field aliases and severity names', () => {
  const event = normalizeEvent({ type: 'auth', level: 'warning', provider: 'lab-siem', timestamp: '2026-10-10T10:00:00Z', hostname: 'ws-01', username: 'analyst', description: 'Failed login attempt', tags: ['Auth', 'AUTH'] });
  assert.equal(event.eventType, 'authentication');
  assert.equal(event.severity, 'medium');
  assert.equal(event.source, 'lab-siem');
  assert.equal(event.asset, 'ws-01');
  assert.deepEqual(event.tags, ['auth']);
});

test('rejects unknown event types', () => {
  assert.throws(() => normalizeEvent({ eventType: 'magic', source: 'test', message: 'hello' }), { code: 'INVALID_EVENT_TYPE' });
});

test('requires a source and message', () => {
  assert.throws(() => normalizeEvent({ eventType: 'other', message: 'hello' }), { code: 'INVALID_EVENT_SOURCE' });
  assert.throws(() => normalizeEvent({ eventType: 'other', source: 'test', message: '  ' }), { code: 'INVALID_EVENT_MESSAGE' });
});

test('rejects invalid timestamps and source event IDs', () => {
  assert.throws(() => normalizeEvent({ source: 'test', message: 'x', timestamp: 'not-a-date' }), { code: 'INVALID_EVENT_TIMESTAMP' });
  assert.throws(() => normalizeEvent({ source: 'test', message: 'x', sourceEventId: 42 }), { code: 'INVALID_SOURCE_EVENT_ID' });
});

test('rejects oversized payloads and invalid tags', () => {
  assert.throws(() => normalizeEvent({ source: 'test', message: 'x', extra: 'a'.repeat(17000) }), { code: 'EVENT_TOO_LARGE' });
  assert.throws(() => normalizeEvent({ source: 'test', message: 'x', tags: [''] }), { code: 'INVALID_EVENT_TAGS' });
});
