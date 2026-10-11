const DEFAULT_PLAYBOOKS = Object.freeze([
  { key: 'phishing-triage', name: 'Phishing triage', description: 'Structured review of a suspected phishing event.', triggerLevels: ['medium', 'high', 'critical'], steps: [
    { key: 'review-message', title: 'Review reported message', description: 'Inspect sender, headers and URL indicators using approved tooling.', actionType: 'review', required: true },
    { key: 'collect-context', title: 'Collect related context', description: 'Gather related events and affected asset context.', actionType: 'collect_context', required: true },
    { key: 'notify-owner', title: 'Notify responsible analyst', description: 'Prepare a notification for the incident owner; do not send automatically.', actionType: 'notify', required: true }
  ] },
  { key: 'endpoint-alert', name: 'Endpoint alert triage', description: 'Safe triage flow for an endpoint security alert.', triggerLevels: ['high', 'critical'], steps: [
    { key: 'validate-alert', title: 'Validate alert context', description: 'Review alert source, timestamp and confidence.', actionType: 'review', required: true },
    { key: 'collect-host-context', title: 'Collect host context', description: 'Record host and user context for investigation.', actionType: 'collect_context', required: true },
    { key: 'simulate-containment', title: 'Simulate containment decision', description: 'Record a proposed containment action without changing any real system.', actionType: 'containment_simulation', required: true }
  ] }
]);
module.exports = { DEFAULT_PLAYBOOKS };
