const SEVERITIES = Object.freeze(['low', 'medium', 'high', 'critical']);
const STATUSES = Object.freeze(['new', 'triaged', 'investigating', 'contained', 'resolved', 'closed']);
const CATEGORIES = Object.freeze(['malware', 'unauthorized_access', 'data_exposure', 'phishing', 'denial_of_service', 'policy_violation', 'other']);
module.exports = { SEVERITIES, STATUSES, CATEGORIES };
