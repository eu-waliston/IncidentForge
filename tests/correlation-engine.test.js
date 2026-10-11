const test = require('node:test');
const assert = require('node:assert/strict');
const { sharedReasons, scoreReasons, validateOptions, fingerprintFor } = require('../src/services/correlation-rules');
const anchor = { _id: 'aaaaaaaaaaaaaaaaaaaaaaaa', eventType: 'authentication', occurredAt: '2026-01-01T10:00:00.000Z', asset: 'WS-01', actor: 'alice', tags: ['suspicious', 'login'] };
const candidate = { _id: 'bbbbbbbbbbbbbbbbbbbbbbbb', eventType: 'endpoint_alert', occurredAt: '2026-01-01T10:05:00.000Z', asset: 'ws-01', actor: 'ALICE', tags: ['suspicious'] };
test('detects shared asset, actor, tag and temporal proximity case-insensitively', () => {
  const reasons = sharedReasons(anchor, candidate, 60);
  assert.deepEqual(reasons, ['shared_asset', 'shared_actor', 'shared_tag', 'temporal_proximity']);
});
test('scores correlated signals deterministically within 0..100', () => {
  const reasons = sharedReasons(anchor, candidate, 60);
  const score = scoreReasons(reasons, anchor, candidate, 60);
  assert.equal(score, 94);
  assert.ok(score >= 0 && score <= 100);
});
test('rejects invalid correlation options', () => {
  assert.throws(() => validateOptions({ windowMinutes: 0 }), { code: 'INVALID_WINDOW' });
  assert.throws(() => validateOptions({ minScore: 101 }), { code: 'INVALID_MIN_SCORE' });
  assert.throws(() => validateOptions({ limit: 101 }), { code: 'INVALID_LIMIT' });
  assert.throws(() => validateOptions({ arbitrary: true }), { code: 'UNKNOWN_CORRELATION_OPTIONS' });
});
test('uses a stable fingerprint regardless of link order', () => {
  const anchorId = 'aaaaaaaaaaaaaaaaaaaaaaaa';
  assert.equal(fingerprintFor(anchorId, ['bbbbbbbbbbbbbbbbbbbbbbbb', 'cccccccccccccccccccccccc'], 60), fingerprintFor(anchorId, ['cccccccccccccccccccccccc', 'bbbbbbbbbbbbbbbbbbbbbbbb'], 60));
});
