import nodemailer from 'nodemailer';
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
  visitRequestedHtml,
  visitStatusHtml,
  inquiryReplyHtml,
} from './emailTemplates.js';

/**
 * Transactional email. Uses SMTP when SMTP_USER and SMTP_PASS are configured;
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
 * and report the outcome (`sent`, `stubbed`, or `error`).
 */
const transporter = env.SMTP_USER && env.SMTP_PASS
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

export const isMailerConfigured = () => transporter !== null;

const send = async ({ to, subject, html, replyTo }) => {
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
  Cancelled: 'Your application was cancelled',
  Returned: 'Your adoption has ended',
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
      appUrl: env.APP_URL,
      cancelledByApplicant,
      pickupAt,
      pickupEmail,
    }),
  });

export const sendApplicationAutoRejectedEmail = async ({ to, name, petName, reason }) =>
  send({
    to,
    subject: 'Update on your application',
    html: applicationAutoRejectedHtml({ name, petName, reason, appUrl: env.APP_URL }),
  });

/* ------------------------------------------------------------------ *
 * Visit scheduling thread notifications (fire-and-forget)
 * ------------------------------------------------------------------ */

export const sendVisitRequestedEmail = async ({ to, name, petName, preferredSlot }) =>
  send({
    to,
    subject: `New visit request for ${petName}`,
    html: visitRequestedHtml({ name, petName, preferredSlot }),
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
    html: visitStatusHtml({ name, petName, status, slot, reason, appUrl: env.APP_URL }),
  });

/* ------------------------------------------------------------------ *
 * Shelter inquiry replies (sent once per inquiry, tracked in the DB)
 * ------------------------------------------------------------------ */

export const sendInquiryReplyEmail = async ({
  to,
  name,
  petName,
  petId,
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
      petId,
      appUrl: env.APP_URL,
    }),
    replyTo: shelterEmail,
  });
