const { EVENT_TYPES, EVENT_SEVERITIES } = require('../models/security-event-constants');
const { httpError } = require('../utils/http-error');

function buildListQuery(query) {
  const allowed = ['page', 'limit', 'eventType', 'severity', 'source', 'asset', 'from', 'to', 'incidentId'];
  const unknown = Object.keys(query).filter((key) => !allowed.includes(key));
  if (unknown.length) throw httpError(400, 'UNKNOWN_QUERY_FIELDS', `Unsupported query field(s): ${unknown.join(', ')}`);
  const page = query.page === undefined ? 1 : Number(query.page);
  const limit = query.limit === undefined ? 20 : Number(query.limit);
  if (!Number.isInteger(page) || page < 1) throw httpError(400, 'INVALID_PAGE', 'page must be a positive integer.');
  if (!Number.isInteger(limit) || limit < 1 || limit > 100) throw httpError(400, 'INVALID_LIMIT', 'limit must be an integer between 1 and 100.');
  if (query.incidentId && !/^[a-fA-F0-9]{24}$/.test(query.incidentId)) throw httpError(400, 'INVALID_INCIDENT_ID', 'incidentId filter must be a valid object ID.');
  if (query.eventType && !EVENT_TYPES.includes(query.eventType)) throw httpError(400, 'INVALID_EVENT_TYPE', 'eventType filter is invalid.');
  if (query.severity && !EVENT_SEVERITIES.includes(query.severity)) throw httpError(400, 'INVALID_EVENT_SEVERITY', 'severity filter is invalid.');
  const filter = {};
  for (const key of ['eventType', 'severity', 'source', 'asset', 'incidentId']) if (query[key]) filter[key] = query[key];
  if (query.from || query.to) {
    filter.occurredAt = {};
    if (query.from) { const from = new Date(query.from); if (Number.isNaN(from.getTime())) throw httpError(400, 'INVALID_FROM_DATE', 'from must be a valid date.'); filter.occurredAt.$gte = from; }
    if (query.to) { const to = new Date(query.to); if (Number.isNaN(to.getTime())) throw httpError(400, 'INVALID_TO_DATE', 'to must be a valid date.'); filter.occurredAt.$lte = to; }
    if (filter.occurredAt.$gte && filter.occurredAt.$lte && filter.occurredAt.$gte > filter.occurredAt.$lte) throw httpError(400, 'INVALID_DATE_RANGE', 'from must be earlier than or equal to to.');
  }
  return { page, limit, filter };
}
module.exports = { buildListQuery };
