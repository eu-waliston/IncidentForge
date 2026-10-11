const { EVENT_TYPES, EVENT_SEVERITIES } = require('../models/security-event-constants');
const { httpError } = require('../utils/http-error');

const MAX_RAW_BYTES = 16 * 1024;
const TYPE_ALIASES = Object.freeze({ auth: 'authentication', login: 'authentication', endpoint: 'endpoint_alert', alert: 'endpoint_alert', firewall: 'network', access: 'data_access' });
const SEVERITY_ALIASES = Object.freeze({ warning: 'medium', warn: 'medium', informational: 'info', error: 'high', fatal: 'critical' });

function normalizeEvent(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw httpError(400, 'INVALID_EVENT', 'Each event must be a JSON object.');
  }
  const raw = JSON.stringify(input);
  if (Buffer.byteLength(raw, 'utf8') > MAX_RAW_BYTES) {
    throw httpError(413, 'EVENT_TOO_LARGE', 'An event payload cannot exceed 16 KB.');
  }
  const typeValue = input.eventType ?? input.type ?? input.event_type ?? 'other';
  const rawType = typeof typeValue === 'string' ? typeValue.trim().toLowerCase() : '';
  const eventType = TYPE_ALIASES[rawType] || rawType;
  if (!EVENT_TYPES.includes(eventType)) {
    throw httpError(400, 'INVALID_EVENT_TYPE', `eventType must be one of: ${EVENT_TYPES.join(', ')}.`);
  }
  const severityValue = input.severity ?? input.level ?? 'info';
  const rawSeverity = typeof severityValue === 'string' ? severityValue.trim().toLowerCase() : '';
  const severity = SEVERITY_ALIASES[rawSeverity] || rawSeverity;
  if (!EVENT_SEVERITIES.includes(severity)) {
    throw httpError(400, 'INVALID_EVENT_SEVERITY', `severity must be one of: ${EVENT_SEVERITIES.join(', ')}.`);
  }
  const sourceValue = input.source ?? input.provider;
  if (typeof sourceValue !== 'string' || !sourceValue.trim() || sourceValue.trim().length > 120) {
    throw httpError(400, 'INVALID_EVENT_SOURCE', 'source is required and must contain at most 120 characters.');
  }
  const messageValue = input.message ?? input.description;
  if (typeof messageValue !== 'string' || !messageValue.trim() || messageValue.trim().length > 4000) {
    throw httpError(400, 'INVALID_EVENT_MESSAGE', 'message is required and must contain at most 4000 characters.');
  }
  const occurredValue = input.occurredAt ?? input.timestamp ?? input.time ?? new Date().toISOString();
  const occurredAt = new Date(occurredValue);
  if (Number.isNaN(occurredAt.getTime())) throw httpError(400, 'INVALID_EVENT_TIMESTAMP', 'timestamp must be a valid date.');
  const sourceEventId = input.sourceEventId ?? input.externalId ?? input.event_id ?? null;
  if (sourceEventId !== null && (typeof sourceEventId !== 'string' || !sourceEventId.trim() || sourceEventId.length > 160)) {
    throw httpError(400, 'INVALID_SOURCE_EVENT_ID', 'sourceEventId must be a non-empty string of at most 160 characters.');
  }
  const assetValue = input.asset ?? input.hostname ?? input.host ?? null;
  const actorValue = input.actor ?? input.username ?? input.user ?? null;
  for (const [field, value, max] of [['asset', assetValue, 200], ['actor', actorValue, 200]]) {
    if (value !== null && (typeof value !== 'string' || value.trim().length > max)) {
      throw httpError(400, `INVALID_EVENT_${field.toUpperCase()}`, `${field} must be a string of at most ${max} characters or null.`);
    }
  }
  const tags = input.tags ?? [];
  if (!Array.isArray(tags) || tags.length > 30 || tags.some((tag) => typeof tag !== 'string' || !tag.trim() || tag.trim().length > 40)) {
    throw httpError(400, 'INVALID_EVENT_TAGS', 'tags must be an array of up to 30 non-empty strings (maximum 40 characters each).');
  }
  return {
    eventType, severity, source: sourceValue.trim(), sourceEventId: sourceEventId ? sourceEventId.trim() : null,
    occurredAt, asset: assetValue ? assetValue.trim() : null, actor: actorValue ? actorValue.trim() : null,
    message: messageValue.trim(), tags: [...new Set(tags.map((tag) => tag.trim().toLowerCase()))], rawPayload: input
  };
}

module.exports = { normalizeEvent, MAX_RAW_BYTES };
