import { Resend } from 'resend';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';
import {
  applicationReceivedHtml,
  applicationSubmittedHtml,
  applicationUnderReviewHtml,
  applicationDecisionHtml,
  applicationAutoRejectedHtml,
  shelterApprovedHtml,
  shelterRejectedHtml,
} from './emailTemplates.js';

/**
 * Transactional email. Uses Resend when RESEND_API_KEY is configured; otherwise
 * logs the message so the approval workflow still works in local development.
 *
 * NOTE: Resend's default `onboarding@resend.dev` sender only delivers to the
 * Resend account owner's address. For real applicant mail, verify a custom
 * domain in Resend and set MAIL_FROM accordingly.
 *
 * Never throws: always resolves to a status object so callers can persist
 * and report the outcome (`sent`, `stubbed`, or `error`).
 */
const resend = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null;

export const isMailerConfigured = () => resend !== null;

const send = async ({ to, subject, html }) => {
  if (!resend) {
    logger.info(`[mailer:stub] To: ${to} | Subject: ${subject}`);
    return { sent: false, stubbed: true };
  }
  try {
    // The Resend SDK resolves (not rejects) API errors as `{ data, error }`.
    const result = await resend.emails.send({ from: env.MAIL_FROM, to, subject, html });
    if (result?.error) {
      logger.error('Failed to send email:', result.error);
      return { sent: false, stubbed: false, error: result.error };
    }
    return { sent: true, stubbed: false, id: result?.data?.id ?? null };
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

export const sendShelterApprovedEmail = async ({ to, name, shelterName }) =>
  send({
    to,
    subject: 'Your shelter account is approved 🎉',
    html: shelterApprovedHtml({
      name,
      shelterName,
      loginUrl: `${env.APP_URL}/login`,
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
};

export const sendApplicationSubmittedEmail = async ({ to, name, petName }) =>
  send({
    to,
    subject: 'We received your application',
    html: applicationSubmittedHtml({ name, petName, appUrl: env.APP_URL }),
  });

export const sendApplicationUnderReviewEmail = async ({ to, name, petName }) =>
  send({
    to,
    subject: 'Your application is under review',
    html: applicationUnderReviewHtml({ name, petName, appUrl: env.APP_URL }),
  });

export const sendApplicationDecisionEmail = async ({ to, name, petName, status, note }) =>
  send({
    to,
    subject: DECISION_SUBJECTS[status] ?? 'Update on your application',
    html: applicationDecisionHtml({ name, petName, status, note, appUrl: env.APP_URL }),
  });

export const sendApplicationAutoRejectedEmail = async ({ to, name, petName, reason }) =>
  send({
    to,
    subject: 'Update on your application',
    html: applicationAutoRejectedHtml({ name, petName, reason, appUrl: env.APP_URL }),
  });
