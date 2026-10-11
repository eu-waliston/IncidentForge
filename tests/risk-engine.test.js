const test = require('node:test');
const assert = require('node:assert/strict');
const { calculateRisk, classifyRisk } = require('../src/services/risk-engine');

test('risk score combines severity, cluster size and correlation strength', () => {
  const result = calculateRisk({ severity: 'high', correlationScore: 80, eventCount: 3 });
  assert.equal(result.score, 69);
  assert.equal(result.level, 'high');
  assert.deepEqual(result.factors.map(item => item.points), [45, 8, 16]);
});
test('critical severity is capped at 100 and classifies critical', () => {
  const result = calculateRisk({ severity: 'critical', correlationScore: 100, eventCount: 100 });
  assert.equal(result.score, 100);
  assert.equal(result.level, 'critical');
});
test('incident severity establishes a minimum score', () => {
  const result = calculateRisk({ severity: 'info', correlationScore: 0, eventCount: 1, incidentSeverity: 'high' });
  assert.equal(result.score, 45);
  assert.equal(result.level, 'high');
});
test('invalid inputs are rejected', () => {
  assert.throws(() => calculateRisk({ severity: 'unknown' }), { code: 'INVALID_SEVERITY' });
  assert.throws(() => calculateRisk({ severity: 'low', correlationScore: 101 }), { code: 'INVALID_CORRELATION_SCORE' });
  assert.throws(() => calculateRisk({ severity: 'low', eventCount: 0 }), { code: 'INVALID_EVENT_COUNT' });
});
test('risk level boundaries are deterministic', () => {
  assert.equal(classifyRisk(19), 'low');
  assert.equal(classifyRisk(20), 'medium');
  assert.equal(classifyRisk(40), 'high');
  assert.equal(classifyRisk(70), 'critical');
});
