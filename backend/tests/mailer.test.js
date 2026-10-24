import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';

process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'postgresql://postgres:postgres@localhost:5432/pet_adoption_test';
process.env.JWT_SECRET = 'test-secret-at-least-16-chars';
// Force the mailer into stub mode: empty credentials survive dotenv (which
// only fills missing vars) and are falsy, so no SMTP transport is built.
// No network.
process.env.SMTP_USER = '';
process.env.SMTP_PASS = '';

let mailer;

before(async () => {
  mailer = await import('../src/services/mailerService.js');
});

describe('mailerService (stub mode, no SMTP credentials)', () => {
  it('isMailerConfigured() is false without credentials', () => {
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

  it('sendInquiryReplyEmail resolves stubbed without throwing', async () => {
    const result = await mailer.sendInquiryReplyEmail({
      to: 'adopter@example.com',
      name: 'Jane Doe',
      petName: 'Bruno',
      petId: 'pet-1',
      shelterName: 'Happy Tails',
      shelterEmail: 'shelter@example.com',
      subject: 'Re: your inquiry about Bruno',
      message: 'Thanks for reaching out.',
    });
    assert.equal(result.sent, false);
    assert.equal(result.stubbed, true);
  });
});
