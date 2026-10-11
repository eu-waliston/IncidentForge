require('dotenv').config();
function loadEnv() {
  const port = Number(process.env.PORT || 3000);
  const host = process.env.HOST || '127.0.0.1';
  const nodeEnv = process.env.NODE_ENV || 'development';
  const mongoUri = process.env.MONGODB_URI;
  const rateLimitMax = Number(process.env.RATE_LIMIT_MAX || 120);
  const rateLimitWindowMs = Number(process.env.RATE_LIMIT_WINDOW_MS || 60000);
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('PORT must be a valid TCP port.');
  if (!mongoUri) throw new Error('MONGODB_URI is required.');
  if (!['development', 'test', 'production'].includes(nodeEnv)) throw new Error('NODE_ENV is invalid.');
  if (!Number.isInteger(rateLimitMax) || rateLimitMax < 1) throw new Error('RATE_LIMIT_MAX must be a positive integer.');
  if (!Number.isInteger(rateLimitWindowMs) || rateLimitWindowMs < 1000) throw new Error('RATE_LIMIT_WINDOW_MS must be at least 1000.');
  if (nodeEnv === 'production' && host === '0.0.0.0' && !process.env.API_ACCESS_TOKEN) throw new Error('Set API_ACCESS_TOKEN before binding the production API to all interfaces.');
  return Object.freeze({ port, host, nodeEnv, mongoUri, corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173', rateLimitMax, rateLimitWindowMs });
}
module.exports = { loadEnv };
