const mongoose = require('mongoose');
const { EVIDENCE_TYPES } = require('./evidence-constants');

const evidenceSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, minlength: 3, maxlength: 160 },
  description: { type: String, trim: true, maxlength: 3000, default: '' },
  evidenceType: { type: String, enum: EVIDENCE_TYPES, required: true, index: true },
  source: { type: String, required: true, trim: true, maxlength: 200 },
  originalFileName: { type: String, required: true, trim: true, maxlength: 255 },
  mimeType: { type: String, required: true, trim: true, maxlength: 150 },
  sizeBytes: { type: Number, required: true, min: 1, max: 10485760 },
  sha256: { type: String, required: true, match: /^[a-f0-9]{64}$/, index: true },
  storagePath: { type: String, required: true, select: false },
  incidentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Incident', default: null, index: true },
  capturedAt: { type: Date, default: null },
  registeredBy: { type: String, required: true, trim: true, maxlength: 120 },
  tags: { type: [{ type: String, trim: true, lowercase: true, maxlength: 40 }], default: [] },
  immutableMetadata: { type: mongoose.Schema.Types.Mixed, default: {} }
}, { timestamps: true, versionKey: '__v', strict: 'throw' });
evidenceSchema.index({ incidentId: 1, createdAt: -1 });
module.exports = { Evidence: mongoose.model('Evidence', evidenceSchema) };
