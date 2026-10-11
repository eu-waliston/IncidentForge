const mongoose = require('mongoose');

const correlationLinkSchema = new mongoose.Schema({
  eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'SecurityEvent', required: true },
  eventType: { type: String, required: true },
  occurredAt: { type: Date, required: true },
  score: { type: Number, required: true, min: 0, max: 100 },
  reasons: { type: [{ type: String, maxlength: 120 }], default: [] }
}, { _id: false });

const correlationSchema = new mongoose.Schema({
  fingerprint: { type: String, required: true, unique: true, index: true },
  anchorEventId: { type: mongoose.Schema.Types.ObjectId, ref: 'SecurityEvent', required: true, index: true },
  windowMinutes: { type: Number, required: true, min: 1, max: 10080 },
  score: { type: Number, required: true, min: 0, max: 100, index: true },
  reasons: { type: [{ type: String, maxlength: 120 }], default: [] },
  links: { type: [correlationLinkSchema], default: [] },
  status: { type: String, enum: ['candidate', 'reviewed', 'dismissed'], default: 'candidate', index: true },
  reviewedBy: { type: String, default: null, maxlength: 120 },
  reviewedAt: { type: Date, default: null }
}, { timestamps: true, versionKey: '__v', strict: 'throw' });

correlationSchema.index({ anchorEventId: 1, createdAt: -1 });
module.exports = { Correlation: mongoose.model('Correlation', correlationSchema) };
