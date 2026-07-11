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
    });
    expect(d.lane).toBe('routed_firm');
  });

  it('self-referral holds regardless of title when there is a display firm but no routing', () => {
    const d = decideLane({
      classificationTitle: 'out_of_scope',
      litigationListingId: 'lit-1',
      eligibleFirmId: null,
      hasDisplayFirm: true,
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
    });
    expect(d.lane).toBe('no_action');
  });

  it('null classification → no_action', () => {
    const d = decideLane({
      classificationTitle: null,
      litigationListingId: null,
      eligibleFirmId: null,
      hasDisplayFirm: false,
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
    });
    expect(typeof d.reason).toBe('string');
    expect(d.reason.length).toBeGreaterThan(0);
  });
});
