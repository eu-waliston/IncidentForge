const buckets = new Map();

function createRateLimit({ windowMs = 60_000, max = 120, now = Date.now } = {}) {
  if (!Number.isInteger(windowMs) || windowMs < 1 || !Number.isInteger(max) || max < 1) {
    throw new TypeError('Rate-limit windowMs and max must be positive integers.');
  }
  return function rateLimit(req, res, next) {
    const key = req.ip || req.socket?.remoteAddress || 'unknown';
    const time = now();
    let bucket = buckets.get(key);
    if (!bucket || bucket.resetAt <= time) {
      bucket = { count: 0, resetAt: time + windowMs };
      buckets.set(key, bucket);
    }
    bucket.count += 1;
    res.setHeader('RateLimit-Limit', String(max));
    res.setHeader('RateLimit-Remaining', String(Math.max(0, max - bucket.count)));
    res.setHeader('RateLimit-Reset', String(Math.ceil(bucket.resetAt / 1000)));
    if (bucket.count > max) {
      res.setHeader('Retry-After', String(Math.max(1, Math.ceil((bucket.resetAt - time) / 1000))));
      return res.status(429).json({ error: { code: 'RATE_LIMIT_EXCEEDED', message: 'Too many requests. Please retry later.' }, requestId: req.requestId });
    }
    // Opportunistic cleanup keeps the simple in-memory lab limiter bounded.
    if (buckets.size > 5000) for (const [bucketKey, value] of buckets) if (value.resetAt <= time) buckets.delete(bucketKey);
    next();
  };
}
function resetRateLimitForTests() { buckets.clear(); }
module.exports = { createRateLimit, resetRateLimitForTests };
