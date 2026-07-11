/**
 * Integration — a completed litigation-matched session with no classification
 * (Ada never called set_classification) is unblocked by the backfill: the
 * package assembles instead of throwing, and the case routes to the
 * litigation's firm.
 *
 * This is the Niles v. Hilton repro: intake completed + litigation bound +
 * classification null → previously no readout, no case, no email.
 *
 * Ref: /triage — litigation-matched intake completes with no classification.
 */

import { describe, it, expect } from 'vitest';
import {
  InMemoryDbClient,
  InMemoryClock,
  InMemoryAuditClient,
} from '@/engine/clients/inMemoryClients';
import { backfillClassificationFromLitigation } from '@/engine/package/backfillClassification';
import { assemblePackage } from '@/engine/package/assemble';
import { createCaseForSession } from '@/engine/routing/createCaseForSession';
import type { AdaSessionState } from '@/engine/types';
import type { LitigationAdminRow } from '@/engine/clients/types';

const LIT_ID = 'lit-hilton';
const FIRM_ID = 'firm-spinal';

function seed() {
  const db = new InMemoryDbClient();
  db.adminLitigation.push({
    id: LIT_ID,
    kind: 'class',
    caseName: 'Niles v. Hilton',
    legalTheory: '42 USC §12182',
  } as unknown as LitigationAdminRow);
  db.litigationFirmAssignments.push({
    id: 'assign-1',
    litigationListingId: LIT_ID,
    lawFirmId: FIRM_ID,
    assignedByUserId: null,
    receivesMatches: true,
    optedInAt: new Date(0).toISOString(),
    createdAt: new Date(0).toISOString(),
  });
  db.lawFirms.push({
    id: FIRM_ID,
    name: 'The Spinal Cord Injury Law Firm',
    status: 'active',
    isPilot: true,
    stripeCustomerId: null,
  } as unknown as import('@/engine/clients/types').LawFirmRow);
  return { db, clock: new InMemoryClock(), audit: new InMemoryAuditClient() };
}

function completedLitigationSession(): AdaSessionState {
  return {
    sessionId: 'sess-hilton',
    orgId: 'org-1',
    sessionType: 'public_ada',
    status: 'completed',
    litigationListingId: LIT_ID,
    classification: null, // Ada matched the litigation but never classified.
    conversationHistory: [
      { role: 'user', content: 'I use a power wheelchair and stayed at a Hilton...', timestamp: '2026-07-08T00:00:00Z' },
    ],
    metadata: {},
    extractedFields: {
      business_name: { value: 'Hilton', confidence: 1, extracted_at: '2026-07-08T00:00:00Z' },
    },
  } as unknown as AdaSessionState;
}

describe('backfill unblocks a litigation-matched, unclassified completion', () => {
  it('package throws without a classification (the bug)', () => {
    const state = completedLitigationSession();
    expect(() => assemblePackage({ state })).toThrow();
  });

  it('after backfill: classification derived, package assembles, case routes to the firm', async () => {
    const c = seed();
    const state = completedLitigationSession();

    const backfilled = await backfillClassificationFromLitigation(c.db, state);
    expect(backfilled.classification?.title).toBe('class_action');

    // Package now assembles instead of throwing.
    const pkg = assemblePackage({ state: backfilled });
    expect(pkg.slug).toBeTruthy();

    // And the case routes to the litigation's firm.
    const caseRow = await createCaseForSession(c, backfilled);
    expect(caseRow).not.toBeNull();
    expect(caseRow?.lane).toBe('routed_firm');
    expect(caseRow?.firmId).toBe(FIRM_ID);
  });
});
