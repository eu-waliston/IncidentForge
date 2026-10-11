const test = require('node:test');
const assert = require('node:assert/strict');
const { DEFAULT_PLAYBOOKS } = require('../src/services/playbook-catalog');

test('default playbooks contain only safe, non-executing action types', () => {
  const allowed = new Set(['review', 'collect_context', 'notify', 'containment_simulation']);
  assert.equal(DEFAULT_PLAYBOOKS.length, 2);
  for (const playbook of DEFAULT_PLAYBOOKS) {
    assert.ok(playbook.steps.length > 0);
    for (const step of playbook.steps) assert.ok(allowed.has(step.actionType));
  }
});
test('containment playbook step is explicitly a simulation', () => {
  const step = DEFAULT_PLAYBOOKS.flatMap(item => item.steps).find(item => item.key === 'simulate-containment');
  assert.equal(step.actionType, 'containment_simulation');
  assert.match(step.description, /without changing any real system/i);
});
