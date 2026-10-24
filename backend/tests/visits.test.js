import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { VISIT_TRANSITIONS } from '../src/repositories/visitRepository.js';

describe('visit request status transitions (no database required)', () => {
  it('a requested visit can be approved (confirmed) or declined (cancelled)', () => {
    assert.deepEqual([...VISIT_TRANSITIONS.requested].sort(), ['cancelled', 'confirmed']);
  });

  it('a confirmed visit can be completed or cancelled', () => {
    assert.deepEqual([...VISIT_TRANSITIONS.confirmed].sort(), ['cancelled', 'completed']);
  });

  it('completed and cancelled are terminal', () => {
    assert.deepEqual(VISIT_TRANSITIONS.completed, []);
    assert.deepEqual(VISIT_TRANSITIONS.cancelled, []);
  });
});
