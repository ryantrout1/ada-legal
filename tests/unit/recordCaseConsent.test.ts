/**
 * Layer 1 tests for consent recording (Phase 1b).
 *
 * recordCaseConsent flips a case's consent_to_share, stamps consent_at/scope,
 * and writes one CONSENT case_activity row — idempotently. getCaseBySessionId
 * is the read the consent endpoint uses to resolve a readout slug to its case.
 *
 * Encodes /plan Phase 1b acceptance criteria 2 (+ the no-case path of 5).
 */

import { describe, it, expect } from 'vitest';
import { InMemoryDbClient } from '@/engine/clients/inMemoryClients';

async function seedCase(db: InMemoryDbClient, sessionId: string) {
  return db.createCase({
    orgId: 'org-1',
    adaSessionId: sessionId,
    litigationListingId: 'lit-1',
    lane: 'routed_firm',
    firmId: 'firm-1',
    classificationTitle: 'III',
    classificationStandard: null,
    matchConfidence: null,
    jurisdictionState: null,
    routedAt: null,
    firstContactDue: null,
    routingReason: 'test',
  });
}

describe('getCaseBySessionId', () => {
  it('returns the case for a session, or null when none', async () => {
    const db = new InMemoryDbClient();
    await seedCase(db, 'sess-1');
    const found = await db.getCaseBySessionId('sess-1');
    expect(found?.adaSessionId).toBe('sess-1');
    expect(await db.getCaseBySessionId('nope')).toBeNull();
  });
});

describe('recordCaseConsent', () => {
  it('flips consent_to_share and writes a single CONSENT activity row', async () => {
    const db = new InMemoryDbClient();
    await seedCase(db, 'sess-1');
    const res = await db.recordCaseConsent({ sessionId: 'sess-1', scope: 'matched_firm' });
    expect(res).not.toBeNull();
    expect(res!.alreadyConsented).toBe(false);
    expect(res!.caseRow.consentToShare).toBe(true);
    expect(db.caseActivity.filter((a) => a.eventType === 'CONSENT')).toHaveLength(1);
  });

  it('is idempotent — a second consent is a no-op (alreadyConsented, no duplicate activity)', async () => {
    const db = new InMemoryDbClient();
    await seedCase(db, 'sess-1');
    await db.recordCaseConsent({ sessionId: 'sess-1', scope: 'matched_firm' });
    const second = await db.recordCaseConsent({ sessionId: 'sess-1', scope: 'matched_firm' });
    expect(second!.alreadyConsented).toBe(true);
    expect(db.caseActivity.filter((a) => a.eventType === 'CONSENT')).toHaveLength(1);
  });

  it('returns null when no case exists for the session', async () => {
    const db = new InMemoryDbClient();
    expect(await db.recordCaseConsent({ sessionId: 'ghost', scope: 'matched_firm' })).toBeNull();
  });
});
