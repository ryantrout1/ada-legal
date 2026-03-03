
// Legacy email template functions — DEPRECATED
// All email sending now uses the EmailTemplate entity via renderEmailTemplate.
// This file is kept as a reference only. Do not import from here.
// See: components/emails/renderTemplate.js and entities/EmailTemplate.json

import { brandedEmail } from './brandedEmailTemplate';

const PORTAL_URL = ''; // Will be passed as param since we can't know the absolute URL at build time

function violationLabel(type) {
  return type === 'physical_space' ? 'Physical Space' : 'Digital / Website';
}

function prefLabel(pref) {
  if (pref === 'phone') return 'Phone';
  if (pref === 'email') return 'Email';
  return 'No Preference';
}

export function caseSubmittedEmail(c, portalUrl) {
  return brandedEmail({
    heading: 'Your Report Has Been Received',
    bodyHtml: `
      <p>Dear ${c.contact_name},</p>
      <p>Thank you for submitting your ADA violation report. Here is a summary:</p>
      <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
        <tr><td style="padding: 8px 8px 8px 0; color: #64748B; font-weight: 600; white-space: nowrap;">Violation Type</td><td style="padding: 8px;">${violationLabel(c.violation_type)}</td></tr>
        <tr><td style="padding: 8px 8px 8px 0; color: #64748B; font-weight: 600; white-space: nowrap;">Business</td><td style="padding: 8px;">${c.business_name}</td></tr>
        <tr><td style="padding: 8px 8px 8px 0; color: #64748B; font-weight: 600; white-space: nowrap;">Incident Date</td><td style="padding: 8px;">${c.incident_date}</td></tr>
        <tr><td style="padding: 8px 8px 8px 0; color: #64748B; font-weight: 600; white-space: nowrap;">Status</td><td style="padding: 8px;">Submitted — Pending Review</td></tr>
      </table>
      <p><strong>What happens next?</strong></p>
      <ol style="padding-left: 20px;">
        <li>Our team will review your report.</li>
        <li>If approved, your case will be made available to licensed ADA attorneys in your area.</li>
        <li>A matched attorney will reach out to you via your preferred contact method.</li>
      </ol>
    `,
    portalUrl,
    portalLabel: 'Track Your Case'
  });
}

export function caseApprovedEmail(c, portalUrl) {
  return brandedEmail({
    heading: 'Your Case Has Been Approved',
    headingColor: '#15803D',
    bodyHtml: `
      <p>Dear ${c.contact_name},</p>
      <p>Your ADA violation report regarding <strong>${c.business_name}</strong> has been reviewed and <strong>approved</strong>.</p>
      <p>Your case is now available for licensed ADA attorneys in your area to review. An attorney will reach out to you via your preferred contact method (<strong>${prefLabel(c.contact_preference)}</strong>).</p>
      <p><strong>What happens next?</strong></p>
      <ul style="padding-left: 20px;">
        <li>An attorney in your area will review your case details.</li>
        <li>Once an attorney initiates support, you will receive another email notification.</li>
        <li>The attorney will contact you after being assigned to your case.</li>
      </ul>
    `,
    portalUrl,
    portalLabel: 'View Your Case'
  });
}

export function caseRejectedEmail(c, reasonText, portalUrl) {
  const standardsGuideUrl = portalUrl ? portalUrl.replace('/MyCases', '/StandardsGuide') : '/StandardsGuide';
  const intakeUrl = portalUrl ? portalUrl.replace('/MyCases', '/Intake') : '/Intake';

  return brandedEmail({
    heading: 'Update on Your Report',
    headingColor: '#475569',
    bodyHtml: `
      <p>Dear ${c.contact_name},</p>
      <p>Thank you for taking the time to submit your report about <strong>${c.business_name}</strong>. We know that encountering accessibility barriers is frustrating, and we appreciate you bringing this to our attention.</p>
      <p>After reviewing your submission, we were unable to move it forward to our attorney network at this time.</p>
      ${reasonText ? `
      <div style="background-color: #F8FAFC; border-left: 3px solid #C2410C; border-radius: 0 8px 8px 0; padding: 16px; margin: 16px 0;">
        <p style="margin: 0; color: #334155; line-height: 1.6;">${reasonText}</p>
      </div>
      ` : ''}
      <p><strong>What you can do:</strong></p>
      <ul style="padding-left: 20px; line-height: 1.8;">
        <li>Visit our <a href="${standardsGuideUrl}" style="color: #C2410C; font-weight: 600;">ADA Standards Guide</a> to learn more about the specific standards that apply to your situation.</li>
        <li>File a complaint directly with the <a href="https://civilrights.justice.gov/" style="color: #C2410C; font-weight: 600;">U.S. Department of Justice</a>.</li>
        <li>Contact your state's <a href="https://www.ndrn.org/about/ndrn-member-agencies/" style="color: #C2410C; font-weight: 600;">Protection &amp; Advocacy organization</a> for free assistance.</li>
        <li>If your situation changes or you have additional documentation, you are welcome to <a href="${intakeUrl}" style="color: #C2410C; font-weight: 600;">submit a new report</a>.</li>
      </ul>
      <p style="color: #64748B; font-size: 13px; margin-top: 24px; line-height: 1.5;">This assessment is provided as general information to help you understand your situation and does not constitute legal advice or create an attorney-client relationship.</p>
    `,
    portalUrl,
    portalLabel: 'View Your Case'
  });
}

export function attorneyAssignedEmail(c, lawyerName, firmName, portalUrl) {
  return brandedEmail({
    heading: 'An Attorney Has Been Assigned',
    headingColor: '#1D4ED8',
    bodyHtml: `
      <p>Dear ${c.contact_name},</p>
      <p>Good news — a licensed attorney has initiated support for your ADA violation case against <strong>${c.business_name}</strong>.</p>
      <table style="width: 100%; border-collapse: collapse; margin: 16px 0; background-color: #F0F9FF; border-radius: 8px;">
        <tr><td style="padding: 12px 16px; color: #64748B; font-weight: 600;">Attorney</td><td style="padding: 12px 16px; font-weight: 600; color: #1E293B;">${lawyerName}</td></tr>
        <tr><td style="padding: 12px 16px; color: #64748B; font-weight: 600;">Firm</td><td style="padding: 12px 16px; color: #1E293B;">${firmName}</td></tr>
      </table>
      <p><strong>What happens next?</strong></p>
      <ul style="padding-left: 20px;">
        <li>The assigned attorney will contact you using your preferred contact method (<strong>${prefLabel(c.contact_preference)}</strong>).</li>
        <li>Please ensure your contact information is up to date and be ready to discuss your case.</li>
      </ul>
      <p>If you have any questions, please reply to this email.</p>
    `,
    portalUrl,
    portalLabel: 'View Your Case'
  });
}

export function caseClosedEmail(c, portalUrl) {
  return brandedEmail({
    heading: 'Your Case Has Been Closed',
    bodyHtml: `
      <p>Dear ${c.contact_name},</p>
      <p>Your ADA violation case regarding <strong>${c.business_name}</strong> has been closed.</p>
      <p>If you have any questions about the outcome or need further assistance, please don't hesitate to reach out by replying to this email.</p>
      <p>Thank you for using ADA Legal Link.</p>
    `,
    portalUrl,
    portalLabel: 'View Case Summary'
  });
}
