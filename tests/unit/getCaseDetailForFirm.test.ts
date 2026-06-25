/**
 * Layer 1 test — cases-backed case detail (Phase 2b).
 *
 * getCaseDetailForFirm is firm-scoped + consent-gated and returns the case
 * header, claimant, qualifying answers, transcript, and activity. Out-of-firm
 * or unconsented → null (the 404 boundary).
 *
 * Encodes /plan Phase 2b acceptance criteria.
 */

import { describe, it, expect } from 'vitest';
import { InMemoryDbClient } from '@/engine/clients/inMemoryClients';
import type { AdaSessionState } from '@/engine/types';

const ORG = 'org-1';
const field = (value: unknown) => ({ value, confidence: 0.9, extracted_at: '2026-01-01T00:00:00.000Z' });

function session(sessionId: string): AdaSessionState {
  return {
    sessionId,
    orgId: ORG,
    sessionType: 'public_ada',
    status: 'completed',
    litigationListingId: null,
    extractedFields: {
      claimant_name: field('Jane Doe'),
      claimant_email: field('jane@x.com'),
      barrier_type: field('No ramp at entrance'),
    },
    conversationHistory: [{ role: 'assistant', content: 'Hello' }],
    classification: null,
    metadata: {},
    accessibilitySettings: {},
    isTest: true,
  } as unknown as AdaSessionState;
}

async function seed(db: InMemoryDbClient, sessionId: string, firmId: string, consented: boolean) {
  await db.writeSession({ state: session(sessionId) });
  const { caseRow } = await db.createCase({
    orgId: ORG, adaSessionId: sessionId, litigationListingId: null, lane: 'routed_firm',
    firmId, classificationTitle: 'III', classificationStandard: null, matchConfidence: null,
    jurisdictionState: 'AZ', routedAt: null, firstContactDue: null, routingReason: 'test',
  });
  if (consented) await db.recordCaseConsent({ sessionId, scope: 'matched_firm' });
  return caseRow;
}

describe('getCaseDetailForFirm', () => {
  it('returns the full detail for a firm-owned consented case', async () => {
    const db = new InMemoryDbClient();
    const c = await seed(db, 's1', 'firm-1', true);
    const d = await db.getCaseDetailForFirm(c.id, 'firm-1');
    expect(d).not.toBeNull();
    expect(d!.caseNumber).toBe(c.caseNumber);
    expect(d!.claimantName).toBe('Jane Doe');
    expect(d!.classificationTitle).toBe('III');
    expect(d!.jurisdictionState).toBe('AZ');
    expect(d!.qualifyingAnswers).toEqual([{ question: 'barrier_type', answer: 'No ramp at entrance' }]);
    expect(d!.transcript).toHaveLength(1);
    // ROUTED + CONSENT activity present
    expect(d!.activity.map((a) => a.eventType)).toEqual(expect.arrayContaining(['ROUTED', 'CONSENT']));
  });

  it('returns null for another firm (404 boundary)', async () => {
    const db = new InMemoryDbClient();
    const c = await seed(db, 's1', 'firm-1', true);
    expect(await db.getCaseDetailForFirm(c.id, 'firm-2')).toBeNull();
  });

  it('returns null for an unconsented case (consent gate)', async () => {
    const db = new InMemoryDbClient();
    const c = await seed(db, 's1', 'firm-1', false);
    expect(await db.getCaseDetailForFirm(c.id, 'firm-1')).toBeNull();
  });
});
