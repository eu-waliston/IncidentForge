const mongoose = require('mongoose');
const stepResultSchema = new mongoose.Schema({
  key: { type: String, required: true }, status: { type: String, enum: ['simulated', 'skipped'], required: true },
  note: { type: String, required: true, maxlength: 300 }, completedAt: { type: Date, required: true }
}, { _id: false, strict: 'throw' });
const playbookRunSchema = new mongoose.Schema({
  playbookKey: { type: String, required: true, index: true },
  eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'SecurityEvent', default: null, index: true },
  riskScore: { type: Number, required: true, min: 0, max: 100 },
  riskLevel: { type: String, enum: ['low', 'medium', 'high', 'critical'], required: true },
  mode: { type: String, enum: ['simulation'], default: 'simulation', immutable: true },
  actor: { type: String, required: true, trim: true, maxlength: 120 },
  status: { type: String, enum: ['simulated', 'failed'], default: 'simulated' },
  steps: { type: [stepResultSchema], default: [] }
}, { timestamps: true, versionKey: '__v', strict: 'throw' });
module.exports = { PlaybookRun: mongoose.models.PlaybookRun || mongoose.model('PlaybookRun', playbookRunSchema) };
