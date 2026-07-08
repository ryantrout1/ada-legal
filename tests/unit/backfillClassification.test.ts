/**
 * Unit — backfillClassificationFromLitigation derives a classification from a
 * matched litigation when Ada ended the session without calling
 * set_classification, so the readout + routing still fire.
 *
 * Ref: /triage — litigation-matched intake completes with no classification.
 */

import { describe, it, expect } from 'vitest';
import { backfillClassificationFromLitigation } from '@/engine/package/backfillClassification';
import type { AdaSessionState } from '@/engine/types';
import type { DbClient, LitigationAdminRow, LitigationKind } from '@/engine/clients/types';

function fakeDb(lit: Partial<LitigationAdminRow> | null): Pick<DbClient, 'getLitigationById'> {
  return {
    getLitigationById: async () => (lit ? (lit as LitigationAdminRow) : null),
  };
}

function litigation(kind: LitigationKind): Partial<LitigationAdminRow> {
  return { id: 'lit-1', kind, caseName: 'Niles v. Hilton', legalTheory: '42 USC §12182' };
}

function state(overrides: Partial<AdaSessionState>): AdaSessionState {
  return {
    sessionId: 'sess-1',
    orgId: 'org-1',
    sessionType: 'public_ada',
    status: 'completed',
    litigationListingId: null,
    classification: null,
    extractedFields: {},
    ...overrides,
  } as unknown as AdaSessionState;
}

describe('backfillClassificationFromLitigation', () => {
  it('derives class_action for a class litigation', async () => {
    const out = await backfillClassificationFromLitigation(
      fakeDb(litigation('class')),
      state({ litigationListingId: 'lit-1' }),
    );
    expect(out.classification?.title).toBe('class_action');
    expect(out.classification?.standard).toBe('42 USC §12182');
    expect(out.classification?.reasoning).toContain('Niles v. Hilton');
  });

  it('derives Title III for enforcement/decree/pattern kinds', async () => {
    for (const kind of ['enforcement_action', 'consent_decree', 'pattern_of_practice'] as const) {
      const out = await backfillClassificationFromLitigation(
        fakeDb(litigation(kind)),
        state({ litigationListingId: 'lit-1' }),
      );
      expect(out.classification?.title).toBe('III');
    }
  });

  it('is a no-op when Ada already classified', async () => {
    const already = state({
      litigationListingId: 'lit-1',
      classification: { title: 'II', tier: 'high', reasoning: 'r', standard: '§35.130' },
    });
    const out = await backfillClassificationFromLitigation(fakeDb(litigation('class')), already);
    expect(out.classification?.title).toBe('II'); // unchanged
    expect(out).toBe(already);
  });

  it('is a no-op when no litigation is bound', async () => {
    const s = state({ litigationListingId: null });
    const out = await backfillClassificationFromLitigation(fakeDb(litigation('class')), s);
    expect(out.classification).toBeNull();
    expect(out).toBe(s);
  });

  it('is a no-op when the litigation row is missing', async () => {
    const s = state({ litigationListingId: 'gone' });
    const out = await backfillClassificationFromLitigation(fakeDb(null), s);
    expect(out.classification).toBeNull();
    expect(out).toBe(s);
  });
});
