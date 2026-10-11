import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';

process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'postgresql://postgres:postgres@localhost:5432/pet_adoption_test';
process.env.JWT_SECRET = 'test-secret-at-least-16-chars';
// Force the mailer into stub mode: an empty key survives dotenv (which only
// fills missing vars) and is falsy, so no Resend client is built. No network.
process.env.RESEND_API_KEY = '';

let mailer;

before(async () => {
  mailer = await import('../src/services/mailerService.js');
});

describe('mailerService (stub mode, no RESEND_API_KEY)', () => {
  it('isMailerConfigured() is false without a key', () => {
    assert.equal(mailer.isMailerConfigured(), false);
  });

  it('sendApplicationReceivedEmail resolves stubbed without throwing', async () => {
    const result = await mailer.sendApplicationReceivedEmail({
      to: 'applicant@example.com',
      name: 'Test Shelter',
    });
    assert.equal(result.sent, false);
    assert.equal(result.stubbed, true);
  });

  it('sendShelterApprovedEmail resolves stubbed without throwing', async () => {
    const result = await mailer.sendShelterApprovedEmail({
      to: 'applicant@example.com',
      name: 'Test Shelter',
      shelterName: 'Test Shelter',
    });
    assert.equal(result.sent, false);
    assert.equal(result.stubbed, true);
  });

  it('sendShelterRejectedEmail resolves stubbed without throwing', async () => {
    const result = await mailer.sendShelterRejectedEmail({
      to: 'applicant@example.com',
      name: 'Test Shelter',
      reason: 'Missing documents',
    });
    assert.equal(result.sent, false);
    assert.equal(result.stubbed, true);
  });
});
