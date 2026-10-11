const { SEVERITIES, STATUSES, CATEGORIES } = require('../models/incident-constants');
const { httpError } = require('./http-error');

function requireObjectId(id) {
  if (typeof id !== 'string' || !/^[a-fA-F0-9]{24}$/.test(id)) {
    throw httpError(400, 'INVALID_INCIDENT_ID', 'The incident ID is not valid.');
  }
}
function requirePlainObject(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw httpError(400, 'INVALID_BODY', 'The request body must be a JSON object.');
  }
}
function rejectUnknownFields(body, allowedFields) {
  const unknown = Object.keys(body).filter((key) => !allowedFields.includes(key));
  if (unknown.length) {
    throw httpError(400, 'UNKNOWN_FIELDS', `Unsupported field(s): ${unknown.join(', ')}`);
  }
}
function validateEnum(value, allowed, field) {
  if (value !== undefined && !allowed.includes(value)) {
    throw httpError(400, `INVALID_${field.toUpperCase()}`, `${field} must be one of: ${allowed.join(', ')}.`);
  }
}
function parsePagination(query) {
  const page = query.page === undefined ? 1 : Number(query.page);
  const limit = query.limit === undefined ? 20 : Number(query.limit);
  if (!Number.isInteger(page) || page < 1) throw httpError(400, 'INVALID_PAGE', 'page must be a positive integer.');
  if (!Number.isInteger(limit) || limit < 1 || limit > 100) throw httpError(400, 'INVALID_LIMIT', 'limit must be an integer between 1 and 100.');
  return { page, limit };
}
function validateIncidentFields(body, { partial = false } = {}) {
  requirePlainObject(body);
  const allowed = ['title', 'description', 'severity', 'category', 'affectedAssets', 'assignedTo', 'source', 'tags'];
  rejectUnknownFields(body, allowed);
  if (!partial && (!Object.hasOwn(body, 'title') || !Object.hasOwn(body, 'description'))) {
    throw httpError(400, 'MISSING_REQUIRED_FIELDS', 'title and description are required.');
  }
  validateEnum(body.severity, SEVERITIES, 'severity');
  validateEnum(body.category, CATEGORIES, 'category');
  if (body.title !== undefined && (typeof body.title !== 'string' || body.title.trim().length < 5 || body.title.trim().length > 160)) {
    throw httpError(400, 'INVALID_TITLE', 'title must contain between 5 and 160 characters.');
  }
  if (body.description !== undefined && (typeof body.description !== 'string' || body.description.trim().length < 10 || body.description.trim().length > 5000)) {
    throw httpError(400, 'INVALID_DESCRIPTION', 'description must contain between 10 and 5000 characters.');
  }
  for (const field of ['affectedAssets', 'tags']) {
    if (body[field] !== undefined && (!Array.isArray(body[field]) || body[field].length > 50 || body[field].some((item) => typeof item !== 'string' || !item.trim()))) {
      throw httpError(400, `INVALID_${field.toUpperCase()}`, `${field} must be an array of up to 50 non-empty strings.`);
    }
  }
  for (const field of ['assignedTo', 'source']) {
    if (body[field] !== undefined && body[field] !== null && (typeof body[field] !== 'string' || body[field].trim().length > 120)) {
      throw httpError(400, `INVALID_${field.toUpperCase()}`, `${field} must be a string of at most 120 characters or null.`);
    }
  }
  return body;
}
function validateListQuery(query) {
  const allowed = ['page', 'limit', 'severity', 'status', 'category', 'assignedTo', 'tag', 'sort'];
  rejectUnknownFields(query, allowed);
  const pagination = parsePagination(query);
  validateEnum(query.severity, SEVERITIES, 'severity');
  validateEnum(query.status, STATUSES, 'status');
  validateEnum(query.category, CATEGORIES, 'category');
  const sort = query.sort || 'newest';
  if (!['newest', 'oldest', 'severity'].includes(sort)) {
    throw httpError(400, 'INVALID_SORT', 'sort must be newest, oldest, or severity.');
  }
  return { ...pagination, severity: query.severity, status: query.status, category: query.category,
    assignedTo: query.assignedTo, tag: query.tag, sort };
}
module.exports = { requireObjectId, requirePlainObject, rejectUnknownFields, validateEnum, parsePagination, validateIncidentFields, validateListQuery };
