function apiToken(req, res, next) {
  const expected = process.env.API_ACCESS_TOKEN;
  if (!expected) return next(); // Local development only; production should set a strong token or add real user auth.
  const supplied = req.get('x-api-token');
  const crypto = require('node:crypto');
  const a = Buffer.from(String(supplied || ''), 'utf8');
  const b = Buffer.from(expected, 'utf8');
  const valid = a.length === b.length && crypto.timingSafeEqual(a, b);
  if (!valid) return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'A valid API token is required.' }, requestId: req.requestId });
  next();
}
module.exports = { apiToken };
