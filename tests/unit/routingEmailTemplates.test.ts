/**
 * Layer 1 tests — routing notification templates (Phase 1c).
 *
 * Pure renderers producing {subject, html, text}. They key off the lean
 * CaseRow (caseNumber, lane) plus passed-in name/links — never conversation
 * content (Rule 8). Firm/admin emails point at the portal/admin (details live
 * behind auth, o-1c-2); the user email carries the readout link.
 *
 * Encodes /plan Phase 1c acceptance criterion 5 (boundary) + template shape.
 */

import { describe, it, expect } from 'vitest';
import {
  renderFirmMatchedEmail,
  renderUserConnectedEmail,
  renderAdminRoutingEmail,
} from '@/engine/notifications/routingEmailTemplates';
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
  createdAt: '2026-01-01T00:00:00.000Z',
};

describe('routing email templates', () => {
  it('firm matched email carries the case number + portal link + claimant name', () => {
    const r = renderFirmMatchedEmail({
      caseRow: baseCase,
      firmName: 'Spinal Cord Injury Law Firm',
      claimantName: 'Jane Doe',
    });
    expect(r.subject).toContain('CASE-0042');
    expect(r.html.toLowerCase()).toContain('portal');
    expect(r.text).toContain('Jane Doe');
    expect(r.text.length).toBeGreaterThan(0);
  });

  it('firm matched email is graceful when no claimant name is known', () => {
    const r = renderFirmMatchedEmail({ caseRow: baseCase, firmName: 'Test Firm', claimantName: null });
    expect(r.subject).toContain('CASE-0042');
    expect(r.html.length).toBeGreaterThan(0);
  });

  it('user connected email carries the firm name + readout link', () => {
    const r = renderUserConnectedEmail({
      caseRow: baseCase,
      firmName: 'Spinal Cord Injury Law Firm',
      readoutUrl: 'https://ada.adalegallink.com/s/abc',
    });
    expect(r.html).toContain('https://ada.adalegallink.com/s/abc');
    expect(r.text).toContain('Spinal Cord Injury Law Firm');
  });

  it('admin routing email names the lane + case number', () => {
    const sourcing: CaseRow = { ...baseCase, lane: 'sourcing' };
    const r = renderAdminRoutingEmail({ caseRow: sourcing });
    expect(r.subject).toContain('CASE-0042');
    expect(r.text.toLowerCase()).toContain('sourcing');
  });
});
