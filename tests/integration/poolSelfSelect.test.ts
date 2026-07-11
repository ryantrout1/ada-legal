/**
 * Integration — the self-select pool (routing rebuild R4).
 *
 * listPoolCases returns only consented, unclaimed pool cases as de-identified
 * rows (no claimant PII). claimPoolCase is atomic first-come-wins: a second
 * claim of the same case loses; a claimed case leaves the pool and enters the
 * claiming firm's queue; an unconsented pool case can't be claimed.
 *
 * Ref: /plan "Self-select pool (R4)", Phase 1.
 */

import { describe, it, expect } from 'vitest';
import { InMemoryDbClient } from '@/engine/clients/inMemoryClients';
import type { CaseRow } from '@/engine/clients/types';
import type { AdaSessionState } from '@/engine/types';

async function seedPoolCase(
  db: InMemoryDbClient,
  opts: {
    sessionId: string;
    jurisdictionState: string | null;
    businessName?: string | null;
    consent: boolean;
    lane?: 'pool' | 'routed_firm';
    firmId?: string | null;
  },
): Promise<CaseRow> {
  db.sessions.set(opts.sessionId, {
    extractedFields: opts.businessName
      ? { business_name: { value: opts.businessName } }
      : {},
  } as unknown as AdaSessionState);

  const { caseRow } = await db.createCase({
    orgId: 'org-1',
    adaSessionId: opts.sessionId,
    litigationListingId: null,
    lane: opts.lane ?? 'pool',
    firmId: opts.firmId ?? null,
    classificationTitle: 'III',
    classificationStandard: '§206',
    matchConfidence: null,
    jurisdictionState: opts.jurisdictionState,
    routedAt: null,
    firstContactDue: null,
    routingReason: 'actionable, no litigation match',
  });
  if (opts.consent) await db.recordCaseConsent({ sessionId: opts.sessionId, scope: 'pool' });
  return caseRow;
}

describe('listPoolCases', () => {
  it('returns only consented, unclaimed pool cases — de-identified (no PII)', async () => {
    const db = new InMemoryDbClient();
    await seedPoolCase(db, { sessionId: 's1', jurisdictionState: 'AZ', businessName: 'Marriott', consent: true });
    await seedPoolCase(db, { sessionId: 's2', jurisdictionState: 'TX', businessName: 'Hilton', consent: true });
    await seedPoolCase(db, { sessionId: 's3', jurisdictionState: 'AZ', consent: false }); // unconsented
    await seedPoolCase(db, { sessionId: 's4', jurisdictionState: 'AZ', consent: true, lane: 'routed_firm', firmId: 'firm-x' }); // not pool

    const rows = await db.listPoolCases();
    expect(rows).toHaveLength(2);

    // De-identified: no claimant name / email / phone anywhere in the payload.
    for (const r of rows) {
      const keys = Object.keys(r);
      expect(keys).not.toContain('clientContactName');
      expect(keys).not.toContain('clientContactEmail');
      expect(keys).not.toContain('clientContactPhone');
      expect(JSON.stringify(r)).not.toMatch(/email|phone/i);
    }
    // Establishment (not PII) is surfaced.
    expect(rows.map((r) => r.businessName).sort()).toEqual(['Hilton', 'Marriott']);
  });
});

describe('claimPoolCase — atomic first-come-wins', () => {
  it('first claim wins, second loses; claimed case leaves the pool and enters the firm queue', async () => {
    const db = new InMemoryDbClient();
    const c = await seedPoolCase(db, { sessionId: 's1', jurisdictionState: 'AZ', businessName: 'Marriott', consent: true });

    const first = await db.claimPoolCase({ caseId: c.id, lawFirmId: 'firm-a', attorneyId: 'att-a' });
    expect(first).not.toBeNull();
    expect(first!.caseRow.firmId).toBe('firm-a');
    expect(first!.caseRow.status).toBe('investigating');

    // Second claim of the same case loses the race.
    const second = await db.claimPoolCase({ caseId: c.id, lawFirmId: 'firm-b', attorneyId: 'att-b' });
    expect(second).toBeNull();

    // Gone from the pool.
    expect((await db.listPoolCases()).map((r) => r.id)).not.toContain(c.id);

    // In the claiming firm's queue (consented + firm-owned).
    const queue = await db.listCasesForFirm('firm-a');
    const allQueued = [...queue.groups.new, ...queue.groups.working, ...queue.groups.resolved];
    expect(allQueued.map((q) => q.caseId)).toContain(c.id);
  });

  it('an unconsented pool case cannot be claimed', async () => {
    const db = new InMemoryDbClient();
    const c = await seedPoolCase(db, { sessionId: 's1', jurisdictionState: 'AZ', consent: false });
    expect(await db.claimPoolCase({ caseId: c.id, lawFirmId: 'firm-a', attorneyId: 'att-a' })).toBeNull();
  });
});
