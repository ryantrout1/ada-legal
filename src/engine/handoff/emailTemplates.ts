/**
 * Email templates for attorney package handoff.
 *
 * Step 24, Commit 2. Pure functions that take an AttorneyPackage and
 * produce {subject, html, text} strings. Side-effect-free; the caller
 * (finalize_intake) feeds the output into EmailClient.send.
 *
 * Why templates live here, not in the client:
 *   - The EmailClient is a transport layer (SMTP/HTTP to Resend).
 *     Templates are domain logic (which fields go where, how to
 *     phrase disqualifications, reading-level adaptation).
 *   - Keeping them pure makes them trivially testable without
 *     mocking the email client.
 *
 * Two renderers:
 *   - renderFirmEmail: detailed, for the attorney. Includes confidence
 *     tags, photos + findings, transcript link. NOT sent for
 *     unqualified intakes (firm only sees the ones that passed).
 *   - renderUserEmail: plain, reassuring. Reading-level-adapted.
 *     Includes the conversation summary but NOT the transcript link
 *     (reduces forwarding risk).
 *
 * HTML policy:
 *   - Inline CSS only. Many email clients (especially Gmail mobile)
 *     strip <style> blocks.
 *   - No external resources (images, fonts, scripts). Improves
 *     deliverability and speeds first paint on mobile.
 *   - Tables for layout where necessary (Outlook).
 *   - All user-provided strings HTML-escaped.
 *
 * Text policy:
 *   - Plain-text multipart companion, same content, different shape.
 *   - Deliverability: emails without a text part score worse on spam.
 *
 * Ref: Step 24, Commit 2.
 */

import type { AttorneyPackage } from './attorneyPackage.js';
import type { ReadingLevel } from '../../types/db.js';

export interface RenderedEmail {
  subject: string;
  html: string;
  text: string;
}

// ─── Firm email (qualified intakes only) ──────────────────────────────────────

export function renderFirmEmail(pkg: AttorneyPackage): RenderedEmail {
  const claimantFirstName = firstName(pkg.claimant.name) ?? 'Claimant';
  const subject = `New qualified intake — ${pkg.listing.title} — ${claimantFirstName}`;

  const html = renderFirmHtml(pkg);
  const text = renderFirmText(pkg);
  return { subject, html, text };
}

function renderFirmHtml(pkg: AttorneyPackage): string {
  const rows: string[] = [];
  rows.push(`<!doctype html><html><body style="${BODY_STYLE}">`);
  rows.push(
    `<div style="max-width:620px;margin:0 auto;padding:24px;font-family:${FONT_STACK};color:#222">`,
  );

  rows.push(
    `<h1 style="font-size:18px;font-weight:600;margin:0 0 16px">New qualified intake</h1>`,
  );
  rows.push(
    `<p style="margin:0 0 20px;color:#555">An ADA Legal Link client has completed intake for <strong>${escapeHtml(
      pkg.listing.title,
    )}</strong>.</p>`,
  );

  // Claimant block
  rows.push(`<h2 style="${H2_STYLE}">Claimant</h2>`);
  rows.push(`<table style="${TABLE_STYLE}">`);
  rows.push(kvRow('Name', pkg.claimant.name));
  rows.push(kvRow('Email', pkg.claimant.email));
  rows.push(kvRow('Phone', pkg.claimant.phone));
  rows.push(kvRow('Preferred contact', pkg.claimant.preferredContact));
  rows.push('</table>');

  // Classification
  if (pkg.classification) {
    rows.push(`<h2 style="${H2_STYLE}">Classification</h2>`);
    rows.push(
      `<p style="margin:0 0 4px"><strong>${escapeHtml(
        pkg.classification.title,
      )}</strong> &mdash; tier ${escapeHtml(String(pkg.classification.tier))}</p>`,
    );
    rows.push(
      `<p style="margin:0 0 16px;color:#555;font-size:14px">${escapeHtml(
        pkg.classification.reasoning ?? '',
      )}</p>`,
    );
  }

  // Case facts
  rows.push(`<h2 style="${H2_STYLE}">Case facts</h2>`);
  if (Object.keys(pkg.fields).length === 0) {
    rows.push(`<p style="${MUTED_STYLE}">(none recorded)</p>`);
  } else {
    rows.push(`<table style="${TABLE_STYLE}">`);
    for (const [name, entry] of Object.entries(pkg.fields)) {
      const confTag = formatConfidence(entry.confidence);
      const valStr = escapeHtml(stringifyValue(entry.value));
      rows.push(
        `<tr><td style="${KEY_CELL_STYLE}">${escapeHtml(name)}</td>` +
          `<td style="${VAL_CELL_STYLE}">${valStr}<br><span style="color:#888;font-size:12px">${confTag}</span></td></tr>`,
      );
    }
    rows.push('</table>');
  }

  if (pkg.missingRequiredFields.length > 0) {
    rows.push(
      `<p style="${WARN_STYLE}"><strong>Missing required fields:</strong> ${pkg.missingRequiredFields
        .map((n) => escapeHtml(n))
        .join(', ')}</p>`,
    );
  }

  // Photos
  if (pkg.photos.length > 0) {
    rows.push(`<h2 style="${H2_STYLE}">Photos</h2>`);
    rows.push(`<ul style="margin:0 0 16px;padding-left:18px">`);
    for (const p of pkg.photos) {
      rows.push(
        `<li style="margin:0 0 6px"><a href="${escapeAttr(p.url)}" style="color:#0066cc">View photo</a>` +
          (p.findings.length > 0
            ? ` &mdash; ${p.findings.length} finding${p.findings.length === 1 ? '' : 's'}`
            : '') +
          '</li>',
      );
    }
    rows.push('</ul>');
  }

  // Conversation summary
  rows.push(`<h2 style="${H2_STYLE}">Conversation summary</h2>`);
  if (!pkg.conversationSummaryIsApproved) {
    rows.push(
      `<p style="${WARN_STYLE}"><em>Auto-generated (not user-approved).</em></p>`,
    );
  }
  rows.push(
    `<p style="margin:0 0 16px;color:#333;white-space:pre-wrap">${escapeHtml(
      pkg.conversationSummary,
    )}</p>`,
  );

  // Transcript link (only if populated)
  if (pkg.conversationTranscriptUrl) {
    rows.push(`<h2 style="${H2_STYLE}">Full transcript</h2>`);
    rows.push(
      `<p><a href="${escapeAttr(pkg.conversationTranscriptUrl)}" style="color:#0066cc">Download PDF transcript</a> <span style="color:#888;font-size:12px">(link expires in 30 days)</span></p>`,
    );
  }

  rows.push(
    `<hr style="border:none;border-top:1px solid #eee;margin:24px 0"><p style="color:#888;font-size:12px;margin:0">Session ${escapeHtml(
      pkg.sessionId,
    )} &middot; generated ${escapeHtml(pkg.generatedAt)}</p>`,
  );

  rows.push('</div></body></html>');
  return rows.join('');
}

function renderFirmText(pkg: AttorneyPackage): string {
  const lines: string[] = [];
  lines.push('NEW QUALIFIED INTAKE');
  lines.push('');
  lines.push(`Listing: ${pkg.listing.title}`);
  lines.push('');
  lines.push('CLAIMANT');
  lines.push(`  Name:  ${pkg.claimant.name ?? '(not provided)'}`);
  lines.push(`  Email: ${pkg.claimant.email ?? '(not provided)'}`);
  lines.push(`  Phone: ${pkg.claimant.phone ?? '(not provided)'}`);
  lines.push(
    `  Preferred contact: ${pkg.claimant.preferredContact ?? '(not provided)'}`,
  );

  if (pkg.classification) {
    lines.push('');
    lines.push('CLASSIFICATION');
    lines.push(
      `  ${pkg.classification.title} (tier ${pkg.classification.tier})`,
    );
    if (pkg.classification.reasoning) {
      lines.push(`  ${pkg.classification.reasoning}`);
    }
  }

  lines.push('');
  lines.push('CASE FACTS');
  if (Object.keys(pkg.fields).length === 0) {
    lines.push('  (none recorded)');
  } else {
    for (const [name, entry] of Object.entries(pkg.fields)) {
      lines.push(
        `  ${name}: ${stringifyValue(entry.value)} [${formatConfidence(entry.confidence)}]`,
      );
    }
  }
  if (pkg.missingRequiredFields.length > 0) {
    lines.push('');
    lines.push(
      `  ** Missing required fields: ${pkg.missingRequiredFields.join(', ')} **`,
    );
  }

  if (pkg.photos.length > 0) {
    lines.push('');
    lines.push('PHOTOS');
    for (const p of pkg.photos) {
      lines.push(
        `  ${p.url}${p.findings.length > 0 ? ` (${p.findings.length} finding${p.findings.length === 1 ? '' : 's'})` : ''}`,
      );
    }
  }

  lines.push('');
  lines.push('CONVERSATION SUMMARY');
  if (!pkg.conversationSummaryIsApproved) {
    lines.push('  (Auto-generated, not user-approved.)');
  }
  lines.push('');
  for (const l of pkg.conversationSummary.split('\n')) {
    lines.push(`  ${l}`);
  }

  if (pkg.conversationTranscriptUrl) {
    lines.push('');
    lines.push('FULL TRANSCRIPT');
    lines.push(`  ${pkg.conversationTranscriptUrl}`);
    lines.push('  (Link expires in 30 days.)');
  }

  lines.push('');
  lines.push('---');
  lines.push(`Session ${pkg.sessionId} · generated ${pkg.generatedAt}`);
  return lines.join('\n');
}

// ─── User confirmation email ──────────────────────────────────────────────────

export interface RenderUserEmailOptions {
  pkg: AttorneyPackage;
  readingLevel: ReadingLevel;
}

export function renderUserEmail(opts: RenderUserEmailOptions): RenderedEmail {
  const { pkg, readingLevel } = opts;
  const firmName = pkg.listing.firmName;
  const listingTitle = pkg.listing.title;

  let subject: string;
  let intro: string;
  let nextSteps: string;

  if (pkg.qualified) {
    subject = simpleByLevel(readingLevel, {
      simple: `We sent your story to ${firmName}`,
      standard: `We've sent your information to ${firmName}`,
      professional: `Intake submitted to ${firmName}`,
    });
    intro = simpleByLevel(readingLevel, {
      simple: `Thank you for telling us what happened. We sent your story to ${firmName}.`,
      standard: `Thanks for sharing your experience. We've sent your information to ${firmName} for the "${listingTitle}" class action.`,
      professional: `Thank you for completing intake for the "${listingTitle}" class action. Your information has been submitted to ${firmName} for review.`,
    });
    nextSteps = simpleByLevel(readingLevel, {
      simple: `They will look at it and get back to you soon. Watch for their email or call. You do not need to do anything right now.`,
      standard: `They'll review it and reach out to you directly. Watch for their email or call in the coming days.`,
      professional: `The firm will review your submission and contact you directly to discuss next steps. Expected response time varies by firm but is typically 1-2 weeks.`,
    });
  } else {
    subject = simpleByLevel(readingLevel, {
      simple: `About your story`,
      standard: `Update on your intake`,
      professional: `Update regarding your intake`,
    });
    intro = simpleByLevel(readingLevel, {
      simple: `Thank you for telling us what happened. For this case, we were not able to match you.`,
      standard: `Thanks for sharing your experience. Unfortunately, based on what we discussed, your situation doesn't match the "${listingTitle}" class action.`,
      professional: `Thank you for completing intake for the "${listingTitle}" class action. Based on the information provided, your situation does not meet the eligibility criteria for this particular case.`,
    });
    const reasonLine = pkg.disqualifyingReason
      ? simpleByLevel(readingLevel, {
          simple: `Reason: ${pkg.disqualifyingReason}`,
          standard: `The reason: ${pkg.disqualifyingReason}`,
          professional: `Disqualifying reason: ${pkg.disqualifyingReason}`,
        })
      : '';
    nextSteps = [
      reasonLine,
      simpleByLevel(readingLevel, {
        simple: `You can still get help. Come back to ADA Legal Link to look for other ways.`,
        standard: `You may still have options. Come back to ADA Legal Link and we can explore other paths that fit your situation.`,
        professional: `Other avenues may still be available. Please return to ADA Legal Link to explore alternative options for your situation.`,
      }),
    ]
      .filter(Boolean)
      .join('\n\n');
  }

  const summaryHeading = simpleByLevel(readingLevel, {
    simple: 'What we talked about',
    standard: "What we discussed",
    professional: 'Summary of intake',
  });

  const html = renderUserHtml({
    intro,
    nextSteps,
    summaryHeading,
    conversationSummary: pkg.conversationSummary,
  });
  const text = renderUserText({
    intro,
    nextSteps,
    summaryHeading,
    conversationSummary: pkg.conversationSummary,
  });
  return { subject, html, text };
}

function renderUserHtml(ctx: {
  intro: string;
  nextSteps: string;
  summaryHeading: string;
  conversationSummary: string;
}): string {
  const rows: string[] = [];
  rows.push(`<!doctype html><html><body style="${BODY_STYLE}">`);
  rows.push(
    `<div style="max-width:560px;margin:0 auto;padding:24px;font-family:${FONT_STACK};color:#222;line-height:1.6">`,
  );
  rows.push(`<p style="margin:0 0 16px">${escapeHtml(ctx.intro)}</p>`);
  rows.push(
    `<p style="margin:0 0 20px">${escapeHtml(ctx.nextSteps).replace(/\n\n/g, '</p><p style="margin:0 0 16px">')}</p>`,
  );
  rows.push(
    `<h2 style="${H2_STYLE}">${escapeHtml(ctx.summaryHeading)}</h2>`,
  );
  rows.push(
    `<p style="margin:0 0 16px;color:#555;white-space:pre-wrap">${escapeHtml(
      ctx.conversationSummary,
    )}</p>`,
  );
  rows.push(
    `<hr style="border:none;border-top:1px solid #eee;margin:24px 0"><p style="color:#888;font-size:12px;margin:0">ADA Legal Link</p>`,
  );
  rows.push('</div></body></html>');
  return rows.join('');
}

function renderUserText(ctx: {
  intro: string;
  nextSteps: string;
  summaryHeading: string;
  conversationSummary: string;
}): string {
  const lines: string[] = [];
  lines.push(ctx.intro);
  lines.push('');
  lines.push(ctx.nextSteps);
  lines.push('');
  lines.push(ctx.summaryHeading.toUpperCase());
  lines.push('');
  for (const l of ctx.conversationSummary.split('\n')) lines.push(l);
  lines.push('');
  lines.push('---');
  lines.push('ADA Legal Link');
  return lines.join('\n');
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const BODY_STYLE = 'margin:0;padding:0;background:#f6f6f6';
const FONT_STACK =
  "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";
const H2_STYLE =
  'font-size:14px;font-weight:600;margin:20px 0 8px;padding-bottom:4px;border-bottom:1px solid #eee;color:#333';
const TABLE_STYLE =
  'width:100%;border-collapse:collapse;margin:0 0 16px;font-size:14px';
const KEY_CELL_STYLE =
  'padding:6px 10px 6px 0;color:#666;vertical-align:top;width:140px';
const VAL_CELL_STYLE = 'padding:6px 0;color:#222;vertical-align:top';
const MUTED_STYLE = 'color:#888;font-size:14px;margin:0 0 16px';
const WARN_STYLE =
  'margin:8px 0 16px;padding:10px 12px;background:#fff5e5;border-left:3px solid #d48200;font-size:14px';

function kvRow(key: string, value: string | null | undefined): string {
  const safeVal =
    value === null || value === undefined || value === ''
      ? `<span style="color:#aaa">(not provided)</span>`
      : escapeHtml(value);
  return `<tr><td style="${KEY_CELL_STYLE}">${escapeHtml(key)}</td><td style="${VAL_CELL_STYLE}">${safeVal}</td></tr>`;
}

function firstName(fullName: string | null): string | null {
  if (!fullName) return null;
  const parts = fullName.trim().split(/\s+/);
  return parts[0] ?? null;
}

function stringifyValue(v: unknown): string {
  if (v === null || v === undefined) return '(not provided)';
  if (typeof v === 'string') return v;
  if (typeof v === 'number' || typeof v === 'boolean') return String(v);
  try {
    return JSON.stringify(v);
  } catch {
    return String(v);
  }
}

function formatConfidence(confidence: number): string {
  if (confidence >= 0.85) return 'high confidence';
  if (confidence >= 0.6) return 'medium confidence';
  return 'low confidence';
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escapeAttr(s: string): string {
  return escapeHtml(s);
}

function simpleByLevel<T>(level: ReadingLevel, variants: Record<ReadingLevel, T>): T {
  return variants[level];
}
