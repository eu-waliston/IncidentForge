const test = require('node:test');
const assert = require('node:assert/strict');
const { EVIDENCE_TYPES, CUSTODY_ACTIONS } = require('../src/models/evidence-constants');

test('evidence types are defined and unique', () => {
  assert.ok(EVIDENCE_TYPES.includes('file'));
  assert.ok(EVIDENCE_TYPES.includes('network_capture'));
  assert.equal(new Set(EVIDENCE_TYPES).size, EVIDENCE_TYPES.length);
});

test('custody actions cover registration, verification, and review', () => {
  assert.ok(CUSTODY_ACTIONS.includes('registered'));
  assert.ok(CUSTODY_ACTIONS.includes('integrity_verified'));
  assert.ok(CUSTODY_ACTIONS.includes('custody_note_added'));
});
