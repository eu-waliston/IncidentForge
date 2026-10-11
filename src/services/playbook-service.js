const { Playbook } = require('../models/playbook');
const { PlaybookRun } = require('../models/playbook-run');
const { httpError } = require('../utils/http-error');
const { assessEvent } = require('./risk-engine');

const { DEFAULT_PLAYBOOKS } = require('./playbook-catalog');
async function ensureDefaults() {
  for (const item of DEFAULT_PLAYBOOKS) await Playbook.updateOne({ key: item.key }, { $setOnInsert: item }, { upsert: true });
}
async function listPlaybooks() { await ensureDefaults(); return { data: await Playbook.find({ enabled: true }).sort({ key: 1 }).lean() }; }
async function runPlaybook(key, input = {}) {
  if (!/^[a-z0-9-]{3,80}$/.test(String(key))) throw httpError(400, 'INVALID_PLAYBOOK_KEY', 'Invalid playbook key.');
  const actor = typeof input.actor === 'string' ? input.actor.trim() : '';
  if (!actor || actor.length > 120) throw httpError(400, 'INVALID_ACTOR', 'actor is required and must be at most 120 characters.');
  if (input.mode && input.mode !== 'simulation') throw httpError(400, 'UNSUPPORTED_EXECUTION_MODE', 'Only simulation mode is supported.');
  await ensureDefaults();
  const playbook = await Playbook.findOne({ key, enabled: true }).lean();
  if (!playbook) throw httpError(404, 'PLAYBOOK_NOT_FOUND', 'Enabled playbook not found.');
  let risk = input.risk;
  if (input.eventId) risk = (await assessEvent(input.eventId)).data;
  if (!risk || !Number.isInteger(risk.score) || risk.score < 0 || risk.score > 100 || !['low', 'medium', 'high', 'critical'].includes(risk.level)) {
    throw httpError(400, 'RISK_ASSESSMENT_REQUIRED', 'Provide a valid risk assessment or an eventId to assess.');
  }
  if (!playbook.triggerLevels.includes(risk.level)) throw httpError(409, 'PLAYBOOK_TRIGGER_NOT_MET', 'Risk level does not meet this playbook trigger.');
  const now = new Date();
  const steps = playbook.steps.map(step => ({ key: step.key, status: 'simulated', note: `Simulation only: ${step.actionType} was not executed against any external system.`, completedAt: now }));
  const run = await PlaybookRun.create({ playbookKey: playbook.key, eventId: input.eventId || null, riskScore: risk.score, riskLevel: risk.level, actor, mode: 'simulation', status: 'simulated', steps });
  return { data: run.toObject(), warning: 'All steps are simulated. No external action was executed.' };
}
async function listRuns(query = {}) {
  const page = Number(query.page || 1); const limit = Number(query.limit || 20);
  if (!Number.isInteger(page) || page < 1 || page > 100000) throw httpError(400, 'INVALID_PAGE', 'page must be a positive integer.');
  if (!Number.isInteger(limit) || limit < 1 || limit > 100) throw httpError(400, 'INVALID_LIMIT', 'limit must be between 1 and 100.');
  const filter = {};
  if (query.playbookKey) filter.playbookKey = String(query.playbookKey);
  if (query.status) { if (!['simulated', 'failed'].includes(query.status)) throw httpError(400, 'INVALID_STATUS', 'Unsupported run status.'); filter.status = query.status; }
  const [data, total] = await Promise.all([PlaybookRun.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(), PlaybookRun.countDocuments(filter)]);
  return { data, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
}
module.exports = { DEFAULT_PLAYBOOKS, ensureDefaults, listPlaybooks, runPlaybook, listRuns };
