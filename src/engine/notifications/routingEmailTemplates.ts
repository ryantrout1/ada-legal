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
import type { RenderedEmail } from '../handoff/emailTemplates.js';

export const APP_BASE = 'https://ada.adalegallink.com';
const FONT_STACK = "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function wrap(bodyHtml: string): string {
  return `<div style="max-width:620px;margin:0 auto;padding:24px;font-family:${FONT_STACK};color:#222;line-height:1.5">${bodyHtml}</div>`;
}

function button(href: string, label: string): string {
  return `<p style="margin:24px 0"><a href="${escapeHtml(href)}" style="display:inline-block;background:#C2410C;color:#fff;text-decoration:none;padding:12px 20px;border-radius:6px;font-weight:600">${escapeHtml(label)}</a></p>`;
}

// ─── Firm: a consented matched case is ready ──────────────────────────────────

export function renderFirmMatchedEmail(opts: {
  caseRow: CaseRow;
  firmName: string;
  claimantName: string | null;
}): RenderedEmail {
  const { caseRow, firmName, claimantName } = opts;
  const who = claimantName ?? 'A claimant';
  const portalUrl = `${APP_BASE}/portal`;
  const subject = `New consented case — ${caseRow.caseNumber}`;

  const html = wrap(
    `<h1 style="font-size:20px;margin:0 0 16px">A claimant consented to connect</h1>` +
      `<p style="margin:0 0 12px">${escapeHtml(who)} has reviewed their summary and consented to share their intake with <strong>${escapeHtml(firmName)}</strong> on case <strong>${escapeHtml(caseRow.caseNumber)}</strong>.</p>` +
      `<p style="margin:0 0 4px;color:#555">Their contact details and intake are in your portal.</p>` +
      button(portalUrl, 'Review in your portal'),
  );

  const text = [
    `A claimant consented to connect`,
    ``,
    `${who} has reviewed their summary and consented to share their intake with ${firmName} on case ${caseRow.caseNumber}.`,
    ``,
    `Their contact details and intake are in your portal: ${portalUrl}`,
  ].join('\n');

  return { subject, html, text };
}

// ─── User: you're connected ───────────────────────────────────────────────────

export function renderUserConnectedEmail(opts: {
  caseRow: CaseRow;
  firmName: string | null;
  readoutUrl: string;
}): RenderedEmail {
  const { firmName, readoutUrl } = opts;
  const withFirm = firmName ? ` with ${firmName}` : '';
  const subject = `You're connected${withFirm}`;

  const html = wrap(
    `<h1 style="font-size:20px;margin:0 0 16px">You're all set</h1>` +
      `<p style="margin:0 0 12px">Thanks for confirming. ${firmName ? escapeHtml(firmName) + ' can' : 'An attorney can'} now review what you described and will reach out to you directly.</p>` +
      `<p style="margin:0 0 16px;color:#555">There's nothing more you need to do right now — they'll be in touch.</p>` +
      button(readoutUrl, 'View your summary') +
      `<p style="margin:22px 0 0;color:#555">— Ada, ADA Legal Link</p>`,
  );

  const text = [
    `You're all set`,
    ``,
    `Thanks for confirming. ${firmName ?? 'An attorney'} can now review what you described and will reach out to you directly.`,
    ``,
    `There's nothing more you need to do right now — they'll be in touch.`,
    ``,
    `View your summary: ${readoutUrl}`,
    ``,
    `— Ada, ADA Legal Link`,
  ].join('\n');

  return { subject, html, text };
}

// ─── Admin: a case needs sourcing / placement ─────────────────────────────────

export function renderAdminRoutingEmail(opts: { caseRow: CaseRow }): RenderedEmail {
  const { caseRow } = opts;
  const action = caseRow.lane === 'sourcing' ? 'sourcing' : 'placement';
  const adminUrl = `${APP_BASE}/admin`;
  const subject = `New ${caseRow.lane} case — ${caseRow.caseNumber} needs ${action}`;

  const html = wrap(
    `<h1 style="font-size:20px;margin:0 0 16px">A case needs ${escapeHtml(action)}</h1>` +
      `<p style="margin:0 0 12px">Case <strong>${escapeHtml(caseRow.caseNumber)}</strong> routed to the <strong>${escapeHtml(caseRow.lane)}</strong> lane and needs ${escapeHtml(action)}.</p>` +
      button(adminUrl, 'Open admin'),
  );

  const text = [
    `A case needs ${action}`,
    ``,
    `Case ${caseRow.caseNumber} routed to the ${caseRow.lane} lane and needs ${action}.`,
    ``,
    `Open admin: ${adminUrl}`,
  ].join('\n');

  return { subject, html, text };
}
