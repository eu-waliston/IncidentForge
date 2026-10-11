const mongoose = require('mongoose');
const { EVENT_TYPES, EVENT_SEVERITIES } = require('./security-event-constants');

const securityEventSchema = new mongoose.Schema({
  eventType: { type: String, required: true, enum: EVENT_TYPES, index: true },
  severity: { type: String, required: true, enum: EVENT_SEVERITIES, default: 'info', index: true },
  source: { type: String, required: true, trim: true, maxlength: 120, index: true },
  sourceEventId: { type: String, trim: true, maxlength: 160, default: null },
  occurredAt: { type: Date, required: true, index: true },
  asset: { type: String, trim: true, maxlength: 200, default: null, index: true },
  actor: { type: String, trim: true, maxlength: 200, default: null },
  message: { type: String, required: true, trim: true, maxlength: 4000 },
  tags: { type: [{ type: String, trim: true, lowercase: true, maxlength: 40 }], default: [] },
  rawPayload: { type: mongoose.Schema.Types.Mixed, default: {} },
  incidentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Incident', default: null, index: true }
}, { timestamps: true, versionKey: '__v', strict: 'throw' });

securityEventSchema.index({ source: 1, sourceEventId: 1 }, {
  unique: true,
  partialFilterExpression: { sourceEventId: { $type: 'string' } }
});
securityEventSchema.index({ eventType: 1, severity: 1, occurredAt: -1 });

module.exports = { SecurityEvent: mongoose.model('SecurityEvent', securityEventSchema) };
