import nodemailer from 'nodemailer';
import { appUrl, env } from '../config/env.js';
import { logger } from '../utils/logger.js';
import {
  applicationReceivedHtml,
  applicationSubmittedHtml,
  applicationUnderReviewHtml,
  applicationDecisionHtml,
  applicationAutoRejectedHtml,
  shelterApprovedHtml,
  shelterRejectedHtml,
  visitRequestedHtml,
  visitStatusHtml,
  inquiryReplyHtml,
  loginOtpEmailHtml,
  signupOtpEmailHtml,
  passwordResetEmailHtml,
} from './emailTemplates.js';

/**
 * Transactional email. Uses Brevo HTTPS when selected or a key is set
 * in auto mode. Otherwise uses SMTP when SMTP_USER and SMTP_PASS are configured;
 * otherwise logs the message so the approval workflow still works in local
 * development.
 *
 * Gmail example (backend/.env):
 *   SMTP_HOST=smtp.gmail.com
 *   SMTP_PORT=587
 *   SMTP_SECURE=false
 *   SMTP_USER=you@gmail.com
 *   SMTP_PASS=your-16-char-google-app-password
 *
 * Gmail requires an App Password (Google Account → Security → 2-Step
 * Verification → App passwords); your normal account password will not work.
 * MAIL_FROM is optional and defaults to SMTP_USER.
 *
 * Never throws: always resolves to a status object so callers can persist
 * and report the outcome (`sent`, `stubbed`, or `error`). Verification flows
 * require successful delivery and turn failures into an actionable API error.
 */
const useBrevo = env.EMAIL_PROVIDER === 'brevo' ||
  (env.EMAIL_PROVIDER === 'auto' && Boolean(env.BREVO_API_KEY));
const transporter = !useBrevo && env.SMTP_USER && env.SMTP_PASS
  ? nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_SECURE,
      auth: {
        user: env.SMTP_USER,
        // Google shows app passwords grouped with spaces; strip them.
        pass: env.SMTP_PASS.replace(/\s+/g, ''),
      },
    })
  : null;

const mailFrom = env.MAIL_FROM || env.SMTP_USER;

const brevoSender = () => {
  const value = env.MAIL_FROM?.trim() || '';
  const match = value.match(/^([^<>]+)\s*<([^<>]+)>$/);
  const email = (match ? match[2] : value).trim();
  if (!/^[^\s<>@]+@[^\s<>@]+\.[^\s<>@]+$/.test(email)) return null;
  return { email, ...(match ? { name: match[1].trim() } : {}) };
};

export const isMailerConfigured = () => useBrevo
  ? Boolean(env.BREVO_API_KEY && !env.BREVO_API_KEY.startsWith('xsmtpsib-') && brevoSender())
  : transporter !== null;

const send = async ({ to, subject, html, replyTo }) => {
  if (useBrevo) {
    try {
      if (!isMailerConfigured()) {
        throw new Error('Brevo requires BREVO_API_KEY (not an SMTP key) and a valid MAIL_FROM sender.');
      }
      const response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: { 'api-key': env.BREVO_API_KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sender: brevoSender(), to: [{ email: to }], subject, htmlContent: html,
          ...(replyTo ? { replyTo: { email: replyTo } } : {}),
        }),
        signal: AbortSignal.timeout(15000),
      });
      const data = await response.json();
      if (!response.ok || !data.messageId) {
        // Do not log provider response bodies, which can echo request data.
        throw new Error(`Brevo rejected email (HTTP ${response.status}). Check Brevo transactional logs and sender verification.`);
      }
      return { sent: true, stubbed: false, id: data.messageId };
    } catch (error) {
      logger.error('Failed to send email via Brevo:', error);
      return { sent: false, stubbed: false, error };
    }
  }
  if (!transporter) {
    logger.info(`[mailer:stub] To: ${to} | Subject: ${subject}`);
    return { sent: false, stubbed: true };
  }
  try {
    const info = await transporter.sendMail({
      from: mailFrom,
      to,
      subject,
      html,
      ...(replyTo ? { replyTo } : {}),
    });
    return { sent: true, stubbed: false, id: info.messageId ?? null };
  } catch (err) {
    // Email failures must never block the approval transaction's response.
    logger.error('Failed to send email:', err);
    return { sent: false, stubbed: false, error: err };
  }
};

export const sendApplicationReceivedEmail = async ({ to, name }) =>
  send({
    to,
    subject: 'We received your shelter application',
    html: applicationReceivedHtml({ name }),
  });

export const sendShelterApprovedEmail = async ({ to, name, shelterName, message }) =>
  send({
    to,
    subject: 'Your shelter account is approved 🎉',
    html: shelterApprovedHtml({
      name,
      shelterName,
      message,
      loginUrl: appUrl,
    }),
  });

export const sendShelterRejectedEmail = async ({ to, name, reason }) =>
  send({
    to,
    subject: 'Update on your shelter application',
    html: shelterRejectedHtml({ name, reason }),
  });

/* ------------------------------------------------------------------ *
 * Adoption application / pet status notifications
 * All fire-and-forget: callers never await, so a mail failure can never
 * fail the status update that triggered it.
 * ------------------------------------------------------------------ */

const DECISION_SUBJECTS = {
  Approved: 'Your application was approved 🎉',
  Adopted: 'Your adoption is complete',
  Rejected: 'Update on your application',
  Cancelled: 'Your application was cancelled',
  Returned: 'Your adoption has ended',
};

export const sendApplicationSubmittedEmail = async ({ to, name, petName }) =>
  send({
    to,
    subject: 'We received your application',
    html: applicationSubmittedHtml({ name, petName, appUrl }),
  });

export const sendApplicationUnderReviewEmail = async ({ to, name, petName }) =>
  send({
    to,
    subject: 'Your application is under review',
    html: applicationUnderReviewHtml({ name, petName, appUrl }),
  });

export const sendApplicationDecisionEmail = async ({
  to,
  name,
  petName,
  status,
  note,
  cancelledByApplicant = false,
  pickupAt,
  pickupEmail,
}) =>
  send({
    to,
    subject: DECISION_SUBJECTS[status] ?? 'Update on your application',
    html: applicationDecisionHtml({
      name,
      petName,
      status,
      note,
      appUrl,
      cancelledByApplicant,
      pickupAt,
      pickupEmail,
    }),
  });

export const sendApplicationAutoRejectedEmail = async ({ to, name, petName, reason }) =>
  send({
    to,
    subject: 'Update on your application',
    html: applicationAutoRejectedHtml({ name, petName, reason, appUrl }),
  });

/* ------------------------------------------------------------------ *
 * Visit scheduling thread notifications (fire-and-forget)
 * ------------------------------------------------------------------ */

export const sendVisitRequestedEmail = async ({ to, name, petName, preferredSlot, reason }) =>
  send({
    to,
    subject: `New visit request for ${petName}`,
    html: visitRequestedHtml({ name, petName, preferredSlot, reason }),
  });

const VISIT_STATUS_SUBJECTS = {
  confirmed: 'Your visit is confirmed 🎉',
  completed: 'Thanks for visiting',
  cancelled: 'Update on your visit request',
};

export const sendVisitStatusEmail = async ({ to, name, petName, status, slot, reason }) =>
  send({
    to,
    subject: VISIT_STATUS_SUBJECTS[status] ?? 'Update on your visit',
    html: visitStatusHtml({ name, petName, status, slot, reason, appUrl }),
  });

/* ------------------------------------------------------------------ *
 * Shelter inquiry replies (sent once per inquiry, tracked in the DB)
 * ------------------------------------------------------------------ */

export const sendInquiryReplyEmail = async ({
  to,
  name,
  petName,
  shelterName,
  shelterEmail,
  subject,
  message,
}) =>
  send({
    to,
    subject,
    html: inquiryReplyHtml({
      name,
      petName,
      shelterName,
      message,
      appUrl,
    }),
    replyTo: shelterEmail,
  });

/* ------------------------------------------------------------------ *
 * Login MFA OTP email (sent when suspicious / new location is detected)
 * ------------------------------------------------------------------ */

export const sendLoginOtpEmail = async ({ to, name, code, locationDisplay, ipAddress }) =>
  send({
    to,
    subject: `Your Paws&Homes verification code: ${code}`,
    html: loginOtpEmailHtml({ name, code, locationDisplay, ipAddress }),
  });

/* ------------------------------------------------------------------ *
 * Signup Email Verification OTP email
 * ------------------------------------------------------------------ */

export const sendSignupOtpEmail = async ({ to, name, code }) =>
  send({
    to,
    subject: `Verify your email for Paws&Homes: ${code}`,
    html: signupOtpEmailHtml({ name, code }),
  });

/* ------------------------------------------------------------------ *
 * Password reset OTP email
 * ------------------------------------------------------------------ */

export const sendPasswordResetEmail = async ({ to, name, code }) =>
  send({
    to,
    subject: `Reset your Paws&Homes password: ${code}`,
    html: passwordResetEmailHtml({ name, code }),
  });


