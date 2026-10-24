import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { signWaiverSchema } from '../src/validators/waiverValidator.js';

describe('e-waiver signing validation', () => {
  it('accepts a typed legal name with explicit consent', () => {
    const result = signWaiverSchema.safeParse({
      signatureName: '  Jordan Avery  ',
      consent: true,
    });
    assert.equal(result.success, true);
    assert.equal(result.data.signatureName, 'Jordan Avery');
  });

  it('rejects a signature without consent', () => {
    const result = signWaiverSchema.safeParse({
      signatureName: 'Jordan Avery',
      consent: false,
    });
    assert.equal(result.success, false);
    assert.match(result.error.issues[0].message, /agree/i);
  });

  it('rejects a name that is too short', () => {
    const result = signWaiverSchema.safeParse({ signatureName: 'J', consent: true });
    assert.equal(result.success, false);
    assert.match(result.error.issues[0].message, /full legal name/i);
  });
});
