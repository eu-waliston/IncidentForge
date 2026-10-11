const { SecurityEvent } = require('../models/security-event');
const { Correlation } = require('../models/correlation');
const { httpError } = require('../utils/http-error');
const { sharedReasons, scoreReasons, validateOptions, fingerprintFor } = require('./correlation-rules');

const MAX_CANDIDATES = 250;

async function correlateEvent(eventId, options = {}) {
  const opts = validateOptions(options);
  if (!/^[a-fA-F0-9]{24}$/.test(String(eventId))) throw httpError(400, 'INVALID_EVENT_ID', 'eventId must be a valid object ID.');
  const anchor = await SecurityEvent.findById(eventId).lean();
  if (!anchor) throw httpError(404, 'EVENT_NOT_FOUND', 'Security event was not found.');
  const time = new Date(anchor.occurredAt).getTime();
  const candidates = await SecurityEvent.find({
    _id: { $ne: anchor._id },
    occurredAt: { $gte: new Date(time - opts.windowMinutes * 60000), $lte: new Date(time + opts.windowMinutes * 60000) }
  }).sort({ occurredAt: 1 }).limit(MAX_CANDIDATES).lean();
  const links = candidates.map((candidate) => {
    const reasons = sharedReasons(anchor, candidate, opts.windowMinutes);
    const score = scoreReasons(reasons, anchor, candidate, opts.windowMinutes);
    return { candidate, reasons, score };
  }).filter((item) => item.reasons.some((reason) => ['shared_asset', 'shared_actor', 'shared_tag'].includes(reason)) && item.score >= opts.minScore)
    .sort((a, b) => b.score - a.score || new Date(a.candidate.occurredAt) - new Date(b.candidate.occurredAt))
    .slice(0, opts.limit);
  if (!links.length) return { data: null, meta: { anchorEventId: String(anchor._id), candidatesExamined: candidates.length, matches: 0 } };
  const eventIds = links.map((item) => item.candidate._id);
  const allReasons = [...new Set(links.flatMap((item) => item.reasons))];
  const score = Math.round(links.reduce((sum, item) => sum + item.score, 0) / links.length);
  const fingerprint = fingerprintFor(anchor._id, eventIds, opts.windowMinutes);
  const record = await Correlation.findOneAndUpdate(
    { fingerprint },
    { $setOnInsert: {
      fingerprint, anchorEventId: anchor._id, windowMinutes: opts.windowMinutes, score, reasons: allReasons,
      links: links.map(({ candidate, reasons, score: linkScore }) => ({ eventId: candidate._id, eventType: candidate.eventType, occurredAt: candidate.occurredAt, score: linkScore, reasons }))
    } },
    { new: true, upsert: true, setDefaultsOnInsert: true, runValidators: true }
  ).lean();
  return { data: record, meta: { anchorEventId: String(anchor._id), candidatesExamined: candidates.length, matches: links.length, capped: candidates.length === MAX_CANDIDATES } };
}

async function listCorrelations(query = {}) {
  const allowed = ['page', 'limit', 'status', 'minScore', 'anchorEventId'];
  const unknown = Object.keys(query).filter((key) => !allowed.includes(key));
  if (unknown.length) throw httpError(400, 'UNKNOWN_QUERY_FIELDS', `Unsupported query field(s): ${unknown.join(', ')}`);
  const page = query.page === undefined ? 1 : Number(query.page);
  const limit = query.limit === undefined ? 20 : Number(query.limit);
  if (!Number.isInteger(page) || page < 1) throw httpError(400, 'INVALID_PAGE', 'page must be a positive integer.');
  if (!Number.isInteger(limit) || limit < 1 || limit > 100) throw httpError(400, 'INVALID_LIMIT', 'limit must be between 1 and 100.');
  const filter = {};
  if (query.status) {
    if (!['candidate', 'reviewed', 'dismissed'].includes(query.status)) throw httpError(400, 'INVALID_STATUS', 'status is invalid.');
    filter.status = query.status;
  }
  if (query.minScore !== undefined) {
    const minScore = Number(query.minScore);
    if (!Number.isInteger(minScore) || minScore < 0 || minScore > 100) throw httpError(400, 'INVALID_MIN_SCORE', 'minScore must be between 0 and 100.');
    filter.score = { $gte: minScore };
  }
  if (query.anchorEventId) {
    if (!/^[a-fA-F0-9]{24}$/.test(query.anchorEventId)) throw httpError(400, 'INVALID_EVENT_ID', 'anchorEventId must be a valid object ID.');
    filter.anchorEventId = query.anchorEventId;
  }
  const [data, total] = await Promise.all([
    Correlation.find(filter).sort({ score: -1, createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    Correlation.countDocuments(filter)
  ]);
  return { data, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
}

async function reviewCorrelation(id, body = {}) {
  if (!/^[a-fA-F0-9]{24}$/.test(String(id))) throw httpError(400, 'INVALID_CORRELATION_ID', 'Correlation ID must be a valid object ID.');
  const allowed = ['status', 'reviewedBy'];
  const unknown = Object.keys(body).filter((key) => !allowed.includes(key));
  if (unknown.length) throw httpError(400, 'UNKNOWN_REVIEW_FIELDS', `Unsupported field(s): ${unknown.join(', ')}`);
  if (!['reviewed', 'dismissed'].includes(body.status)) throw httpError(400, 'INVALID_REVIEW_STATUS', 'status must be reviewed or dismissed.');
  if (typeof body.reviewedBy !== 'string' || !body.reviewedBy.trim() || body.reviewedBy.trim().length > 120) throw httpError(400, 'INVALID_REVIEWER', 'reviewedBy must be a non-empty string up to 120 characters.');
  const record = await Correlation.findByIdAndUpdate(id, { $set: { status: body.status, reviewedBy: body.reviewedBy.trim(), reviewedAt: new Date() } }, { new: true, runValidators: true }).lean();
  if (!record) throw httpError(404, 'CORRELATION_NOT_FOUND', 'Correlation record was not found.');
  return record;
}

module.exports = { correlateEvent, listCorrelations, reviewCorrelation, validateOptions, fingerprintFor };
