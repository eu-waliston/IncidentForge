const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const { randomUUID } = require('node:crypto');
const { notFound } = require('./middleware/not-found');
const { errorHandler } = require('./middleware/error-handler');
const { createRateLimit } = require('./middleware/rate-limit');
const { apiToken } = require('./middleware/api-token');
const incidentRoutes = require('./routes/incidents');
const eventRoutes = require('./routes/events');
const evidenceRoutes = require('./routes/evidence');
const correlationRoutes = require('./routes/correlations');
const riskRoutes = require('./routes/risk');
const playbookRoutes = require('./routes/playbooks');

function createApp(config) {
  const app = express();
  app.disable('x-powered-by');
  app.use((req, res, next) => {
    req.requestId = randomUUID();
    res.setHeader('X-Request-ID', req.requestId);
    res.setHeader('Cache-Control', 'no-store');
    next();
  });
  app.use(helmet());
  const allowedOrigins = String(config.corsOrigin || 'http://localhost:5173').split(',').map(value => value.trim()).filter(Boolean);
  app.use(cors({ origin(origin, callback) {
    if (!origin || allowedOrigins.includes('*') || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(null, false);
  }, credentials: false, methods: ['GET', 'POST', 'PATCH', 'OPTIONS'], allowedHeaders: ['Content-Type', 'X-API-Token'] }));
  app.get('/health', (req, res) => res.status(200).json({ status: 'ok', service: 'incidentforge', timestamp: new Date().toISOString(), requestId: req.requestId }));
  app.use(createRateLimit({ windowMs: config.rateLimitWindowMs || 60_000, max: config.rateLimitMax || 120 }));
  app.use('/api/evidence', express.json({ limit: '14mb' }));
  app.use(express.json({ limit: '100kb' }));
  app.use('/api', apiToken);
  app.use('/api/incidents', incidentRoutes);
  app.use('/api/events', eventRoutes);
  app.use('/api/evidence', evidenceRoutes);
  app.use('/api/correlations', correlationRoutes);
  app.use('/api/risk', riskRoutes);
  app.use('/api/playbooks', playbookRoutes);
  app.use(notFound);
  app.use(errorHandler);
  return app;
}
module.exports = { createApp };
