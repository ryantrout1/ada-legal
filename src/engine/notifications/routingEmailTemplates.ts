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
      `<p style="margin:0 0 4px;color:#555">${escapeHtml(t('note'))}</p>` +
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
      `<p style="margin:0 0 16px;color:#555">${escapeHtml(t('reassurance'))}</p>` +
      button(readoutUrl, t('cta_label')) +
      `<p style="margin:22px 0 0;color:#555">${escapeHtml(t('signoff'))}</p>`,
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
