const mongoose = require('mongoose');
const stepSchema = new mongoose.Schema({
  key: { type: String, required: true, trim: true, maxlength: 60 },
  title: { type: String, required: true, trim: true, maxlength: 160 },
  description: { type: String, required: true, trim: true, maxlength: 1000 },
  actionType: { type: String, required: true, enum: ['review', 'collect_context', 'notify', 'containment_simulation'] },
  required: { type: Boolean, default: true }
}, { _id: false, strict: 'throw' });
const playbookSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true, trim: true, lowercase: true, maxlength: 80 },
  name: { type: String, required: true, trim: true, maxlength: 160 },
  description: { type: String, required: true, trim: true, maxlength: 1000 },
  triggerLevels: { type: [{ type: String, enum: ['low', 'medium', 'high', 'critical'] }], required: true },
  steps: { type: [stepSchema], validate: value => value.length > 0 },
  enabled: { type: Boolean, default: true }
}, { timestamps: true, versionKey: '__v', strict: 'throw' });
module.exports = { Playbook: mongoose.models.Playbook || mongoose.model('Playbook', playbookSchema) };
