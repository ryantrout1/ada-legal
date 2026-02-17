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
        <li>The attorney will contact you within 24 hours of being assigned.</li>
      </ul>
    `,
    portalUrl,
    portalLabel: 'View Your Case'
  });
}

export function caseRejectedEmail(c, rejectionReason, portalUrl) {
  return brandedEmail({
    heading: 'Submission Update',
    headingColor: '#B91C1C',
    bodyHtml: `
      <p>Dear ${c.contact_name},</p>
      <p>After reviewing your ADA violation report regarding <strong>${c.business_name}</strong>, we were unable to approve it at this time.</p>
      <div style="background-color: #FEF2F2; border: 1px solid #FECACA; border-radius: 8px; padding: 16px; margin: 16px 0;">
        <p style="margin: 0; font-weight: 600; color: #991B1B;">Reason:</p>
        <p style="margin: 8px 0 0 0; color: #7F1D1D;">${rejectionReason}</p>
      </div>
      <p>If you believe this was in error or have additional information, you may submit a new report with more details.</p>
    `,
    portalUrl,
    portalLabel: 'View Details'
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
        <li>The assigned attorney will contact you within <strong>24 hours</strong> using your preferred contact method (<strong>${prefLabel(c.contact_preference)}</strong>).</li>
        <li>Please ensure your contact information is up to date and be ready to discuss your case.</li>
      </ul>
      <p>If you do not hear from an attorney within 24 hours, please reply to this email.</p>
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
      <p>Thank you for using ADA Legal Marketplace.</p>
    `,
    portalUrl,
    portalLabel: 'View Case Summary'
  });
}