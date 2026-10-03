import { Resend } from 'resend';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

/**
 * Transactional email. Uses Resend when RESEND_API_KEY is configured; otherwise
 * logs the message so the approval workflow still works in local development.
 */
const resend = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null;

const send = async ({ to, subject, html }) => {
  if (!resend) {
    logger.info(`[mailer:stub] To: ${to} | Subject: ${subject}`);
    return { stubbed: true };
  }
  try {
    const result = await resend.emails.send({ from: env.MAIL_FROM, to, subject, html });
    return result;
  } catch (err) {
    // Email failures must never block the approval transaction's response.
    logger.error('Failed to send email:', err);
    return { error: true };
  }
};

export const sendApplicationReceivedEmail = async ({ to, name }) =>
  send({
    to,
    subject: 'We received your shelter application',
    html: `
      <p>Hi ${name},</p>
      <p>Thanks for registering your shelter on Paws&amp;Homes. Our team is reviewing
      your details and will email you again once your account is approved.</p>
      <p>You will be able to sign in after approval.</p>
    `,
  });

export const sendShelterApprovedEmail = async ({ to, name, shelterName }) =>
  send({
    to,
    subject: 'Your shelter account is approved 🎉',
    html: `
      <p>Hi ${name},</p>
      <p>Great news — <strong>${shelterName}</strong> has been approved and your account
      is now active as the shelter owner.</p>
      <p>You can sign in and start managing your shelter listings:</p>
      <p><a href="${env.APP_URL}/login">Sign in to Paws&amp;Homes</a></p>
    `,
  });

export const sendShelterRejectedEmail = async ({ to, name, reason }) =>
  send({
    to,
    subject: 'Update on your shelter application',
    html: `
      <p>Hi ${name},</p>
      <p>After reviewing your shelter application, we are unable to approve it at this
      time.</p>
      ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}
      <p>You are welcome to reply to this email with more details.</p>
    `,
  });
