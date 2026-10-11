const mongoose = require('mongoose');
const { CUSTODY_ACTIONS } = require('./evidence-constants');
const custodyRecordSchema = new mongoose.Schema({
  evidenceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Evidence', required: true, index: true },
  action: { type: String, enum: CUSTODY_ACTIONS, required: true },
  actor: { type: String, required: true, trim: true, maxlength: 120 },
  occurredAt: { type: Date, required: true, default: Date.now },
  sha256: { type: String, match: /^[a-f0-9]{64}$/, default: null },
  details: { type: String, trim: true, maxlength: 1000, default: '' },
  requestId: { type: String, trim: true, maxlength: 100, default: null }
}, { timestamps: true, versionKey: false, strict: 'throw' });
custodyRecordSchema.index({ evidenceId: 1, occurredAt: 1 });
module.exports = { CustodyRecord: mongoose.model('CustodyRecord', custodyRecordSchema) };
