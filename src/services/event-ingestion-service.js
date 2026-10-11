const { SecurityEvent } = require('../models/security-event');
const { normalizeEvent } = require('./event-normalizer');
const { httpError } = require('../utils/http-error');
const { buildListQuery } = require('./event-query');

async function ingestOne(input) {
  const normalized = normalizeEvent(input);
  if (normalized.sourceEventId) {
    const existing = await SecurityEvent.findOne({ source: normalized.source, sourceEventId: normalized.sourceEventId });
    if (existing) return { event: existing, duplicate: true };
  }
  try {
    const event = await SecurityEvent.create(normalized);
    return { event, duplicate: false };
  } catch (error) {
    if (error.code === 11000 && normalized.sourceEventId) {
      const existing = await SecurityEvent.findOne({ source: normalized.source, sourceEventId: normalized.sourceEventId });
      if (existing) return { event: existing, duplicate: true };
    }
    throw error;
  }
}

async function ingestBatch(events) {
  if (!Array.isArray(events) || events.length < 1 || events.length > 100) {
    throw httpError(400, 'INVALID_EVENT_BATCH', 'events must be an array containing between 1 and 100 events.');
  }
  const results = [];
  for (let index = 0; index < events.length; index += 1) {
    try {
      const result = await ingestOne(events[index]);
      results.push({ index, status: result.duplicate ? 'duplicate' : 'created', event: result.event });
    } catch (error) {
      results.push({ index, status: 'rejected', error: { code: error.code || 'EVENT_REJECTED', message: error.message } });
    }
  }
  return { results, summary: {
    received: events.length,
    created: results.filter((item) => item.status === 'created').length,
    duplicates: results.filter((item) => item.status === 'duplicate').length,
    rejected: results.filter((item) => item.status === 'rejected').length
  } };
}

async function listEvents(query) {
  const { page, limit, filter } = buildListQuery(query);
  const [items, total] = await Promise.all([
    SecurityEvent.find(filter).sort({ occurredAt: -1, _id: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    SecurityEvent.countDocuments(filter)
  ]);
  return { items, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
}

async function getEventById(id) {
  if (!/^[a-fA-F0-9]{24}$/.test(id)) throw httpError(400, 'INVALID_EVENT_ID', 'The event ID is not valid.');
  const event = await SecurityEvent.findById(id).lean();
  if (!event) throw httpError(404, 'EVENT_NOT_FOUND', 'The requested event was not found.');
  return event;
}

module.exports = { ingestOne, ingestBatch, listEvents, getEventById };
