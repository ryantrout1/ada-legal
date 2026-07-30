/**
 * The routing emails have to be documents.
 *
 * `wrap()` produced a bare `<div>` — no doctype, no `<html>`, no `<body>`, no
 * language declaration. A fragment is not invalid, but it hands the mail
 * client every decision the sender should be making: the client picks the
 * background, and any contrast measured against an assumed white page is
 * measuring a guess. It also leaves the language undeclared, so a screen
 * reader falls back to the user's locale and may pronounce English copy with
 * the wrong phonetics.
 *
 * The other three renderers in this repo all emit full documents. These were
 * the odd ones out.
 *
 * Encodes acceptance criterion 4 from /plan phase 2 (contrast across the
 * remaining email renderers).
 */

import { describe, it, expect } from 'vitest';
import {
  renderFirmMatchedEmail,
  renderUserConnectedEmail,
  renderAdminRoutingEmail,
} from '@/engine/notifications/routingEmailTemplates';
import { EMAIL_BG } from '@/engine/email/emailStyles';
import type { CaseRow } from '@/engine/clients/types';

const baseCase: CaseRow = {
  id: 'case-1',
  orgId: 'org-1',
  adaSessionId: 'sess-1',
  litigationListingId: null,
  caseNumber: 'CASE-0042',
  lane: 'routed_firm',
  status: 'new',
  firmId: 'firm-1',
  consentToShare: true,
  assignedLawyerId: null,
  createdAt: '2026-01-01T00:00:00.000Z',
};

const READOUT_URL = 'https://adalegallink.com/s/s-abcdefghjkmn';

const EMAILS: ReadonlyArray<[string, { html: string }]> = [
  [
    'firm — matched',
    renderFirmMatchedEmail({
      caseRow: baseCase,
      firmName: 'Spinal Cord Injury Law Firm',
      claimantName: 'Jane Doe',
    }),
  ],
  [
    'claimant — connected',
    renderUserConnectedEmail({
      caseRow: baseCase,
      firmName: 'Spinal Cord Injury Law Firm',
      readoutUrl: READOUT_URL,
    }),
  ],
  ['admin — routing', renderAdminRoutingEmail({ caseRow: baseCase })],
];

describe.each(EMAILS)('%s', (_name, email) => {
  it('is a document, not a fragment', () => {
    expect(email.html).toMatch(/^<!doctype html>/i);
    expect(email.html).toContain('</html>');
  });

  it('declares its language', () => {
    expect(email.html).toMatch(/<html lang="en"/);
  });

  it('sets its own background rather than inheriting the client’s', () => {
    // Without this, the contrast pairs are measured against a page nobody
    // controls.
    expect(email.html).toMatch(new RegExp(`<body[^>]*background:${EMAIL_BG}`));
  });

  it('still carries the content it wrapped', () => {
    // The shell must not have replaced the body — a wrapper that renders an
    // empty document would satisfy every assertion above.
    expect(email.html).toMatch(/<h1[^>]*>/);
    expect(email.html.length).toBeGreaterThan(200);
  });
});
