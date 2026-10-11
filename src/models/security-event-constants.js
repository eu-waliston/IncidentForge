const EVENT_TYPES = Object.freeze([
  'authentication', 'endpoint_alert', 'network', 'malware', 'policy', 'data_access', 'system', 'other'
]);
const EVENT_SEVERITIES = Object.freeze(['info', 'low', 'medium', 'high', 'critical']);
module.exports = { EVENT_TYPES, EVENT_SEVERITIES };
