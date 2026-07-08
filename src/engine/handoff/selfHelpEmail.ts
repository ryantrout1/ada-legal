/**
 * Self-help confirmation email.
 *
 * Phase 2 (/plan ADALL #2). When a public_ada self-help session
 * completes and the user asked for a copy, this emails them a link to
 * their readout (/s/[slug]) plus a note that a sample letter is waiting
 * when one was generated. Distinct from handoff/emailTemplates.ts, which
 * is the attorney-intake handoff (firm + claimant emails); this is the
 * user's own copy of their self-help summary.
 *
 * Three pieces:
 *   - extractContactEmail: pull the user's email out of the captured
 *     fields (contact_email, falling back to email / user_email),
 *     validating shape. Null when absent or not an email.
 *   - renderSelfHelpUserEmail: the template. Reading-level aware; carries
 *     the package URL and (optionally) the sample-letter note.
 *   - maybeSendSelfHelpEmail: the send gate. No captured email -> no-op.
 *     Otherwise render + send, soft-failing into a receipt that is
 *     persisted to session metadata so deliverability is auditable.
 *
 * Ref: /plan ADALL #2, Phase 2.
 */

import type { ReadingLevel, ExtractedFields } from '../../types/db.js';
import type { EmailClient, DbClient } from '../clients/types.js';
import type { AdaSessionState } from '../types.js';
import type { RenderedEmail } from './emailTemplates.js';

// ─── Contact email extraction ─────────────────────────────────────────────────

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Pull the user's contact email from captured fields. Prefers
 * `claimant_email` (the field Ada actually writes during intake), then
 * `contact_email`, `email`, `user_email`. Returns the first field that
 * holds a value, validated as an email — null if that value isn't a
 * well-formed address, and null when none of the fields are set.
 */
export function extractContactEmail(fields: ExtractedFields): string | null {
  for (const key of ['claimant_email', 'contact_email', 'email', 'user_email']) {
    const raw = fields[key]?.value;
    if (typeof raw === 'string' && raw.trim().length > 0) {
      const v = raw.trim();
      return EMAIL_RE.test(v) ? v : null;
    }
  }
  return null;
}

// ─── Template ─────────────────────────────────────────────────────────────────

export interface RenderSelfHelpEmailOptions {
  packageUrl: string;
  readingLevel: ReadingLevel;
  summary: string;
  hasLetter: boolean;
}

export function renderSelfHelpUserEmail(
  opts: RenderSelfHelpEmailOptions,
): RenderedEmail {
  const { packageUrl, readingLevel, summary, hasLetter } = opts;

  const subject = byLevel(readingLevel, {
    simple: 'Your accessibility summary from Ada',
    standard: 'Your accessibility summary and next steps',
    professional: 'Your ADA accessibility summary and recommended next steps',
  });

  const greeting = byLevel(readingLevel, {
    simple: 'Here is the summary of what we talked about.',
    standard: "Here's the summary of what we discussed and the steps you can take.",
    professional:
      'Below is the summary of our discussion and the recommended next steps.',
  });

  const letterLine = hasLetter
    ? byLevel(readingLevel, {
        simple: 'Your summary also has a sample letter you can send.',
        standard:
          'Your summary also includes a sample letter you can send to the business.',
        professional:
          'Your summary also includes a sample letter you may send to the business directly.',
      })
    : '';

  const cta = 'Open your full summary:';
  const disclaimer =
    'This summary is based on what you told Ada. Ada is an AI assistant, not a lawyer, and this is not legal advice.';

  const textLines = [greeting, '', summary, '', cta, packageUrl];
  if (letterLine) textLines.push('', letterLine);
  textLines.push('', disclaimer, '', 'ADA Legal Link');
  const text = textLines.join('\n');

  const html = [
    '<!doctype html><html><body style="margin:0;background:#faf7f2">',
    '<div style="max-width:560px;margin:0 auto;padding:24px;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#1e293b;line-height:1.6">',
    `<p style="margin:0 0 16px">${escapeHtml(greeting)}</p>`,
    `<p style="margin:0 0 16px;color:#475569;white-space:pre-wrap">${escapeHtml(summary)}</p>`,
    `<p style="margin:0 0 8px">${escapeHtml(cta)}</p>`,
    `<p style="margin:0 0 20px"><a href="${escapeHtml(packageUrl)}" style="color:#c2410c">${escapeHtml(packageUrl)}</a></p>`,
    letterLine ? `<p style="margin:0 0 16px">${escapeHtml(letterLine)}</p>` : '',
    '<hr style="border:none;border-top:1px solid #eee;margin:24px 0">',
    `<p style="color:#888;font-size:12px;margin:0 0 8px">${escapeHtml(disclaimer)}</p>`,
    '<p style="color:#888;font-size:12px;margin:0">ADA Legal Link</p>',
    '</div></body></html>',
  ].join('');

  return { subject, html, text };
}

// ─── Send gate ────────────────────────────────────────────────────────────────

export interface SelfHelpEmailReceipt {
  id: string | null;
  error: string | null;
  sentAt: string;
}

/**
 * Send the self-help confirmation email if the user captured an address.
 * No address -> null (no-op). Otherwise render + send, soft-failing into
 * the receipt rather than throwing, and persist the receipt to session
 * metadata (free-form JSON, same as finalize_intake's handoff receipt).
 *
 * Caller is responsible for only invoking this on public_ada sessions —
 * class-action intakes send their own confirmation via finalize_intake.
 */
export async function maybeSendSelfHelpEmail(
  deps: { email: EmailClient; db: DbClient },
  state: AdaSessionState,
  pkg: { summary: string; demandLetter: string | null },
  packageUrl: string,
): Promise<SelfHelpEmailReceipt | null> {
  const to = extractContactEmail(state.extractedFields);
  if (!to) return null;

  let receipt: SelfHelpEmailReceipt;
  try {
    const rendered = renderSelfHelpUserEmail({
      packageUrl,
      readingLevel: state.readingLevel,
      summary: pkg.summary,
      hasLetter: pkg.demandLetter !== null,
    });
    const result = await deps.email.send({
      to,
      subject: rendered.subject,
      html: rendered.html,
      text: rendered.text,
    });
    receipt = { id: result.id, error: null, sentAt: new Date().toISOString() };
  } catch (err) {
    receipt = {
      id: null,
      error: err instanceof Error ? err.message : String(err),
      sentAt: new Date().toISOString(),
    };
  }

  (state.metadata as Record<string, unknown>).self_help_email = receipt;
  await deps.db.writeSession({ state });

  return receipt;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function byLevel(
  level: ReadingLevel,
  variants: { simple: string; standard: string; professional: string },
): string {
  return variants[level] ?? variants.standard;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
