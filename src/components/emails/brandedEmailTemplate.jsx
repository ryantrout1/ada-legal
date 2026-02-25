/**
 * Returns a branded HTML email wrapper for ADA Legal Link.
 * @param {object} opts
 * @param {string} opts.heading - Main heading text
 * @param {string} opts.headingColor - Color for the heading (default: slate-900)
 * @param {string} opts.bodyHtml - Inner HTML content
 * @param {string} [opts.portalUrl] - URL to the client portal (optional CTA)
 * @param {string} [opts.portalLabel] - CTA button label (default: "View Your Case")
 */
export function brandedEmail({ heading, headingColor = '#1E293B', bodyHtml, portalUrl, portalLabel = 'View Your Case' }) {
  const ctaBlock = portalUrl ? `
    <div style="text-align: center; margin: 32px 0 16px 0;">
      <a href="${portalUrl}" style="display: inline-block; padding: 14px 32px; background-color: #C2410C; color: #ffffff; font-family: Manrope, Arial, sans-serif; font-size: 16px; font-weight: 700; text-decoration: none; border-radius: 8px;">${portalLabel}</a>
    </div>
  ` : '';

  return `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin: 0; padding: 0; background-color: #FAF7F2; font-family: Manrope, Arial, sans-serif; color: #334155;">
  <div style="max-width: 600px; margin: 0 auto; padding: 0;">

    <!-- Header -->
    <div style="background-color: #1E293B; padding: 24px 32px; text-align: center; border-radius: 0 0 0 0;">
      <table role="presentation" style="margin: 0 auto;"><tr>
        <td style="vertical-align: middle; padding-right: 10px;">
          <div style="width: 28px; height: 28px; display: inline-block;">
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#F97316" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="M7 21h10"/><path d="M12 3v18"/><path d="M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2"/></svg>
          </div>
        </td>
        <td style="vertical-align: middle;">
          <span style="font-family: Georgia, serif; font-size: 22px; font-weight: 700; color: #ffffff; letter-spacing: 0.01em;">ADA Legal Link</span>
        </td>
      </tr></table>
    </div>

    <!-- Body -->
    <div style="background-color: #ffffff; padding: 40px 32px; border-left: 1px solid #E2E8F0; border-right: 1px solid #E2E8F0;">
      <h1 style="font-family: Georgia, serif; font-size: 24px; font-weight: 700; color: ${headingColor}; margin: 0 0 24px 0; line-height: 1.3;">
        ${heading}
      </h1>
      <div style="font-family: Manrope, Arial, sans-serif; font-size: 15px; color: #334155; line-height: 1.7;">
        ${bodyHtml}
      </div>
      ${ctaBlock}
    </div>

    <!-- Footer -->
    <div style="background-color: #1E293B; padding: 20px 32px; text-align: center;">
      <p style="margin: 0; font-family: Manrope, Arial, sans-serif; font-size: 12px; color: #94A3B8; line-height: 1.5;">
        © 2026 ADA Legal Link. All rights reserved.
      </p>
      <p style="margin: 6px 0 0 0; font-family: Manrope, Arial, sans-serif; font-size: 12px; color: #94A3B8; line-height: 1.5;">
        Connecting people with experienced ADA attorneys.
      </p>
      <p style="margin: 10px 0 0 0; font-family: Manrope, Arial, sans-serif; font-size: 11px; color: #64748B; line-height: 1.5; font-style: italic;">
        This platform is not a law firm and does not provide legal advice. Submitting a report does not create an attorney-client relationship.
      </p>
    </div>

  </div>
</body>
</html>`;
}