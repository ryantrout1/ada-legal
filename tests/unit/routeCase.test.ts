/**
 * Layer 1 tests for the lane router.
 *
 * decideLane is the pure heart of Phase 1a: given a completed session's
 * classification + litigation binding + resolved firm, it picks exactly one
 * of the five lanes. No I/O. Encodes /plan Phase 1a acceptance criteria 1-3.
 */

import { describe, it, expect } from 'vitest';
import { decideLane } from '@/engine/routing/routeCase';
import type { AdaTitle } from '@/types/db';

describe('decideLane — matched litigation', () => {
  it('litigation WITH a firm → routed_firm, carrying the firm id', () => {
    const d = decideLane({
      classificationTitle: 'III',
      litigationListingId: 'lit-1',
      litigationFirmId: 'firm-1',
    });
    expect(d.lane).toBe('routed_firm');
    expect(d.firmId).toBe('firm-1');
  });

  it('litigation WITHOUT a firm → sourcing, no firm', () => {
    const d = decideLane({
      classificationTitle: 'class_action',
      litigationListingId: 'lit-1',
      litigationFirmId: null,
    });
    expect(d.lane).toBe('sourcing');
    expect(d.firmId).toBeNull();
  });

  it('a matched litigation routes by its firm regardless of title', () => {
    // An out_of_scope title still routes to the firm when the user confirmed
    // a litigation match — the match is the stronger signal.
    const d = decideLane({
      classificationTitle: 'out_of_scope',
      litigationListingId: 'lit-1',
      litigationFirmId: 'firm-1',
    });
    expect(d.lane).toBe('routed_firm');
  });
});

describe('decideLane — no litigation', () => {
  it.each<AdaTitle>(['I', 'II', 'III', 'class_action'])(
    'actionable title %s → general_queue',
    (title) => {
      const d = decideLane({
        classificationTitle: title,
        litigationListingId: null,
        litigationFirmId: null,
      });
      expect(d.lane).toBe('general_queue');
      expect(d.firmId).toBeNull();
    },
  );

  it.each<AdaTitle>(['out_of_scope', 'none'])('non-actionable title %s → no_action', (title) => {
    const d = decideLane({
      classificationTitle: title,
      litigationListingId: null,
      litigationFirmId: null,
    });
    expect(d.lane).toBe('no_action');
  });

  it('null classification → no_action', () => {
    const d = decideLane({
      classificationTitle: null,
      litigationListingId: null,
      litigationFirmId: null,
    });
    expect(d.lane).toBe('no_action');
  });
});

describe('decideLane — reason', () => {
  it('always returns a non-empty human reason for the audit trail', () => {
    const d = decideLane({
      classificationTitle: 'III',
      litigationListingId: null,
      litigationFirmId: null,
    });
    expect(typeof d.reason).toBe('string');
    expect(d.reason.length).toBeGreaterThan(0);
  });
});
