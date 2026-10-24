/**
 * HTML templates for the shelter onboarding emails (received / approved / rejected).
 *
 * Layout rules that keep the design intact in real inboxes:
 *  - Table-based markup with INLINE styles only. Gmail strips <style> blocks in
 *    several contexts and Outlook ignores external CSS, so inline styles on
 *    tables are the only layout that renders consistently everywhere.
 *  - A single <style> block is used solely for the mobile media query; if a
 *    client drops it, the inline styles still hold the design together.
 *  - Every dynamic value (name, shelter name, reason, URLs) is HTML-escaped
 *    before interpolation so user input can never inject markup.
 */

const BRAND = {
  // Matches the app's --brand colour (Tailwind orange-600 family).
  accent: '#ea580c',
  accentSoft: '#fff7ed',
  accentInk: '#9a3412',
  ink: '#111827',
  body: '#374151',
  muted: '#6b7280',
  line: '#e5e7eb',
  page: '#f4f5f7',
};

export const escapeHtml = (value) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const paragraph = (text) =>
  `<p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:${BRAND.body};">${text}</p>`;

/** Orange pill button — table wrapper + inline styles so every client paints it. */
const button = (href, label) => `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:4px 0 8px;">
        <tr>
          <td align="center" bgcolor="${BRAND.accent}" style="background-color:${BRAND.accent};border-radius:999px;">
            <a href="${escapeHtml(href)}" style="display:inline-block;padding:13px 28px;font-size:15px;font-weight:bold;color:#ffffff;text-decoration:none;border-radius:999px;">${escapeHtml(label)}</a>
          </td>
        </tr>
      </table>`;

/** Soft callout box (rejection reason). */
const note = (inner) => `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 16px;border-collapse:separate;">
        <tr>
          <td style="background-color:${BRAND.accentSoft};border:1px solid #fed7aa;border-radius:8px;padding:12px 16px;font-size:14px;line-height:1.6;color:${BRAND.accentInk};">${inner}</td>
        </tr>
      </table>`;

/**
 * Page shell: grey page background, white rounded card, orange accent bar,
 * brand header, headline, body content, divider and footer.
 */
export const renderEmail = ({ preheader, title, content, footer }) => `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="color-scheme" content="light" />
    <meta name="supported-color-schemes" content="light" />
    <title>${escapeHtml(title)}</title>
    <style>
      @media only screen and (max-width: 600px) {
        .email-card { width: 100% !important; }
        .email-pad { padding-left: 20px !important; padding-right: 20px !important; }
      }
    </style>
  </head>
  <body style="margin:0;padding:0;background-color:${BRAND.page};font-family:Arial,Helvetica,sans-serif;-webkit-text-size-adjust:100%;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;mso-hide:all;">${escapeHtml(preheader)}</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${BRAND.page}" style="background-color:${BRAND.page};border-collapse:collapse;">
      <tr>
        <td align="center" style="padding:32px 16px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="email-card" style="max-width:560px;background-color:#ffffff;border:1px solid ${BRAND.line};border-radius:12px;border-collapse:separate;overflow:hidden;">
            <tr>
              <td style="height:6px;background-color:${BRAND.accent};font-size:0;line-height:0;">&nbsp;</td>
            </tr>
            <tr>
              <td class="email-pad" style="padding:24px 32px 0;">
                <span style="display:inline-block;width:10px;height:10px;border-radius:50%;background-color:${BRAND.accent};margin-right:8px;vertical-align:middle;"></span>
                <span style="font-size:15px;font-weight:bold;color:${BRAND.ink};vertical-align:middle;">Paws&amp;Homes</span>
              </td>
            </tr>
            <tr>
              <td class="email-pad" style="padding:14px 32px 6px;">
                <h1 style="margin:0;font-size:23px;line-height:1.3;font-weight:bold;color:${BRAND.ink};">${escapeHtml(title)}</h1>
              </td>
            </tr>
            <tr>
              <td class="email-pad" style="padding:8px 32px 4px;">
                ${content}
              </td>
            </tr>
            <tr>
              <td class="email-pad" style="padding:20px 32px 28px;border-top:1px solid ${BRAND.line};font-size:12px;line-height:1.6;color:${BRAND.muted};">
                ${footer ?? 'You are receiving this email because a shelter application was submitted on Paws&amp;Homes.'}<br />
                &copy; ${new Date().getFullYear()} Paws&amp;Homes
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

/** "We received your shelter application" — submission acknowledgement. */
export const applicationReceivedHtml = ({ name }) =>
  renderEmail({
    preheader:
      'Thanks for registering your shelter on Paws&Homes — our team is reviewing your details.',
    title: 'We received your shelter application',
    content: [
      paragraph(`Hi ${escapeHtml(name)},`),
      paragraph(
        'Thanks for registering your shelter on Paws&amp;Homes. Our team is reviewing your details and will email you again once your account is approved.',
      ),
      paragraph('You will be able to sign in after approval.'),
    ].join('\n                '),
  });

/** "Your shelter account is approved" — includes the sign-in CTA. */
export const shelterApprovedHtml = ({ name, shelterName, loginUrl }) =>
  renderEmail({
    preheader: `${shelterName} has been approved — sign in to start managing your listings.`,
    title: 'Your shelter account is approved',
    content: [
      paragraph(`Hi ${escapeHtml(name)},`),
      paragraph(
        `Great news — <strong>${escapeHtml(shelterName)}</strong> has been approved and your account is now active as the shelter owner.`,
      ),
      paragraph('You can sign in and start managing your shelter listings:'),
      button(loginUrl, 'Sign in to Paws&Homes'),
    ].join('\n                '),
  });

/** "Update on your shelter application" — rejection with an optional reason. */
export const shelterRejectedHtml = ({ name, reason }) =>
  renderEmail({
    preheader: 'An update on your shelter application.',
    title: 'Update on your shelter application',
    content: [
      paragraph(`Hi ${escapeHtml(name)},`),
      paragraph(
        'After reviewing your shelter application, we are unable to approve it at this time.',
      ),
      reason ? note(`<strong>Reason:</strong> ${escapeHtml(reason)}`) : '',
      paragraph('You are welcome to reply to this email with more details.'),
    ]
      .filter(Boolean)
      .join('\n                '),
  });

/* ------------------------------------------------------------------ *
 * Adoption application / pet status emails
 * ------------------------------------------------------------------ */

const STATUS_CHIPS = {
  Submitted: ['#e0f2fe', '#075985'],
  'Under Review': ['#fef3c7', '#92400e'],
  Approved: ['#dcfce7', '#166534'],
  Adopted: ['#dbeafe', '#1e40af'],
  Rejected: ['#fee2e2', '#991b1b'],
  Cancelled: ['#f3f4f6', '#4b5563'],
  Returned: ['#fef3c7', '#92400e'],
  Closed: ['#f3f4f6', '#4b5563'],
};

/** Status pill shown at the top of every application-status email. */
const chip = (label, background, ink) => `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 16px;">
        <tr>
          <td style="display:inline-block;background-color:${background};color:${ink};font-size:12px;font-weight:bold;letter-spacing:0.04em;text-transform:uppercase;padding:5px 12px;border-radius:999px;">${escapeHtml(label)}</td>
        </tr>
      </table>`;

const chipFor = (status) => {
  const [background, ink] = STATUS_CHIPS[status] ?? STATUS_CHIPS.Closed;
  return chip(status, background, ink);
};

const applicationsUrl = (appUrl) => `${appUrl}/applications`;
const visitsUrl = (appUrl) => `${appUrl}/visits`;

/** New visit request received from an adopter (to the shelter contact). */
export const visitRequestedHtml = ({ name, petName, preferredSlot }) =>
  renderEmail({
    preheader: `${name} requested a visit with ${petName}.`,
    title: 'New visit request',
    content: [
      chipFor('Requested'),
      paragraph(`Hi shelter team,`),
      paragraph(
        `<strong>${escapeHtml(name)}</strong> would like to schedule a visit with <strong>${escapeHtml(petName)}</strong>.`,
      ),
      paragraph(`<strong>Preferred slot:</strong> ${escapeHtml(preferredSlot)}`),
      paragraph(
        'Approve or decline this request from your visits dashboard. The adopter will be emailed automatically with your decision.',
      ),
    ].join('\n                '),
  });

const VISIT_STATUS_TITLES = {
  confirmed: 'Your visit is confirmed',
  completed: 'Thanks for visiting',
  cancelled: 'Update on your visit request',
};

/** Visit status change (to the adopter). */
export const visitStatusHtml = ({ name, petName, status, slot, reason, appUrl }) =>
  renderEmail({
    preheader: `Your visit with ${petName} is now ${String(status).toLowerCase()}.`,
    title: VISIT_STATUS_TITLES[status] ?? 'Update on your visit',
    content: [
      chipFor(status),
      paragraph(`Hi ${escapeHtml(name)},`),
      paragraph(
        `Your visit with <strong>${escapeHtml(petName)}</strong> is now <strong>${escapeHtml(status)}</strong>.`,
      ),
      slot ? paragraph(`<strong>When:</strong> ${escapeHtml(slot)}`) : '',
      reason ? note(`<strong>Note from the shelter:</strong> ${escapeHtml(reason)}`) : '',
      paragraph('You can check the status of this request on your visits page.'),
      button(visitsUrl(appUrl), 'View your visits'),
    ]
      .filter(Boolean)
      .join('\n                '),
  });

/** Applicant submitted an application — acknowledgement with a tracking CTA. */
export const applicationSubmittedHtml = ({ name, petName, appUrl }) =>
  renderEmail({
    preheader: `Thanks for applying to adopt ${petName} — the shelter is reviewing your application.`,
    title: 'We received your application',
    content: [
      chipFor('Submitted'),
      paragraph(`Hi ${escapeHtml(name)},`),
      paragraph(
        `Thanks for applying to adopt <strong>${escapeHtml(petName)}</strong>. The shelter team is reviewing your application and will email you again as soon as its status changes.`,
      ),
      paragraph('You can follow its progress from your applications page.'),
      button(applicationsUrl(appUrl), 'Track your application'),
    ].join('\n                '),
  });

/** Shelter moved the application to Under Review. */
export const applicationUnderReviewHtml = ({ name, petName, appUrl }) =>
  renderEmail({
    preheader: `Your application to adopt ${petName} is now under review.`,
    title: 'Your application is under review',
    content: [
      chipFor('Under Review'),
      paragraph(`Hi ${escapeHtml(name)},`),
      paragraph(
        `The shelter has started reviewing your application for <strong>${escapeHtml(petName)}</strong>.`,
      ),
      paragraph('We will email you again as soon as there is a decision.'),
      button(applicationsUrl(appUrl), 'Track your application'),
    ].join('\n                '),
  });

const DECISION_TITLES = {
  Approved: 'Your application was approved',
  Adopted: 'Your adoption is complete',
  Rejected: 'Update on your application',
  Cancelled: 'Your application was cancelled',
  Returned: 'Your adoption has ended',
};

/** "Monday, November 2, 2026 at 10:00 AM" — the clinic appointment as scheduled. */
const formatPickup = (value) => {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};

/** Pickup appointment + contact address, shown on the approval email. */
const pickupNotice = (pickupAt, pickupEmail) => {
  const when = formatPickup(pickupAt);
  if (!when) return '';
  const contact = pickupEmail
    ? `<br /><strong>Clinic email:</strong> <a href="mailto:${escapeHtml(pickupEmail)}" style="color:${BRAND.accentInk};">${escapeHtml(pickupEmail)}</a>`
    : '';
  return note(`<strong>Pickup scheduled:</strong> ${escapeHtml(when)}${contact}`);
};

const DECISION_COPY = {
  Approved: (petName, { pickupScheduled = false } = {}) =>
    pickupScheduled
      ? `Great news — your application to adopt <strong>${petName}</strong> has been approved! Your pickup at the clinic is scheduled below.`
      : `Great news — your application to adopt <strong>${petName}</strong> has been approved! The shelter will get in touch with you to arrange the next steps.`,
  Adopted: (petName) =>
    `<strong>${petName}</strong> has been adopted — thank you for giving them a home. Your application is now complete.`,
  Rejected: (petName) =>
    `After reviewing your application for <strong>${petName}</strong>, the shelter is unable to move forward with it this time.`,
  Cancelled: (petName) =>
    `Your application to adopt <strong>${petName}</strong> has been cancelled. You can apply again whenever you are ready.`,
  Returned: (petName) =>
    `<strong>${petName}</strong> has been returned to the shelter, so your adoption has ended. ${petName} is available for adoption again.`,
};

/** Final decision on an application: Approved / Adopted / Rejected. */
export const applicationDecisionHtml = ({
  name,
  petName,
  status,
  note: staffNote,
  appUrl,
  /** Adopter withdrew it themselves, so the note is theirs, not the shelter's. */
  cancelledByApplicant = false,
  /** Scheduled clinic pickup (approval only). */
  pickupAt = null,
  pickupEmail = null,
}) => {
  const copy = DECISION_COPY[status];
  if (!copy) {
    throw new Error(`Unsupported application decision: ${status}`);
  }
  const pickup = status === 'Approved' ? pickupNotice(pickupAt, pickupEmail) : '';
  const noteLabel =
    status === 'Cancelled' && cancelledByApplicant ? 'Your note' : 'From the shelter';
  return renderEmail({
    preheader: `Your application for ${petName} is now ${String(status).toLowerCase()}.`,
    title: DECISION_TITLES[status],
    content: [
      chipFor(status),
      paragraph(`Hi ${escapeHtml(name)},`),
      paragraph(copy(escapeHtml(petName), { pickupScheduled: Boolean(pickup) })),
      pickup,
      staffNote
        ? note(`<strong>${noteLabel}:</strong> ${escapeHtml(staffNote)}`)
        : '',
      paragraph('You can review this application any time from your applications page.'),
      button(applicationsUrl(appUrl), 'View your application'),
    ]
      .filter(Boolean)
      .join('\n                '),
  });
};

/** Competing application auto-closed because another adopter won (or the pet was adopted). */
export const applicationAutoRejectedHtml = ({ name, petName, reason, appUrl }) =>
  renderEmail({
    preheader: `Update on your application for ${petName}.`,
    title: 'Update on your application',
    content: [
      chipFor('Closed'),
      paragraph(`Hi ${escapeHtml(name)},`),
      paragraph(
        `Your application to adopt <strong>${escapeHtml(petName)}</strong> has been closed automatically.`,
      ),
      reason ? note(escapeHtml(reason)) : '',
      paragraph(
        'Plenty of pets are still looking for a home — we would love to see you apply again.',
      ),
      button(`${appUrl}/pets`, 'Browse other pets'),
    ]
      .filter(Boolean)
      .join('\n                '),
  });

/** Shelter reply to a direct inquiry (to the adopter). */
export const inquiryReplyHtml = ({
  name,
  petName,
  shelterName,
  message,
  petId,
  appUrl,
}) =>
  renderEmail({
    preheader: `${shelterName} replied to your inquiry about ${petName}.`,
    title: `Reply from ${shelterName}`,
    content: [
      paragraph(`Hi ${escapeHtml(name)},`),
      paragraph(
        `You received a message from <strong>${escapeHtml(shelterName)}</strong> about your inquiry for <strong>${escapeHtml(petName)}</strong>:`,
      ),
      note(escapeHtml(message).replace(/\r?\n/g, '<br />')),
      paragraph('Reply to this email to contact the shelter directly.'),
      button(`${appUrl}/pets/${petId}`, `View ${petName}`),
    ].join('\n                '),
    footer:
      'You are receiving this email because you sent an inquiry about a pet on Paws&amp;Homes.',
  });
