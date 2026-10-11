const { Incident } = require('../models/incident');
const { STATUSES } = require('../models/incident-constants');
const { assertTransition } = require('./incident-state');
const { httpError } = require('../utils/http-error');
const { requireObjectId, requirePlainObject, validateIncidentFields, validateListQuery, validateEnum } = require('../utils/validation');

async function createIncident(input) {
  validateIncidentFields(input);
  const incident = await Incident.create(input);
  return incident;
}
async function listIncidents(query) {
  const filters = validateListQuery(query);
  const mongoFilter = {};
  for (const field of ['severity', 'status', 'category']) if (filters[field]) mongoFilter[field] = filters[field];
  if (filters.assignedTo) mongoFilter.assignedTo = filters.assignedTo;
  if (filters.tag) mongoFilter.tags = filters.tag.trim().toLowerCase();
  const skip = (filters.page - 1) * filters.limit;
  const itemsPromise = filters.sort === 'severity'
    ? Incident.aggregate([
        { $match: mongoFilter },
        { $addFields: { severityRank: { $switch: { branches: [
          { case: { $eq: ['$severity', 'critical'] }, then: 4 },
          { case: { $eq: ['$severity', 'high'] }, then: 3 },
          { case: { $eq: ['$severity', 'medium'] }, then: 2 },
          { case: { $eq: ['$severity', 'low'] }, then: 1 }
        ], default: 0 } } } },
        { $sort: { severityRank: -1, createdAt: -1 } }, { $skip: skip }, { $limit: filters.limit },
        { $project: { severityRank: 0 } }
      ])
    : Incident.find(mongoFilter).sort(filters.sort === 'oldest' ? { createdAt: 1 } : { createdAt: -1 }).skip(skip).limit(filters.limit).lean();
  const [items, total] = await Promise.all([itemsPromise, Incident.countDocuments(mongoFilter)]);
  return { items, pagination: { page: filters.page, limit: filters.limit, total, pages: Math.ceil(total / filters.limit) } };
}
async function getIncident(id) {
  requireObjectId(id);
  const incident = await Incident.findById(id).lean();
  if (!incident) throw httpError(404, 'INCIDENT_NOT_FOUND', 'Incident not found.');
  return incident;
}
async function updateIncident(id, input) {
  requireObjectId(id);
  validateIncidentFields(input, { partial: true });
  if (!Object.keys(input).length) throw httpError(400, 'EMPTY_UPDATE', 'Provide at least one field to update.');
  const incident = await Incident.findByIdAndUpdate(id, { $set: input }, {
    new: true, runValidators: true, context: 'query'
  });
  if (!incident) throw httpError(404, 'INCIDENT_NOT_FOUND', 'Incident not found.');
  return incident;
}
async function transitionIncident(id, input) {
  requireObjectId(id);
  requirePlainObject(input);
  const keys = Object.keys(input);
  if (keys.some((key) => key !== 'status') || typeof input.status !== 'string') {
    throw httpError(400, 'INVALID_STATUS_BODY', 'The body must contain only a string status field.');
  }
  validateEnum(input.status, STATUSES, 'status');
  const incident = await Incident.findById(id);
  if (!incident) throw httpError(404, 'INCIDENT_NOT_FOUND', 'Incident not found.');
  assertTransition(incident.status, input.status);
  incident.status = input.status;
  if (input.status === 'resolved') incident.resolvedAt = new Date();
  if (input.status === 'closed') incident.closedAt = new Date();
  if (input.status === 'investigating') { incident.resolvedAt = null; incident.closedAt = null; }
  await incident.save();
  return incident;
}
module.exports = { createIncident, listIncidents, getIncident, updateIncident, transitionIncident };
