/**
 * Branded HTML email wrapper.
 *
 * Ported from Base44 (src/components/emails/brandedEmailTemplate.jsx
 * @ 6b1e9ac). Same structure, same inline-style discipline — email
 * clients strip <style> blocks, so everything stays inline and the
 * layout stays table-based in the header.
 *
 * TWO PORT SEAMS:
 *
 * 1. The logo. B44 loads it from Base44's Supabase storage. Every email
 *    already sent carries that URL, and the day Base44 is unpublished at
 *    M8 those images break retroactively in every inbox that still has
 *    them. New mail points at our own origin instead.
 *
 * 2. Footer contrast. B44's footer text is #4B5563 on #1E293B — about
 *    3.6:1, below AA for body text let alone the AAA floor this project
 *    holds. Raised to #CBD5E1 (about 11:1). Email clients do not honour
 *    display-mode tokens, so these are literal hex by necessity, but
 *    they are still the corrected values.
 *
 * The disclaimer line is load-bearing and is not styled down: "not a law
 * firm, does not provide legal advice, submitting a report does not
 * create an attorney-client relationship."
 */

const LOGO_URL = 'https://ada.adalegallink.com/brand/logo-email.png';

export interface BrandedEmailOptions {
  heading: string;
  bodyHtml: string;
  headingColor?: string;
  ctaUrl?: string;
  ctaLabel?: string;
}

export function brandedEmail({
  heading,
  bodyHtml,
  headingColor = '#1E293B',
  ctaUrl,
  ctaLabel = 'View Your Case',
}: BrandedEmailOptions): string {
  const ctaBlock = ctaUrl
    ? `
    <div style="text-align: center; margin: 32px 0 16px 0;">
      <a href="${ctaUrl}" style="display: inline-block; padding: 14px 32px; background-color: #9C340A; color: #ffffff; font-family: Manrope, Arial, sans-serif; font-size: 16px; font-weight: 700; text-decoration: none; border-radius: 8px;">${ctaLabel}</a>
    </div>
  `
    : '';

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin: 0; padding: 0; background-color: #FAF7F2; font-family: Manrope, Arial, sans-serif; color: #334155;">
  <div style="max-width: 600px; margin: 0 auto; padding: 0;">

    <div style="background-color: #1E293B; padding: 24px 32px; text-align: center;">
      <table role="presentation" style="margin: 0 auto;"><tr>
        <td style="vertical-align: middle; padding-right: 10px;">
          <img src="${LOGO_URL}" alt="ADA Legal Link" width="32" height="32" style="display: block;" />
        </td>
        <td style="vertical-align: middle;">
          <span style="font-family: Georgia, serif; font-size: 22px; font-weight: 700; color: #ffffff; letter-spacing: 0.01em;">ADA Legal </span><span style="font-family: Georgia, serif; font-size: 22px; font-weight: 700; color: #F97316; letter-spacing: 0.01em;">Link</span>
        </td>
      </tr></table>
    </div>

    <div style="background-color: #ffffff; padding: 40px 32px; border-left: 1px solid #E2E8F0; border-right: 1px solid #E2E8F0;">
      <h1 style="font-family: Georgia, serif; font-size: 24px; font-weight: 700; color: ${headingColor}; margin: 0 0 24px 0; line-height: 1.3;">
        ${heading}
      </h1>
      <div style="font-family: Manrope, Arial, sans-serif; font-size: 15px; color: #334155; line-height: 1.7;">
        ${bodyHtml}
      </div>
      ${ctaBlock}
    </div>

    <div style="background-color: #1E293B; padding: 20px 32px; text-align: center;">
      <p style="margin: 0; font-family: Manrope, Arial, sans-serif; font-size: 12px; color: #CBD5E1; line-height: 1.5;">
        &copy; 2026 ADA Legal Link. All rights reserved.
      </p>
      <p style="margin: 6px 0 0 0; font-family: Manrope, Arial, sans-serif; font-size: 12px; color: #CBD5E1; line-height: 1.5;">
        Connecting people with experienced ADA attorneys.
      </p>
      <p style="margin: 10px 0 0 0; font-family: Manrope, Arial, sans-serif; font-size: 12px; color: #CBD5E1; line-height: 1.5; font-style: italic;">
        This platform is not a law firm and does not provide legal advice. Submitting a report does not create an attorney-client relationship.
      </p>
    </div>

  </div>
</body>
</html>`;
}
