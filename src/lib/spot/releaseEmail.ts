import { copyFor, type CopyBundle } from '../../engine/email/resolveCopy.js';
import { EMPTY_COPY } from '../../engine/handoff/emailTemplates.js';
import {
  EMAIL_BG,
  EMAIL_BODY,
  EMAIL_BUTTON_BG,
  EMAIL_BUTTON_LINE_HEIGHT,
  EMAIL_BUTTON_PADDING_X,
  EMAIL_BUTTON_PADDING_Y,
  EMAIL_BUTTON_TEXT,
  EMAIL_INK,
  EMAIL_MUTED,
} from '../../engine/email/emailStyles.js';
/**
 * Ada Spot — release (delivery) email (pure).
 *
 * Built when a reviewer releases a report. Links to the hosted readout (the
 * slug is the capability token); screening framing only; states the 90-day
 * photo retention. The from-address is set by the email client
 * (RESEND_FROM_ADDRESS); the send paths set reply-to.
 *
 * The action is a filled button, not a bare URL. A raw link is read out
 * character by character by a screen reader, is the shape phishing takes in an
 * email from a company you just paid, and gets wrapped mid-string by some
 * clients. The plain URL still appears in the text alternative, which is where
 * it belongs.
 *
 * Colours come from emailStyles, which is contrast-tested. Nothing here should
 * introduce a hex — spotReleaseEmail.test.ts fails on any that is not in the
 * shared palette.
 *
 * Ref: /plan Ada Spot Phase 4a; /plan Spot release email phase 1.
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

export function buildReleaseEmail(
  { slug, baseUrl }: ReleaseEmailInput,
  copy: CopyBundle = EMPTY_COPY,
): BuiltEmail {
  const t = (slot: string) => copyFor(copy, 'spot_release', slot, 'standard');
  const readoutUrl = `${baseUrl.replace(/\/+$/, '')}/spot/r/${encodeURIComponent(slug)}`;
  const safeUrl = escapeHtml(readoutUrl);

  const subject = t('subject');

  const button = [
    `<a href="${safeUrl}"`,
    ` style="display:inline-block;background:${EMAIL_BUTTON_BG};color:${EMAIL_BUTTON_TEXT};`,
    `text-decoration:none;font-size:16px;font-weight:bold;`,
    `line-height:${EMAIL_BUTTON_LINE_HEIGHT}px;`,
    `padding:${EMAIL_BUTTON_PADDING_Y}px ${EMAIL_BUTTON_PADDING_X}px;border-radius:6px"`,
    `>${escapeHtml(t('cta_label'))}</a>`,
  ].join('');

  const html = [
    `<!doctype html><html lang="en"><body style="margin:0;background:${EMAIL_BG};font-family:sans-serif">`,
    `<div style="max-width:560px;margin:0 auto;padding:28px 20px;color:${EMAIL_BODY}">`,
    `<h1 style="font-size:20px;color:${EMAIL_INK};margin:0 0 12px">${escapeHtml(t('heading'))}</h1>`,
    `<p style="margin:0 0 20px">${escapeHtml(t('intro'))}</p>`,
    `<p style="margin:0 0 24px">${button}</p>`,
    `<p style="margin:0 0 16px">${escapeHtml(t('review'))}</p>`,
    `<p style="margin:0 0 16px;font-size:14px;color:${EMAIL_MUTED}">${escapeHtml(t('disclaimer'))}</p>`,
    `<p style="margin:0;font-size:14px;color:${EMAIL_MUTED}">${escapeHtml(t('retention'))}</p>`,
    '</div></body></html>',
  ].join('');

  const text = [
    t('heading'),
    '',
    t('intro'),
    '',
    `${t('cta_label')}: ${readoutUrl}`,
    '',
    t('review'),
    '',
    t('disclaimer'),
    '',
    t('retention'),
  ].join('\n');

  return { subject, html, text };
}
