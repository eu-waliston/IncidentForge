const test = require('node:test');
const assert = require('node:assert/strict');
const { apiToken } = require('../src/middleware/api-token');
function res() { return { statusCode: 200, status(n){this.statusCode=n;return this;}, json(b){this.body=b;return this;} }; }
test('API token middleware permits local use when token is not configured', () => {
  const old = process.env.API_ACCESS_TOKEN; delete process.env.API_ACCESS_TOKEN; let called = false;
  apiToken({ get: () => undefined, requestId: 'a' }, res(), () => called = true);
  assert.equal(called, true); if (old !== undefined) process.env.API_ACCESS_TOKEN = old;
});
test('API token middleware rejects missing token when configured', () => {
  const old = process.env.API_ACCESS_TOKEN; process.env.API_ACCESS_TOKEN = 'test-secret'; const response = res();
  apiToken({ get: () => undefined, requestId: 'b' }, response, () => assert.fail('next must not run'));
  assert.equal(response.statusCode, 401); assert.equal(response.body.error.code, 'UNAUTHORIZED');
  if (old === undefined) delete process.env.API_ACCESS_TOKEN; else process.env.API_ACCESS_TOKEN = old;
});
test('API token middleware accepts exact token', () => {
  const old = process.env.API_ACCESS_TOKEN; process.env.API_ACCESS_TOKEN = 'test-secret'; let called = false;
  apiToken({ get: name => name === 'x-api-token' ? 'test-secret' : undefined }, res(), () => called = true);
  assert.equal(called, true); if (old === undefined) delete process.env.API_ACCESS_TOKEN; else process.env.API_ACCESS_TOKEN = old;
});
