const { httpError } = require('../utils/http-error');

const SEVERITY_POINTS = Object.freeze({ info: 0, low: 10, medium: 25, high: 45, critical: 60 });
const INCIDENT_POINTS = Object.freeze({ low: 10, medium: 25, high: 45, critical: 60 });
const RISK_LEVELS = Object.freeze([
  { max: 19, level: 'low' }, { max: 39, level: 'medium' },
  { max: 69, level: 'high' }, { max: 100, level: 'critical' }
]);
function classifyRisk(score) { return RISK_LEVELS.find(item => score <= item.max).level; }
function calculateRisk({ severity = 'info', correlationScore = 0, eventCount = 1, incidentSeverity = null }) {
  if (!(severity in SEVERITY_POINTS)) throw httpError(400, 'INVALID_SEVERITY', 'Unsupported event severity.');
  if (!Number.isFinite(correlationScore) || correlationScore < 0 || correlationScore > 100) throw httpError(400, 'INVALID_CORRELATION_SCORE', 'correlationScore must be between 0 and 100.');
  if (!Number.isInteger(eventCount) || eventCount < 1 || eventCount > 10000) throw httpError(400, 'INVALID_EVENT_COUNT', 'eventCount must be an integer between 1 and 10000.');
  let raw = SEVERITY_POINTS[severity] + Math.min(20, Math.max(0, eventCount - 1) * 4) + Math.round(correlationScore * 0.2);
  if (incidentSeverity) {
    if (!(incidentSeverity in INCIDENT_POINTS)) throw httpError(400, 'INVALID_INCIDENT_SEVERITY', 'Unsupported incident severity.');
    raw = Math.max(raw, INCIDENT_POINTS[incidentSeverity]);
  }
  const score = Math.min(100, raw);
  return { score, level: classifyRisk(score), factors: [
    { factor: 'event_severity', points: SEVERITY_POINTS[severity] },
    { factor: 'event_cluster_size', points: Math.min(20, Math.max(0, eventCount - 1) * 4) },
    { factor: 'correlation_strength', points: Math.round(correlationScore * 0.2) },
    ...(incidentSeverity ? [{ factor: 'incident_severity_floor', points: INCIDENT_POINTS[incidentSeverity] }] : [])
  ] };
}
async function assessEvent(eventId) {
  const { SecurityEvent } = require('../models/security-event');
  const { Correlation } = require('../models/correlation');
  if (!/^[a-f\d]{24}$/i.test(String(eventId))) throw httpError(400, 'INVALID_EVENT_ID', 'A valid event id is required.');
  const event = await SecurityEvent.findById(eventId).lean();
  if (!event) throw httpError(404, 'EVENT_NOT_FOUND', 'Security event not found.');
  const related = await SecurityEvent.find({ _id: { $ne: event._id }, $or: [
    ...(event.asset ? [{ asset: event.asset }] : []), ...(event.actor ? [{ actor: event.actor }] : [])
  ], occurredAt: { $gte: new Date(new Date(event.occurredAt).getTime() - 60 * 60 * 1000), $lte: new Date(new Date(event.occurredAt).getTime() + 60 * 60 * 1000) } }).select('severity').limit(100).lean();
  const correlations = await Correlation.find({ $or: [{ anchorEventId: event._id }, { 'links.eventId': event._id }] }).select('score').limit(100).lean();
  const correlationScore = correlations.length ? Math.max(...correlations.map(item => item.score)) : 0;
  const assessment = calculateRisk({ severity: event.severity, correlationScore, eventCount: related.length + 1 });
  return { data: { eventId: String(event._id), assessedAt: new Date().toISOString(), ...assessment, context: { relatedEventCount: related.length, correlationCount: correlations.length }, disclaimer: 'Risk score is a triage aid, not a confirmed finding.' } };
}
module.exports = { SEVERITY_POINTS, RISK_LEVELS, classifyRisk, calculateRisk, assessEvent };
