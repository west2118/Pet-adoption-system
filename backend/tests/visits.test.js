import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { VISIT_TRANSITIONS } from '../src/repositories/visitRepository.js';

describe('visit thread status transitions (no database required)', () => {
  it('requested can move to proposed, confirmed, or cancelled', () => {
    assert.deepEqual([...VISIT_TRANSITIONS.requested].sort(), ['cancelled', 'confirmed', 'proposed']);
  });

  it('proposed can move to confirmed or cancelled', () => {
    assert.deepEqual([...VISIT_TRANSITIONS.proposed].sort(), ['cancelled', 'confirmed']);
  });

  it('confirmed can move to completed or cancelled', () => {
    assert.deepEqual([...VISIT_TRANSITIONS.confirmed].sort(), ['cancelled', 'completed']);
  });

  it('completed and cancelled are terminal', () => {
    assert.deepEqual(VISIT_TRANSITIONS.completed, []);
    assert.deepEqual(VISIT_TRANSITIONS.cancelled, []);
  });
});
