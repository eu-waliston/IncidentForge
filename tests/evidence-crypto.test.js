const test = require('node:test');
const assert = require('node:assert/strict');
const { sha256 } = require('../src/utils/evidence-crypto');

test('calculates the expected SHA-256 digest for known bytes', () => {
  assert.equal(sha256(Buffer.from('abc')), 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
});

test('digest changes when evidence bytes change', () => {
  assert.notEqual(sha256(Buffer.from('evidence-A')), sha256(Buffer.from('evidence-B')));
});

test('rejects non-buffer inputs', () => {
  assert.throws(() => sha256('abc'), /expects a Buffer/);
});
