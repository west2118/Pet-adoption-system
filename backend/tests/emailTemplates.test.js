import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'postgresql://postgres:postgres@localhost:5432/pet_adoption_test';
process.env.JWT_SECRET = 'test-secret-at-least-16-chars';
// Force the mailer into stub mode: no SMTP credentials, no network calls.
// `delete` alone is not enough — dotenv re-reads backend/.env when env.js
// loads, which would build a real SMTP transport inside the tests. An empty
// string keeps it stubbed (dotenv never overwrites an existing key).
process.env.SMTP_USER = '';
process.env.SMTP_PASS = '';

const {
  applicationReceivedHtml,
  applicationSubmittedHtml,
  applicationUnderReviewHtml,
  applicationDecisionHtml,
  applicationAutoRejectedHtml,
  shelterApprovedHtml,
  shelterRejectedHtml,
  inquiryReplyHtml,
  escapeHtml,
} = await import('../src/services/emailTemplates.js');

const mailer = await import('../src/services/mailerService.js');

const LOGIN_URL = 'http://localhost:5173/login';

const assertStyledShell = (html) => {
  // Full document + table-based shell with inline styles (Gmail-safe).
  assert.match(html, /^<!DOCTYPE html>/);
  assert.match(html, /role="presentation"/);
  assert.match(html, /style="/);
  assert.match(html, /background-color:#ea580c/); // brand accent bar
  assert.match(html, /Paws&amp;Homes/); // brand header
  // No external stylesheet or imported CSS — inline styles only.
  assert.doesNotMatch(html, /@import/);
  assert.doesNotMatch(html, /<link\b/i);
};

describe('emailTemplates (styled HTML)', () => {
  it('received email is a styled card with the original copy', () => {
    const html = applicationReceivedHtml({ name: 'Maria' });
    assertStyledShell(html);
    assert.match(html, /<h1[^>]*>We received your shelter application<\/h1>/);
    assert.match(html, /Hi Maria,/);
    assert.match(
      html,
      /Thanks for registering your shelter on Paws&amp;Homes\. Our team is reviewing your details/,
    );
    assert.match(html, /You will be able to sign in after approval\./);
    // Hidden preheader so the inbox preview is not just the subject.
    assert.match(html, /display:none;max-height:0/);
  });

  it('approved email carries the CTA button and styled headline', () => {
    const html = shelterApprovedHtml({
      name: 'Maria',
      shelterName: 'Happy Tails Shelter',
      loginUrl: LOGIN_URL,
    });
    assertStyledShell(html);
    assert.match(html, /<h1[^>]*>Your shelter account is approved<\/h1>/);
    assert.match(html, /<strong>Happy Tails Shelter<\/strong>/);
    assert.match(html, new RegExp(`href="${LOGIN_URL}"`));
    assert.match(html, /display:inline-block;padding:13px 28px/); // pill button
    assert.match(html, /Sign in to Paws&amp;Homes/);
  });

  it('rejected email renders the reason callout only when a reason exists', () => {
    const withReason = shelterRejectedHtml({ name: 'Maria', reason: 'Missing documents' });
    assertStyledShell(withReason);
    assert.match(withReason, /<strong>Reason:<\/strong> Missing documents/);
    assert.match(withReason, /background-color:#fff7ed/); // callout box

    const withoutReason = shelterRejectedHtml({ name: 'Maria', reason: undefined });
    assertStyledShell(withoutReason);
    assert.doesNotMatch(withoutReason, /Reason:/);
  });

  it('escapes user-supplied values instead of injecting markup', () => {
    const payload = '<img src=x onerror="alert(1)">';
    const html = applicationReceivedHtml({ name: payload });
    assert.doesNotMatch(html, /<img src=x/);
    assert.match(html, /&lt;img src=x/);

    const rejected = shelterRejectedHtml({ name: 'Maria', reason: payload });
    assert.doesNotMatch(rejected, /<img src=x/);
    assert.match(rejected, /&lt;img src=x/);

    assert.equal(escapeHtml("O'Brien & Co"), 'O&#39;Brien &amp; Co');
  });
});

describe('application status emails (styled HTML)', () => {
  const APP_URL = 'http://localhost:5173';

  it('submission confirmation is styled and links to the applications page', () => {
    const html = applicationSubmittedHtml({
      name: 'Maria',
      petName: 'Simba',
      appUrl: APP_URL,
    });
    assertStyledShell(html);
    assert.match(html, /<h1[^>]*>We received your application<\/h1>/);
    assert.match(html, /Submitted/); // status chip
    assert.match(html, /<strong>Simba<\/strong>/);
    assert.match(html, new RegExp(`href="${APP_URL}/applications"`));
    assert.match(html, /Track your application/);
  });

  it('under-review email uses its own chip, title and copy', () => {
    const html = applicationUnderReviewHtml({
      name: 'Maria',
      petName: 'Simba',
      appUrl: APP_URL,
    });
    assertStyledShell(html);
    assert.match(html, /<h1[^>]*>Your application is under review<\/h1>/);
    assert.match(html, /Under Review/);
    assert.match(html, /started reviewing your application for <strong>Simba<\/strong>/);
  });

  it('decision email renders Approved / Adopted / Rejected variants', () => {
    const approved = applicationDecisionHtml({
      name: 'Maria',
      petName: 'Simba',
      status: 'Approved',
      note: 'Pick-up this Saturday.',
      appUrl: APP_URL,
    });
    assertStyledShell(approved);
    assert.match(approved, /<h1[^>]*>Your application was approved<\/h1>/);
    assert.match(approved, /background-color:#dcfce7/); // green chip
    assert.match(approved, /<strong>From the shelter:<\/strong> Pick-up this Saturday\./);

    const adopted = applicationDecisionHtml({
      name: 'Maria',
      petName: 'Simba',
      status: 'Adopted',
      appUrl: APP_URL,
    });
    assertStyledShell(adopted);
    assert.match(adopted, /<h1[^>]*>Your adoption is complete<\/h1>/);
    assert.doesNotMatch(adopted, /From the shelter:/); // no note → no callout

    const rejected = applicationDecisionHtml({
      name: 'Maria',
      petName: 'Simba',
      status: 'Rejected',
      note: 'Housing constraints',
      appUrl: APP_URL,
    });
    assertStyledShell(rejected);
    assert.match(rejected, /<h1[^>]*>Update on your application<\/h1>/);
    assert.match(rejected, /background-color:#fee2e2/); // red chip

    const cancelled = applicationDecisionHtml({
      name: 'Maria',
      petName: 'Simba',
      status: 'Cancelled',
      note: 'Found a closer match',
      appUrl: APP_URL,
      cancelledByApplicant: true,
    });
    assertStyledShell(cancelled);
    assert.match(cancelled, /<h1[^>]*>Your application was cancelled<\/h1>/);
    assert.match(cancelled, /has been cancelled/);
    assert.match(cancelled, /<strong>Your note:<\/strong> Found a closer match/);

    // Shelter cancelling an approved adoption: the note is theirs.
    const cancelledByShelter = applicationDecisionHtml({
      name: 'Maria',
      petName: 'Simba',
      status: 'Cancelled',
      note: 'The adoption could not proceed.',
      appUrl: APP_URL,
    });
    assertStyledShell(cancelledByShelter);
    assert.match(cancelledByShelter, /<strong>From the shelter:<\/strong> The adoption could not proceed\./);

    assert.throws(
      () => applicationDecisionHtml({ name: 'M', petName: 'S', status: 'Pending' }),
      /Unsupported application decision/,
    );
  });

  it('auto-closed email explains the reason and links to other pets', () => {
    const html = applicationAutoRejectedHtml({
      name: 'Maria',
      petName: 'Simba',
      reason: "Another adopter's application for this pet was accepted.",
      appUrl: APP_URL,
    });
    assertStyledShell(html);
    assert.match(html, /<h1[^>]*>Update on your application<\/h1>/);
    assert.match(html, /Closed/);
    assert.match(html, /has been closed automatically/);
    assert.match(html, /background-color:#fff7ed/); // reason callout
    assert.match(html, new RegExp(`href="${APP_URL}/pets"`));
    // Apostrophes in the reason are escaped, not injected.
    assert.match(html, /Another adopter&#39;s application/);
  });

  it('inquiry reply is styled, escapes the message and preserves line breaks', () => {
    const html = inquiryReplyHtml({
      name: 'Jane <Doe>',
      petName: 'Bruno',
      shelterName: 'Paws & Homes',
      message: 'Hello <script>alert(1)</script>\nSecond line',
      petId: 'pet-1',
      appUrl: APP_URL,
    });
    assertStyledShell(html);
    assert.match(html, /<h1[^>]*>Reply from Paws &amp; Homes<\/h1>/);
    assert.match(html, /Hi Jane &lt;Doe&gt;,/);
    assert.match(html, /Hello &lt;script&gt;alert\(1\)&lt;\/script&gt;<br \/>Second line/);
    assert.match(html, /href="http:\/\/localhost:5173\/pets\/pet-1"/);
    assert.match(html, /You are receiving this email because you sent an inquiry/);
    assert.doesNotMatch(html, /<script>/);
  });

  it('escapes pet names in every new template', () => {
    const payload = '<b>Simba</b>';
    const html = [
      applicationSubmittedHtml({ name: 'M', petName: payload, appUrl: APP_URL }),
      applicationUnderReviewHtml({ name: 'M', petName: payload, appUrl: APP_URL }),
      applicationDecisionHtml({
        name: 'M',
        petName: payload,
        status: 'Approved',
        appUrl: APP_URL,
      }),
      applicationAutoRejectedHtml({
        name: 'M',
        petName: payload,
        reason: payload,
        appUrl: APP_URL,
      }),
    ].join('');
    assert.doesNotMatch(html, /<b>Simba<\/b>/);
    assert.match(html, /&lt;b&gt;Simba&lt;\/b&gt;/);
  });

  it('new mailer senders resolve stubbed in test mode (no SMTP credentials)', async () => {
    assert.equal(mailer.isMailerConfigured(), false);

    const senders = [
      mailer.sendApplicationSubmittedEmail({
        to: 'a@example.com',
        name: 'Maria',
        petName: 'Simba',
      }),
      mailer.sendApplicationUnderReviewEmail({
        to: 'a@example.com',
        name: 'Maria',
        petName: 'Simba',
      }),
      mailer.sendApplicationDecisionEmail({
        to: 'a@example.com',
        name: 'Maria',
        petName: 'Simba',
        status: 'Approved',
        note: 'Pick-up Saturday',
      }),
      mailer.sendApplicationDecisionEmail({
        to: 'a@example.com',
        name: 'Maria',
        petName: 'Simba',
        status: 'Cancelled',
      }),
      mailer.sendApplicationAutoRejectedEmail({
        to: 'a@example.com',
        name: 'Maria',
        petName: 'Simba',
        reason: 'This pet has been adopted.',
      }),
    ];

    for (const result of await Promise.all(senders)) {
      assert.equal(result.sent, false);
      assert.equal(result.stubbed, true);
    }
  });
});
