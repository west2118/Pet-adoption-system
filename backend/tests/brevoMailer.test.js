import { test } from 'node:test';
import assert from 'node:assert/strict';

process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'postgresql://postgres:postgres@localhost:5432/pet_adoption_test';
process.env.JWT_SECRET = 'test-secret-at-least-16-chars';
process.env.EMAIL_PROVIDER = 'brevo';
process.env.BREVO_API_KEY = 'test_brevo_api_key';
process.env.MAIL_FROM = 'Paws&Homes <noreply@example.com>';

const mailer = await import('../src/services/mailerService.js');
const { env } = await import('../src/config/env.js');

test('Brevo HTTPS delivery and failures', async (t) => {
  await t.test('sends OTP over HTTPS with server credentials', async (t) => {
    t.mock.method(globalThis, 'fetch', async (url, options) => {
      assert.equal(url, 'https://api.brevo.com/v3/smtp/email');
      assert.equal(options.method, 'POST');
      assert.equal(options.headers['api-key'], 'test_brevo_api_key');
      assert.ok(options.signal instanceof AbortSignal);
      const body = JSON.parse(options.body);
      assert.deepEqual(body.sender, { email: 'noreply@example.com', name: 'Paws&Homes' });
      assert.deepEqual(body.to, [{ email: 'adopter@example.com' }]);
      assert.match(body.htmlContent, /123456/);
      return { ok: true, json: async () => ({ messageId: 'email-123' }) };
    });
    assert.equal(mailer.isMailerConfigured(), true);
    assert.deepEqual(await mailer.sendSignupOtpEmail({
      to: 'adopter@example.com', name: 'Jane', code: '123456',
    }), { sent: true, stubbed: false, id: 'email-123' });
  });

  await t.test('preserves reply-to for inquiry emails', async (t) => {
    t.mock.method(globalThis, 'fetch', async (_url, options) => {
      assert.equal(JSON.parse(options.body).replyTo.email, 'shelter@example.com');
      return { ok: true, json: async () => ({ messageId: 'reply-123' }) };
    });
    const result = await mailer.sendInquiryReplyEmail({
      to: 'adopter@example.com', name: 'Jane', petName: 'Bruno',
      petId: 'pet-1', shelterName: 'Shelter', shelterEmail: 'shelter@example.com',
      subject: 'Reply', message: 'Hello',
    });
    assert.equal(result.sent, true);
  });

  for (const failure of ['rejected', 'network', 'malformed']) {
    await t.test(`reports ${failure} without claiming delivery`, async (t) => {
      t.mock.method(globalThis, 'fetch', async () => {
        if (failure === 'network') throw new Error('Connection timed out');
        return {
          ok: failure === 'malformed', status: 403,
          json: async () => ({ name: 'validation_error' }),
        };
      });
      const result = await mailer.sendLoginOtpEmail({
        to: 'adopter@example.com', name: 'Jane', code: '123456',
      });
      assert.equal(result.sent, false);
      assert.equal(result.stubbed, false);
      assert.ok(result.error instanceof Error);
    });
  }

  await t.test('missing key fails without falling back to SMTP or stub', async (t) => {
    const original = env.BREVO_API_KEY;
    const fetchMock = t.mock.method(globalThis, 'fetch', async () => assert.fail('Unexpected network request'));
    try {
      env.BREVO_API_KEY = '';
      assert.equal(mailer.isMailerConfigured(), false);
      const result = await mailer.sendSignupOtpEmail({ to: 'a@example.com', name: 'Jane', code: '123456' });
      assert.equal(result.sent, false);
      assert.equal(result.stubbed, false);
      assert.equal(fetchMock.mock.callCount(), 0);
    } finally {
      env.BREVO_API_KEY = original;
    }
  });
});

