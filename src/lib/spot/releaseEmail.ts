/**
 * Ada Spot — release (delivery) email (pure).
 *
 * Built when a reviewer releases a report. Links to the hosted readout (the
 * slug is the capability token); screening framing only; states the 90-day
 * photo retention. The from-address is set by the email client
 * (RESEND_FROM_ADDRESS). Ref: /plan Ada Spot Phase 4a.
 */

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export interface ReleaseEmailInput {
  slug: string;
  baseUrl: string;
}

export interface BuiltEmail {
  subject: string;
  html: string;
  text: string;
}

export function buildReleaseEmail({ slug, baseUrl }: ReleaseEmailInput): BuiltEmail {
  const readoutUrl = `${baseUrl.replace(/\/+$/, '')}/spot/r/${encodeURIComponent(slug)}`;
  const safeUrl = escapeHtml(readoutUrl);

  const subject = 'Your accessibility screening from Ada Spot is ready';

  const html = [
    '<!doctype html><html><body style="margin:0;background:#faf7f2;font-family:sans-serif">',
    '<div style="max-width:560px;margin:0 auto;padding:28px 20px;color:#334155">',
    '<h1 style="font-size:20px;color:#1e293b;margin:0 0 12px">Your screening is ready</h1>',
    '<p style="margin:0 0 16px">Thanks for using Ada Spot. Your accessibility screening report is ready to view:</p>',
    `<p style="margin:0 0 20px"><a href="${safeUrl}" style="color:#9c340a">${safeUrl}</a></p>`,
    '<p style="margin:0 0 16px;font-size:14px;color:#64748b">This report is an automated screening based on the photos you provided — a starting point for planning remediation, not a professional inspection or a legal determination. Findings should be confirmed on-site.</p>',
    '<p style="margin:0;font-size:13px;color:#94a3b8">Your uploaded photos are automatically deleted after 90 days. Your report stays available.</p>',
    '</div></body></html>',
  ].join('');

  const text = [
    'Your accessibility screening from Ada Spot is ready.',
    '',
    `View your report: ${readoutUrl}`,
    '',
    'This report is an automated screening based on the photos you provided — a starting point for planning remediation, not a professional inspection or a legal determination. Findings should be confirmed on-site.',
    '',
    'Your uploaded photos are automatically deleted after 90 days. Your report stays available.',
  ].join('\n');

  return { subject, html, text };
}
