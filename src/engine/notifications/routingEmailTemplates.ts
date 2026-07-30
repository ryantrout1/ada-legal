/**
 * Routing notification email templates (Phase 1c).
 *
 * Pure functions producing {subject, html, text} for the three router
 * notifications. They take the lean CaseRow plus passed-in name/links — never
 * conversation content (Rule 8). Firm + admin emails point at the portal/admin
 * (claimant details live behind auth, o-1c-2); the user email carries the
 * readout link.
 *
 * HTML policy mirrors handoff/emailTemplates.ts: inline CSS only, no external
 * resources, all interpolated strings escaped, plain-text companion.
 *
 * Copy here is flagged for Gina's review before launch.
 *
 * Ref: /plan Phase 1c.
 */

import type { CaseRow } from '../clients/types.js';
import { fill, EMPTY_COPY, type RenderedEmail } from '../handoff/emailTemplates.js';
import { copyFor, type CopyBundle } from '../email/resolveCopy.js';
import { PUBLIC_ORIGIN } from '../../lib/publicOrigin.js';
import {
  EMAIL_BG,
  EMAIL_BODY,
  EMAIL_BUTTON_BG,
  EMAIL_BUTTON_LINE_HEIGHT,
  EMAIL_BUTTON_PADDING_X,
  EMAIL_BUTTON_PADDING_Y,
  EMAIL_BUTTON_TEXT,
  EMAIL_INK,
} from '../email/emailStyles.js';

export const APP_BASE = PUBLIC_ORIGIN;
const FONT_STACK = "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * The document these emails ship as.
 *
 * This used to return a bare div. A fragment lets the mail client choose the
 * page it sits on, which makes any contrast figure a guess, and leaves the
 * language undeclared for a screen reader. The other three renderers in this
 * repo all emit full documents; these were the odd ones out.
 */
function wrap(bodyHtml: string): string {
  return [
    `<!doctype html><html lang="en"><body style="margin:0;padding:0;background:${EMAIL_BG}">`,
    `<div style="max-width:620px;margin:0 auto;padding:24px;font-family:${FONT_STACK};color:${EMAIL_INK};line-height:1.5">`,
    bodyHtml,
    '</div></body></html>',
  ].join('');
}

/**
 * The primary action.
 *
 * White on #C2410C was 5.18:1 — the most prominent element in the email and
 * the only thing in it below the AAA floor. Now the same fill and the same
 * metrics as every other button the product sends: 48px of real target
 * height from padding plus line-height, because Outlook ignores min-height.
 */
function button(href: string, label: string): string {
  const style = [
    `display:inline-block;background:${EMAIL_BUTTON_BG};color:${EMAIL_BUTTON_TEXT}`,
    `text-decoration:none;font-size:16px;font-weight:600`,
    `line-height:${EMAIL_BUTTON_LINE_HEIGHT}px`,
    `padding:${EMAIL_BUTTON_PADDING_Y}px ${EMAIL_BUTTON_PADDING_X}px;border-radius:6px`,
  ].join(';');
  return `<p style="margin:24px 0"><a href="${escapeHtml(href)}" style="${style}">${escapeHtml(label)}</a></p>`;
}

// ─── Firm: a consented matched case is ready ──────────────────────────────────

export function renderFirmMatchedEmail(opts: {
  caseRow: CaseRow;
  firmName: string;
  claimantName: string | null;
  copy?: CopyBundle;
}): RenderedEmail {
  const { caseRow, firmName, claimantName, copy = EMPTY_COPY } = opts;
  const who = claimantName ?? 'A claimant';
  const portalUrl = `${APP_BASE}/portal`;
  const t = (slot: string) => copyFor(copy, 'routing_firm_matched', slot, 'standard');
  const subject = fill(t('subject'), { case_number: caseRow.caseNumber });

  // The firm name and case number are bolded inside the sentence, so the
  // html substitution carries markup where the text one carries the bare
  // value. Same slot, same words, two renderings.
  const html = wrap(
    `<h1 style="font-size:20px;margin:0 0 16px">${escapeHtml(t('heading'))}</h1>` +
      `<p style="margin:0 0 12px">${fill(escapeHtml(t('body')), {
        claimant_name: escapeHtml(who),
        firm_name: `<strong>${escapeHtml(firmName)}</strong>`,
        case_number: `<strong>${escapeHtml(caseRow.caseNumber)}</strong>`,
      })}</p>` +
      `<p style="margin:0 0 4px;color:${EMAIL_BODY}">${escapeHtml(t('note'))}</p>` +
      button(portalUrl, t('cta_label')),
  );

  const text = [
    t('heading'),
    ``,
    fill(t('body'), {
      claimant_name: who,
      firm_name: firmName,
      case_number: caseRow.caseNumber,
    }),
    ``,
    `${t('note').replace(/\.$/, '')}: ${portalUrl}`,
  ].join('\n');

  return { subject, html, text };
}

// ─── User: you're connected ───────────────────────────────────────────────────

export function renderUserConnectedEmail(opts: {
  caseRow: CaseRow;
  firmName: string | null;
  readoutUrl: string;
  copy?: CopyBundle;
}): RenderedEmail {
  const { firmName, readoutUrl, copy = EMPTY_COPY } = opts;
  const t = (slot: string) => copyFor(copy, 'routing_user_connected', slot, 'standard');
  const withFirm = firmName ? ` with ${firmName}` : '';
  const subject = fill(t('subject'), { with_firm: withFirm });

  const html = wrap(
    `<h1 style="font-size:20px;margin:0 0 16px">${escapeHtml(t('heading'))}</h1>` +
      `<p style="margin:0 0 12px">${fill(escapeHtml(t('intro')), {
        firm_or_attorney: firmName ? escapeHtml(firmName) : 'An attorney',
      })}</p>` +
      `<p style="margin:0 0 16px;color:${EMAIL_BODY}">${escapeHtml(t('reassurance'))}</p>` +
      button(readoutUrl, t('cta_label')) +
      `<p style="margin:22px 0 0;color:${EMAIL_BODY}">${escapeHtml(t('signoff'))}</p>`,
  );

  const text = [
    t('heading'),
    ``,
    fill(t('intro'), { firm_or_attorney: firmName ?? 'An attorney' }),
    ``,
    t('reassurance'),
    ``,
    `${t('cta_label')}: ${readoutUrl}`,
    ``,
    t('signoff'),
  ].join('\n');

  return { subject, html, text };
}

// ─── Admin: a case needs sourcing / placement ─────────────────────────────────

export function renderAdminRoutingEmail(opts: {
  caseRow: CaseRow;
  copy?: CopyBundle;
}): RenderedEmail {
  const { caseRow, copy = EMPTY_COPY } = opts;
  const t = (slot: string) => copyFor(copy, 'routing_admin', slot, 'standard');
  const action = caseRow.lane === 'sourcing' ? 'sourcing' : 'placement';
  const adminUrl = `${APP_BASE}/admin`;
  const vars = { lane: caseRow.lane, case_number: caseRow.caseNumber, action };
  const subject = fill(t('subject'), vars);

  const html = wrap(
    `<h1 style="font-size:20px;margin:0 0 16px">${fill(escapeHtml(t('heading')), {
      action: escapeHtml(action),
    })}</h1>` +
      `<p style="margin:0 0 12px">${fill(escapeHtml(t('body')), {
        case_number: `<strong>${escapeHtml(caseRow.caseNumber)}</strong>`,
        lane: `<strong>${escapeHtml(caseRow.lane)}</strong>`,
        action: escapeHtml(action),
      })}</p>` +
      button(adminUrl, t('cta_label')),
  );

  const text = [
    fill(t('heading'), vars),
    ``,
    fill(t('body'), vars),
    ``,
    `${t('cta_label')}: ${adminUrl}`,
  ].join('\n');

  return { subject, html, text };
}
