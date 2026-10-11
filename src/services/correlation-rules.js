const { createHash } = require('node:crypto');
const { httpError } = require('../utils/http-error');
const MAX_WINDOW_MINUTES = 10080;

function fingerprintFor(anchorId, eventIds, windowMinutes) {
  const canonical = [String(anchorId), ...eventIds.map(String).sort(), String(windowMinutes)].join('|');
  return createHash('sha256').update(canonical).digest('hex');
}


function validateOptions(input = {}) {
  const allowed = ['windowMinutes', 'minScore', 'limit'];
  const unknown = Object.keys(input).filter((key) => !allowed.includes(key));
  if (unknown.length) throw httpError(400, 'UNKNOWN_CORRELATION_OPTIONS', `Unsupported option(s): ${unknown.join(', ')}`);
  const windowMinutes = input.windowMinutes === undefined ? 60 : Number(input.windowMinutes);
  const minScore = input.minScore === undefined ? 20 : Number(input.minScore);
  const limit = input.limit === undefined ? 50 : Number(input.limit);
  if (!Number.isInteger(windowMinutes) || windowMinutes < 1 || windowMinutes > MAX_WINDOW_MINUTES) throw httpError(400, 'INVALID_WINDOW', `windowMinutes must be between 1 and ${MAX_WINDOW_MINUTES}.`);
  if (!Number.isInteger(minScore) || minScore < 0 || minScore > 100) throw httpError(400, 'INVALID_MIN_SCORE', 'minScore must be an integer between 0 and 100.');
  if (!Number.isInteger(limit) || limit < 1 || limit > 100) throw httpError(400, 'INVALID_LIMIT', 'limit must be an integer between 1 and 100.');
  return { windowMinutes, minScore, limit };
}


function sharedReasons(anchor, candidate, windowMinutes) {
  const reasons = [];
  if (anchor.asset && candidate.asset && anchor.asset.toLowerCase() === candidate.asset.toLowerCase()) reasons.push('shared_asset');
  if (anchor.actor && candidate.actor && anchor.actor.toLowerCase() === candidate.actor.toLowerCase()) reasons.push('shared_actor');
  const anchorTags = new Set((anchor.tags || []).map((tag) => String(tag).toLowerCase()));
  if ((candidate.tags || []).some((tag) => anchorTags.has(String(tag).toLowerCase()))) reasons.push('shared_tag');
  const delta = Math.abs(new Date(anchor.occurredAt).getTime() - new Date(candidate.occurredAt).getTime());
  if (delta <= windowMinutes * 60_000) reasons.push('temporal_proximity');
  if (anchor.eventType === candidate.eventType) reasons.push('same_event_type');
  return reasons;
}

function scoreReasons(reasons, anchor, candidate, windowMinutes) {
  let score = 0;
  if (reasons.includes('shared_asset')) score += 35;
  if (reasons.includes('shared_actor')) score += 30;
  if (reasons.includes('shared_tag')) score += 15;
  if (reasons.includes('same_event_type')) score += 5;
  if (reasons.includes('temporal_proximity')) {
    const deltaMinutes = Math.abs(new Date(anchor.occurredAt).getTime() - new Date(candidate.occurredAt).getTime()) / 60000;
    score += Math.round(15 * Math.max(0, 1 - deltaMinutes / windowMinutes));
  }
  return Math.min(100, score);
}

module.exports = { sharedReasons, scoreReasons, validateOptions, fingerprintFor };
