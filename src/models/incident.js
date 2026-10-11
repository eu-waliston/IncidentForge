const mongoose = require('mongoose');
const { SEVERITIES, STATUSES, CATEGORIES } = require('./incident-constants');

const incidentSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, minlength: 5, maxlength: 160 },
  description: { type: String, required: true, trim: true, minlength: 10, maxlength: 5000 },
  severity: { type: String, enum: SEVERITIES, required: true, default: 'medium', index: true },
  status: { type: String, enum: STATUSES, required: true, default: 'new', index: true },
  category: { type: String, enum: CATEGORIES, required: true, default: 'other', index: true },
  affectedAssets: { type: [{ type: String, trim: true, maxlength: 200 }], default: [] },
  assignedTo: { type: String, trim: true, maxlength: 120, default: null },
  source: { type: String, trim: true, maxlength: 120, default: 'manual' },
  tags: { type: [{ type: String, trim: true, lowercase: true, maxlength: 40 }], default: [] },
  openedAt: { type: Date, default: Date.now, immutable: true },
  resolvedAt: { type: Date, default: null },
  closedAt: { type: Date, default: null }
}, { timestamps: true, versionKey: '__v', strict: 'throw' });

incidentSchema.index({ severity: 1, status: 1, createdAt: -1 });

module.exports = {
  Incident: mongoose.model('Incident', incidentSchema),
  SEVERITIES,
  STATUSES,
  CATEGORIES
};
