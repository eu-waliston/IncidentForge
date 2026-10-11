const ALLOWED_TRANSITIONS = Object.freeze({
  new: ['triaged'],
  triaged: ['investigating'],
  investigating: ['contained', 'resolved'],
  contained: ['investigating', 'resolved'],
  resolved: ['investigating', 'closed'],
  closed: []
});

function canTransition(from, to) {
  return Boolean(ALLOWED_TRANSITIONS[from]?.includes(to));
}

function assertTransition(from, to) {
  if (!canTransition(from, to)) {
    const error = new Error(`Invalid incident status transition: ${from} -> ${to}`);
    error.statusCode = 409;
    error.code = 'INVALID_STATUS_TRANSITION';
    throw error;
  }
}

module.exports = { ALLOWED_TRANSITIONS, canTransition, assertTransition };
