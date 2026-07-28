/**
 * Layer 1 tests for the lane router.
 *
 * decideLane is the pure heart of routing: given a completed session's
 * classification, litigation binding, the ELIGIBLE routing firm, and whether
 * a display firm exists, it picks exactly one lane. No I/O.
 *
 * Routing rebuild Phase 2: the matched-litigation branch forks on eligibility —
 * an eligible+opted-in firm routes exclusively; a matched litigation whose firm
 * is not eligible/opted-in (but is resolvable for display) becomes
 * matched_self_referral; a matched litigation with no firm at all is sourcing.
 */

import { describe, it, expect } from 'vitest';
import { decideLane } from '@/engine/routing/routeCase';
import type { AdaTitle } from '@/types/db';

describe('decideLane — matched litigation', () => {
  it('eligible, opted-in firm → routed_firm, carrying the firm id', () => {
    const d = decideLane({
      classificationTitle: 'III',
      litigationListingId: 'lit-1',
      eligibleFirmId: 'firm-1',
      hasDisplayFirm: true,
      litigationKind: 'enforcement_action',
    });
    expect(d.lane).toBe('routed_firm');
    expect(d.firmId).toBe('firm-1');
  });

  it('no eligible firm but a display firm exists → matched_self_referral, no firm id', () => {
    const d = decideLane({
      classificationTitle: 'class_action',
      litigationListingId: 'lit-1',
      eligibleFirmId: null,
      hasDisplayFirm: true,
      litigationKind: 'enforcement_action',
    });
    expect(d.lane).toBe('matched_self_referral');
    expect(d.firmId).toBeNull();
  });

  it('no firm resolvable at all → sourcing', () => {
    const d = decideLane({
      classificationTitle: 'class_action',
      litigationListingId: 'lit-1',
      eligibleFirmId: null,
      hasDisplayFirm: false,
      litigationKind: 'enforcement_action',
    });
    expect(d.lane).toBe('sourcing');
    expect(d.firmId).toBeNull();
  });

  it('an eligible firm routes regardless of title (match is the stronger signal)', () => {
    const d = decideLane({
      classificationTitle: 'out_of_scope',
      litigationListingId: 'lit-1',
      eligibleFirmId: 'firm-1',
      hasDisplayFirm: true,
      litigationKind: 'enforcement_action',
    });
    expect(d.lane).toBe('routed_firm');
  });

  it('self-referral holds regardless of title when there is a display firm but no routing', () => {
    const d = decideLane({
      classificationTitle: 'out_of_scope',
      litigationListingId: 'lit-1',
      eligibleFirmId: null,
      hasDisplayFirm: true,
      litigationKind: 'enforcement_action',
    });
    expect(d.lane).toBe('matched_self_referral');
  });
});

describe('decideLane — no litigation', () => {
  it.each<AdaTitle>(['I', 'II', 'III', 'class_action'])(
    'actionable title %s → pool',
    (title) => {
      const d = decideLane({
        classificationTitle: title,
        litigationListingId: null,
        eligibleFirmId: null,
        hasDisplayFirm: false,
      litigationKind: 'enforcement_action',
      });
      expect(d.lane).toBe('pool');
      expect(d.firmId).toBeNull();
    },
  );

  it.each<AdaTitle>(['out_of_scope', 'none'])('non-actionable title %s → no_action', (title) => {
    const d = decideLane({
      classificationTitle: title,
      litigationListingId: null,
      eligibleFirmId: null,
      hasDisplayFirm: false,
      litigationKind: 'enforcement_action',
    });
    expect(d.lane).toBe('no_action');
  });

  it('null classification → no_action', () => {
    const d = decideLane({
      classificationTitle: null,
      litigationListingId: null,
      eligibleFirmId: null,
      hasDisplayFirm: false,
      litigationKind: 'enforcement_action',
    });
    expect(d.lane).toBe('no_action');
  });
});

describe('decideLane — reason', () => {
  it('always returns a non-empty human reason for the audit trail', () => {
    const d = decideLane({
      classificationTitle: 'III',
      litigationListingId: null,
      eligibleFirmId: null,
      hasDisplayFirm: false,
      litigationKind: 'enforcement_action',
    });
    expect(typeof d.reason).toBe('string');
    expect(d.reason.length).toBeGreaterThan(0);
  });
});

// ─── A matched class action is not an intake ─────────────────────────────────

/**
 * The router ignored `kind` entirely until 2026-07-27, so a class action
 * and a pattern-of-practice record took identical paths. That is the root
 * of the whole class-action problem: the system could not tell the
 * difference between a case somebody can be handed and a case they are
 * already inside.
 *
 * If a person fits a certified class they are already in it. There is
 * nothing to enrol them in, and a firm that is not appointed class counsel
 * cannot act on the class claim however willing it is.
 *
 * They still reach a firm, because the class action covers the barrier and
 * not their wasted trip or an injury — the firm reviews for a separate
 * claim. Everyone routes rather than only those judged to have something
 * extra: a firm spending five minutes on someone with no separate claim
 * costs very little, and withholding someone who did costs them their case.
 */
describe('decideLane — matched class action', () => {
  it('does not hand a firm the class claim, even when one is eligible', () => {
    const d = decideLane({
      classificationTitle: 'class_action',
      litigationListingId: 'lit-1',
      eligibleFirmId: 'firm-1',
      hasDisplayFirm: true,
      litigationKind: 'class',
    });
    expect(d.lane).toBe('class_member');
    expect(d.lane).not.toBe('routed_firm');
  });

  it('still reaches the firm, for the separate claim', () => {
    const d = decideLane({
      classificationTitle: 'class_action',
      litigationListingId: 'lit-1',
      eligibleFirmId: 'firm-1',
      hasDisplayFirm: true,
      litigationKind: 'class',
    });
    expect(d.firmId).toBe('firm-1');
    expect(d.reason).toMatch(/separate claim/i);
  });

  it('still routes when no firm is eligible', () => {
    // Nobody to review a separate claim, but the person is still a class
    // member and the readout still has something to tell them.
    const d = decideLane({
      classificationTitle: 'class_action',
      litigationListingId: 'lit-1',
      eligibleFirmId: null,
      hasDisplayFirm: false,
      litigationKind: 'class',
    });
    expect(d.lane).toBe('class_member');
    expect(d.firmId).toBeNull();
  });

  it('leaves every other kind on its existing path', () => {
    // Mass actions DO gather individual claimants, and DOJ matters work
    // differently again. Only 'class' changes.
    for (const kind of ['mass', 'enforcement_action', 'consent_decree',
                        'pattern_of_practice', 'regulatory_challenge']) {
      const d = decideLane({
        classificationTitle: 'class_action',
        litigationListingId: 'lit-1',
        eligibleFirmId: 'firm-1',
        hasDisplayFirm: true,
        litigationKind: kind,
      });
      expect(d.lane, `${kind} should still route normally`).toBe('routed_firm');
    }
  });
});
