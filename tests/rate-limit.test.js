const test = require('node:test');
const assert = require('node:assert/strict');
const { createRateLimit, resetRateLimitForTests } = require('../src/middleware/rate-limit');
function response() { return { headers: {}, statusCode: 200, setHeader(k,v){this.headers[k]=v;}, status(n){this.statusCode=n;return this;}, json(body){this.body=body;return this;} }; }
test('rate limiter allows requests up to configured maximum', () => {
  resetRateLimitForTests(); let next = 0; const limiter = createRateLimit({ windowMs: 1000, max: 2, now: () => 100 });
  const req = { ip: 'test-client', requestId: 'req-1' };
  limiter(req, response(), () => next++); limiter(req, response(), () => next++);
  assert.equal(next, 2);
});
test('rate limiter rejects requests over the configured maximum', () => {
  resetRateLimitForTests(); let next = 0; const limiter = createRateLimit({ windowMs: 1000, max: 1, now: () => 100 });
  const req = { ip: 'limited-client', requestId: 'req-2' };
  limiter(req, response(), () => next++); const res = response(); limiter(req, res, () => next++);
  assert.equal(res.statusCode, 429); assert.equal(res.body.error.code, 'RATE_LIMIT_EXCEEDED'); assert.equal(next, 1);
});
test('rate limiter resets expired buckets', () => {
  resetRateLimitForTests(); let time = 100; const limiter = createRateLimit({ windowMs: 1000, max: 1, now: () => time });
  const req = { ip: 'reset-client' }; limiter(req, response(), () => {}); time = 1200; const res = response(); limiter(req, res, () => {});
  assert.equal(res.statusCode, 200);
});
